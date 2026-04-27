import { Command } from "commander"
import { getClient } from "../client"
import { success, printJson, printData } from "../output"
import { handleError } from "../errors"
import type { OutlineResponse } from "../types/api"

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

function parseOptions(raw: string): Array<{ text: string; status?: string }> {
  return raw.split(",").map((o) => {
    const trimmed = o.trim()
    if (trimmed.startsWith("+")) {
      return { text: trimmed.slice(1), status: "approve" }
    }
    if (trimmed.startsWith("-")) {
      return { text: trimmed.slice(1), status: "reject" }
    }
    return { text: trimmed }
  })
}

export function registerOutlineCommand(program: Command): void {
  const outline = program
    .command("outline")
    .description("Manage study guide outline — sections and questions")

  // ── outline show ─────────────────────────────────────────

  outline
    .command("show <slug>")
    .description("Show study guide outline")
    .action(async (slug: string) => {
      try {
        const client = getClient()
        const data = await client.get<OutlineResponse>(`/interviews/${slug}/outline`)

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
              item.readableId ?? "-",
              item.questionType ?? item.itemType,
              item.text,
            ])
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
    .option("--type <type>", "Section type: flat, screening, concept", "flat")
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
    .option("--type <type>", "New section type")
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
    .option("--follow-up <level>", "Follow-up: none, light, heavy, auto")
    .option("--options <opts>", "Comma-separated options, use +/- prefix for approve/reject (e.g. +全职,-学生,其他)")
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

        const data = await client.post(`/interviews/${slug}/sections/${sectionId}/questions`, body)
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
    .option("--follow-up <level>", "New follow-up level")
    .option("--options <opts>", "New comma-separated options, use +/- prefix for approve/reject")
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

        const data = await client.patch(`/interviews/${slug}/questions/${questionId}`, body)
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
}
