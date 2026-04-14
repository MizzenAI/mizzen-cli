import { Command } from "commander"
import { getClient } from "../client"
import { success, printJson } from "../output"
import { handleError } from "../errors"

/**
 * Parse options string with +/- prefix for approve/reject status.
 * "+全职" → { text: "全职", status: "approve" }
 * "-学生" → { text: "学生", status: "reject" }
 * "其他"  → { text: "其他" }
 */
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

export function registerQuestionsCommand(program: Command): void {
  const questions = program
    .command("questions")
    .description("Manage study guide sections and questions")

  // --- Sections ---

  questions
    .command("add-section <slug>")
    .description("Add a section to the study guide")
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

  questions
    .command("update-section <slug> <section-id>")
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

  questions
    .command("delete-section <slug> <section-id>")
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

  questions
    .command("reorder-sections <slug>")
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

  // --- Questions ---

  questions
    .command("add <slug> <section-id>")
    .description("Add a question to a section")
    .requiredOption("--text <text>", "Question text")
    .option("--type <type>", "Question type: open_ended, multiple_choice, scale, statement", "open_ended")
    .option("--follow-up <level>", "Follow-up: none, light, heavy, auto")
    .option("--options <opts>", "Comma-separated options, use +/- prefix for approve/reject (e.g. +全职,-学生,其他)")
    .option("--min-label <label>", "Scale min label (for scale type)")
    .option("--max-label <label>", "Scale max label (for scale type)")
    .option("--instructions <text>", "Interview guide instructions")
    .option("--after <uuid>", "Insert after this question UUID")
    .option("--payload <json>", "Raw JSON body (overrides all other options)")
    .action(async (slug: string, sectionId: string, opts: {
      text: string; type: string; followUp?: string; options?: string;
      minLabel?: string; maxLabel?: string; instructions?: string; after?: string;
      payload?: string
    }) => {
      try {
        const client = getClient()
        let body: Record<string, unknown>

        if (opts.payload) {
          body = JSON.parse(opts.payload)
        } else {
          body = {
            text: opts.text,
            questionType: opts.type,
            itemType: opts.type === "statement" ? "statement" : "question",
          }
          if (opts.followUp) body["followUp"] = opts.followUp
          if (opts.options) body["options"] = parseOptions(opts.options)
          if (opts.minLabel || opts.maxLabel) {
            body["scaleConfig"] = { minLabel: opts.minLabel ?? "", maxLabel: opts.maxLabel ?? "" }
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

  questions
    .command("update <slug> <question-id>")
    .description("Update a question")
    .option("--text <text>", "New question text")
    .option("--type <type>", "New question type")
    .option("--follow-up <level>", "New follow-up level")
    .option("--options <opts>", "New comma-separated options, use +/- prefix for approve/reject")
    .option("--min-label <label>", "New scale min label")
    .option("--max-label <label>", "New scale max label")
    .option("--instructions <text>", "New interview guide instructions")
    .option("--payload <json>", "Raw JSON body (overrides all other options)")
    .action(async (slug: string, questionId: string, opts: {
      text?: string; type?: string; followUp?: string; options?: string;
      minLabel?: string; maxLabel?: string; instructions?: string; payload?: string
    }) => {
      try {
        const client = getClient()
        let body: Record<string, unknown>

        if (opts.payload) {
          body = JSON.parse(opts.payload)
        } else {
          body = {}
          if (opts.text) body["text"] = opts.text
          if (opts.type) body["questionType"] = opts.type
          if (opts.followUp) body["followUp"] = opts.followUp
          if (opts.options) body["options"] = parseOptions(opts.options)
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

  questions
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

  questions
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
