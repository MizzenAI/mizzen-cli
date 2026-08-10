import { Command } from "commander"
import { randomUUID } from "node:crypto"
import { getClient } from "../client"
import { success, printJson, printData } from "../output"
import { handleError } from "../errors"
import type { OutlineItem, OutlineResponse, StudyGuideOption, StudyGuideOptionValue } from "../types/api"

/**
 * Parse options string with +/- prefix for approve/reject status.
 * "+全职" → { text: "全职", status: "approve" }
 * "-学生" → { text: "学生", status: "reject" }
 * "其他"  → { text: "其他" }
 */
function parsePayload(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Error(`Invalid --payload JSON: ${msg}`)
  }
}

export function parseOptions(raw: string): Array<{ id: string; text: string; status?: string }> {
  return raw.split(",").map((o) => {
    const trimmed = o.trim()
    if (trimmed.startsWith("+")) {
      return { id: randomUUID(), text: trimmed.slice(1), status: "approve" }
    }
    if (trimmed.startsWith("-")) {
      return { id: randomUUID(), text: trimmed.slice(1), status: "reject" }
    }
    return { id: randomUUID(), text: trimmed }
  })
}

export function withStableOptionIds(body: Record<string, unknown>): Record<string, unknown> {
  const options = body["options"]
  if (!Array.isArray(options)) return body

  return {
    ...body,
    options: options.map((option) => {
      if (typeof option === "string") return { id: randomUUID(), text: option }
      if (typeof option !== "object" || option === null || Array.isArray(option)) return option
      if (Object.hasOwn(option, "id")) return option
      return { ...option, id: randomUUID() }
    }),
  }
}

export function resolveQuestionType(
  item: { itemType?: unknown; questionType?: unknown },
  fallback = "open_ended",
): string {
  return item.itemType === "statement"
    ? "statement"
    : typeof item.questionType === "string"
      ? item.questionType
      : fallback
}

export function assertFollowUpSupported(body: Record<string, unknown>, currentQuestionType = "open_ended"): void {
  if (!Object.hasOwn(body, "followUp") && !Object.hasOwn(body, "timeBudget")) return

  const questionType = resolveQuestionType(body, currentQuestionType)
  if (questionType !== "open_ended") {
    throw new Error(`Question type '${questionType}' does not support follow-up`)
  }
}

function optionValue(option: StudyGuideOption): StudyGuideOptionValue | null {
  return typeof option === "string" ? null : option
}

export function findQuestion(outline: OutlineResponse, questionId: string): OutlineItem {
  const question = outline.outline
    .flatMap((section) => section.items)
    .find((item) => item.id === questionId)

  if (!question) throw new Error(`Question '${questionId}' not found`)
  return question
}

export function findQuestionOptions(outline: OutlineResponse, questionId: string): StudyGuideOption[] {
  const question = findQuestion(outline, questionId)
  if (!question.options) throw new Error(`Question '${questionId}' has no options`)
  return question.options
}

function findOptionIndex(options: StudyGuideOption[], optionId: string): number {
  const index = options.findIndex((option) => optionValue(option)?.id === optionId)
  if (index === -1) throw new Error(`Option '${optionId}' not found`)
  return index
}

export function updateOptionById(
  options: StudyGuideOption[],
  optionId: string,
  changes: Partial<Pick<StudyGuideOptionValue, "text" | "status">>,
): StudyGuideOption[] {
  const index = findOptionIndex(options, optionId)
  const current = optionValue(options[index]!)!
  const updated = [...options]
  updated[index] = { ...current, ...changes }
  return updated
}

export function deleteOptionById(options: StudyGuideOption[], optionId: string): StudyGuideOption[] {
  const index = findOptionIndex(options, optionId)
  return options.filter((_, optionIndex) => optionIndex !== index)
}

export function reorderOptions(options: StudyGuideOption[], optionIds: string[]): StudyGuideOption[] {
  const currentIds = options.map((option) => optionValue(option)?.id)
  if (currentIds.some((id) => !id)) {
    throw new Error("All options require stable ids before reordering")
  }
  if (optionIds.length !== options.length || new Set(optionIds).size !== optionIds.length) {
    throw new Error("Reorder must include every option id exactly once")
  }
  const byId = new Map(options.map((option) => [optionValue(option)!.id!, option]))
  return optionIds.map((id) => {
    const option = byId.get(id)
    if (!option) throw new Error(`Option '${id}' not found`)
    return option
  })
}

function parseStatus(status?: string): StudyGuideOptionValue["status"] {
  if (status === undefined || status === "approve" || status === "reject" || status === "neutral") {
    return status
  }
  throw new Error("Status must be approve, reject, or neutral")
}

async function getQuestionOptions(slug: string, questionId: string): Promise<StudyGuideOption[]> {
  const outline = await getClient().get<OutlineResponse>(`/interviews/${slug}/outline`)
  return findQuestionOptions(outline, questionId)
}

async function getQuestionType(slug: string, questionId: string): Promise<string> {
  const outline = await getClient().get<OutlineResponse>(`/interviews/${slug}/outline`)
  return resolveQuestionType(findQuestion(outline, questionId))
}

async function saveQuestionOptions(slug: string, questionId: string, options: StudyGuideOption[]): Promise<unknown> {
  return getClient().patch(`/interviews/${slug}/questions/${questionId}`, { options })
}

export function registerOutlineCommand(program: Command): void {
  const outline = program
    .command("outline")
    .description("Manage study guide outline — sections and questions")

  // ── outline show ─────────────────────────────────────────

  outline
    .command("show <slug>")
    .description("Show study guide outline")
    .option("--json", "Output the complete study guide as JSON")
    .action(async (slug: string, opts: { json?: boolean }) => {
      try {
        const client = getClient()
        const data = await client.get<OutlineResponse>(`/interviews/${slug}/outline`)

        if (opts.json) {
          printJson(data)
          return
        }

        const rows: string[][] = []
        for (const section of data.outline) {
          rows.push([
            section.readableId ?? "-",
            `[${section.sectionType}] ${section.sectionTitle}`,
            "",
            "",
          ])
          for (const item of section.items) {
            rows.push([
              "",
              item.id ?? "-",
              item.questionType ?? item.itemType,
              item.text,
            ])
            for (const option of item.options ?? []) {
              const value = optionValue(option)
              rows.push([
                "",
                value?.id ?? "-",
                value?.status ? `option:${value.status}` : "option",
                typeof option === "string" ? option : option.text,
              ])
            }
          }
        }

        printData(
          ["Section", "ID", "Type", "Text"],
          rows,
          data,
        )
      } catch (err) {
        handleError(err)
      }
    })

  // ── outline section ──────────────────────────────────────

  const section = outline
    .command("section")
    .description("Manage sections")

  section
    .command("add <slug>")
    .description("Add a section")
    .requiredOption("-t, --title <title>", "Section title")
    .option("--type <type>", "Section type: flat or screening", "flat")
    .option("--description <desc>", "Section description")
    .option("--after <uuid>", "Insert after this section UUID")
    .action(async (slug: string, opts: { title: string; type: string; description?: string; after?: string }) => {
      try {
        const client = getClient()
        const body: Record<string, unknown> = {
          title: opts.title,
          sectionType: opts.type,
        }
        if (opts.description) body["description"] = opts.description
        if (opts.after) body["after"] = opts.after

        const data = await client.post(`/interviews/${slug}/sections`, body)
        success("Section added")
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })

  section
    .command("update <slug> <section-id>")
    .description("Update a section")
    .option("-t, --title <title>", "New title")
    .option("--type <type>", "New section type: flat or screening")
    .option("--description <desc>", "New description")
    .action(async (slug: string, sectionId: string, opts: { title?: string; type?: string; description?: string }) => {
      try {
        const client = getClient()
        const body: Record<string, unknown> = {}
        if (opts.title) body["title"] = opts.title
        if (opts.type) body["sectionType"] = opts.type
        if (opts.description) body["description"] = opts.description

        const data = await client.patch(`/interviews/${slug}/sections/${sectionId}`, body)
        success("Section updated")
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })

  section
    .command("delete <slug> <section-id>")
    .description("Delete a section and all its questions")
    .action(async (slug: string, sectionId: string) => {
      try {
        const client = getClient()
        await client.delete(`/interviews/${slug}/sections/${sectionId}`)
        success("Section deleted")
      } catch (err) {
        handleError(err)
      }
    })

  section
    .command("reorder <slug>")
    .description("Reorder sections by UUID list")
    .argument("<uuids...>", "Ordered section UUIDs")
    .action(async (slug: string, uuids: string[]) => {
      try {
        const client = getClient()
        const data = await client.put(`/interviews/${slug}/sections/reorder`, { order: uuids })
        success("Sections reordered")
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })

  // ── outline question ─────────────────────────────────────

  const question = outline
    .command("question")
    .description("Manage questions")

  question
    .command("add <slug> <section-id>")
    .description("Add a question to a section")
    .requiredOption("--text <text>", "Question text")
    .option("--type <type>", "Question type: open_ended, multiple_choice, scale, submission, statement", "open_ended")
    .option("--follow-up <level>", "Follow-up for open-ended questions: none, light, heavy, auto")
    .option("--options <opts>", "Comma-separated options; UUIDs are generated automatically (e.g. +全职,-学生,其他)")
    .option("--multi-select", "Allow multiple selections (for multiple_choice)")
    .option("--min-label <label>", "Scale min label (for scale type)")
    .option("--max-label <label>", "Scale max label (for scale type)")
    .option("--allow-text", "Allow text input (for submission type, default: true)")
    .option("--no-allow-text", "Disable text input (for submission type)")
    .option("--allow-media", "Allow media upload (for submission type, default: true)")
    .option("--no-allow-media", "Disable media upload (for submission type)")
    .option("--max-files <n>", "Max files for submission (default: 5)")
    .option("--accepted-types <types>", "Accepted file types: image,video,document (default: all)")
    .option("--instructions <text>", "Interview guide instructions")
    .option("--after <uuid>", "Insert after this question UUID")
    .option("--payload <json>", "Raw JSON body (overrides all other options)")
    .action(async (slug: string, sectionId: string, opts: {
      text: string; type: string; followUp?: string; options?: string;
      multiSelect?: boolean; minLabel?: string; maxLabel?: string;
      allowText?: boolean; allowMedia?: boolean; maxFiles?: string; acceptedTypes?: string;
      instructions?: string; after?: string; payload?: string
    }) => {
      try {
        const client = getClient()
        let body: Record<string, unknown>

        if (opts.payload) {
          body = parsePayload(opts.payload)
        } else {
          body = {
            text: opts.text,
            questionType: opts.type,
            itemType: opts.type === "statement" ? "statement" : "question",
          }
          if (opts.followUp) body["followUp"] = opts.followUp
          if (opts.options) body["options"] = parseOptions(opts.options)
          if (opts.multiSelect) body["multiSelect"] = true
          if (opts.minLabel || opts.maxLabel) {
            body["scaleConfig"] = { minLabel: opts.minLabel ?? "", maxLabel: opts.maxLabel ?? "" }
          }
          if (opts.type === "submission" || opts.allowText !== undefined || opts.allowMedia !== undefined) {
            const subConfig: Record<string, unknown> = {
              allowText: opts.allowText ?? true,
              allowMedia: opts.allowMedia ?? true,
              maxFiles: opts.maxFiles ? parseInt(opts.maxFiles, 10) : 5,
              acceptedTypes: opts.acceptedTypes ? opts.acceptedTypes.split(",").map(t => t.trim()) : ["image", "video", "document"],
            }
            body["submissionConfig"] = subConfig
          }
          if (opts.instructions) body["addInstructions"] = opts.instructions
          if (opts.after) body["after"] = opts.after
        }

        assertFollowUpSupported(body)

        const data = await client.post(
          `/interviews/${slug}/sections/${sectionId}/questions`,
          withStableOptionIds(body),
        )
        success("Question added")
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })

  question
    .command("update <slug> <question-id>")
    .description("Update a question")
    .option("--text <text>", "New question text")
    .option("--type <type>", "New question type")
    .option("--follow-up <level>", "New follow-up level for an open-ended question")
    .option("--options <opts>", "Replace options with new UUIDs; use --payload to preserve existing option ids")
    .option("--multi-select", "Allow multiple selections")
    .option("--no-multi-select", "Single selection only")
    .option("--min-label <label>", "New scale min label")
    .option("--max-label <label>", "New scale max label")
    .option("--instructions <text>", "New interview guide instructions")
    .option("--payload <json>", "Raw JSON body (overrides all other options)")
    .action(async (slug: string, questionId: string, opts: {
      text?: string; type?: string; followUp?: string; options?: string;
      multiSelect?: boolean; minLabel?: string; maxLabel?: string; instructions?: string; payload?: string
    }) => {
      try {
        const client = getClient()
        let body: Record<string, unknown>

        if (opts.payload) {
          body = parsePayload(opts.payload)
        } else {
          body = {}
          if (opts.text) body["text"] = opts.text
          if (opts.type) body["questionType"] = opts.type
          if (opts.followUp) body["followUp"] = opts.followUp
          if (opts.options) body["options"] = parseOptions(opts.options)
          if (opts.multiSelect !== undefined) body["multiSelect"] = opts.multiSelect
          if (opts.minLabel || opts.maxLabel) {
            body["scaleConfig"] = { minLabel: opts.minLabel ?? "", maxLabel: opts.maxLabel ?? "" }
          }
          if (opts.instructions) body["addInstructions"] = opts.instructions
        }

        if (Object.hasOwn(body, "followUp") || Object.hasOwn(body, "timeBudget")) {
          const currentQuestionType = typeof body["questionType"] === "string"
            ? body["questionType"]
            : await getQuestionType(slug, questionId)
          assertFollowUpSupported(body, currentQuestionType)
        }

        const data = await client.patch(
          `/interviews/${slug}/questions/${questionId}`,
          withStableOptionIds(body),
        )
        success("Question updated")
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })

  question
    .command("delete <slug> <question-id>")
    .description("Delete a question")
    .action(async (slug: string, questionId: string) => {
      try {
        const client = getClient()
        await client.delete(`/interviews/${slug}/questions/${questionId}`)
        success("Question deleted")
      } catch (err) {
        handleError(err)
      }
    })

  question
    .command("reorder <slug> <section-id>")
    .description("Reorder questions within a section by UUID list")
    .argument("<uuids...>", "Ordered question UUIDs")
    .action(async (slug: string, sectionId: string, uuids: string[]) => {
      try {
        const client = getClient()
        const data = await client.put(`/interviews/${slug}/sections/${sectionId}/questions/reorder`, { order: uuids })
        success("Questions reordered")
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })

  const option = question
    .command("option")
    .description("Manage question options by stable option id")

  option
    .command("add <slug> <question-id>")
    .description("Add an option with a new UUID")
    .requiredOption("--text <text>", "Option text")
    .option("--status <status>", "Option status: approve, reject, neutral")
    .action(async (slug: string, questionId: string, opts: { text: string; status?: string }) => {
      try {
        const options = await getQuestionOptions(slug, questionId)
        const status = parseStatus(opts.status)
        const nextOption: StudyGuideOptionValue = {
          id: randomUUID(),
          text: opts.text,
          ...(status ? { status } : {}),
        }
        const data = await saveQuestionOptions(slug, questionId, [...options, nextOption])
        success(`Option added: ${nextOption.id}`)
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })

  option
    .command("update <slug> <question-id> <option-id>")
    .description("Update an option without changing its UUID")
    .option("--text <text>", "New option text")
    .option("--status <status>", "New status: approve, reject, neutral")
    .action(async (slug: string, questionId: string, optionId: string, opts: { text?: string; status?: string }) => {
      try {
        if (opts.text === undefined && opts.status === undefined) {
          throw new Error("Provide --text or --status")
        }
        const options = await getQuestionOptions(slug, questionId)
        const data = await saveQuestionOptions(slug, questionId, updateOptionById(options, optionId, {
          ...(opts.text !== undefined ? { text: opts.text } : {}),
          ...(opts.status !== undefined ? { status: parseStatus(opts.status) } : {}),
        }))
        success(`Option updated: ${optionId}`)
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })

  option
    .command("delete <slug> <question-id> <option-id>")
    .description("Delete an option by UUID")
    .action(async (slug: string, questionId: string, optionId: string) => {
      try {
        const options = await getQuestionOptions(slug, questionId)
        const data = await saveQuestionOptions(slug, questionId, deleteOptionById(options, optionId))
        success(`Option deleted: ${optionId}`)
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })

  option
    .command("reorder <slug> <question-id>")
    .description("Reorder options without changing their UUIDs")
    .argument("<option-ids...>", "Every option UUID in the desired order")
    .action(async (slug: string, questionId: string, optionIds: string[]) => {
      try {
        const options = await getQuestionOptions(slug, questionId)
        const data = await saveQuestionOptions(slug, questionId, reorderOptions(options, optionIds))
        success("Options reordered")
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })
}
