import { Command } from "commander"
import { getClient } from "../client"
import { colorStatus, formatDuration } from "../format"
import { printData, printKeyValue, printJson, success } from "../output"
import { handleError } from "../errors"
import type { Conversation, ConversationListResponse, TranscriptResponse, AnswersResponse } from "../types/api"

export function registerConversationsCommand(program: Command): void {
  const conversations = program
    .command("conversation")
    .description("Access conversation data")

  conversations
    .command("list <slug>")
    .description("List conversations for an interview")
    .option("-s, --status <status>", "Filter by status")
    .option("-p, --page <n>", "Page number", "1")
    .option("--size <n>", "Page size", "20")
    .action(async (slug: string, opts: { status?: string; page: string; size: string }) => {
      try {
        const client = getClient()
        const params: Record<string, string> = { page: opts.page, size: opts.size }
        if (opts.status) params["status"] = opts.status

        const data = await client.get<ConversationListResponse>(`/interviews/${slug}/conversations`, params)

        printData(
          ["#", "Participant", "Status", "Active Time", "Started"],
          data.items.map((c) => [
            String(c.readable_id),
            c.participant_name || "(anonymous)",
            colorStatus(c.status),
            formatDuration(c.active_time_seconds ?? c.duration_seconds),
            c.started_at?.slice(0, 16).replace("T", " ") ?? "-",
          ]),
          data,
        )
      } catch (err) {
        handleError(err)
      }
    })

  conversations
    .command("get <slug> <id>")
    .description("Get conversation details with messages")
    .action(async (slug: string, id: string) => {
      try {
        const client = getClient()
        const data = await client.get<Conversation>(`/interviews/${slug}/conversations/${id}`)

        printKeyValue([
          ["#", String(data.readable_id)],
          ["Participant", data.participant_name || "(anonymous)"],
          ["Status", data.status],
          ["Active Time", formatDuration(data.active_time_seconds ?? data.duration_seconds)],
          ["Started", data.started_at?.slice(0, 16).replace("T", " ") ?? "-"],
          ["Ended", data.ended_at?.slice(0, 16).replace("T", " ") ?? "-"],
          ["Messages", String(data.messages?.length ?? 0)],
        ])
      } catch (err) {
        handleError(err)
      }
    })

  conversations
    .command("transcript <slug> <id>")
    .description("Get conversation transcript as text")
    .action(async (slug: string, id: string) => {
      try {
        const client = getClient()
        const data = await client.get<TranscriptResponse>(`/interviews/${slug}/conversations/${id}/transcript`)
        process.stdout.write(data.transcript + "\n")
      } catch (err) {
        handleError(err)
      }
    })

  conversations
    .command("answers <slug> <id>")
    .description("Get structured answers (cleaned data)")
    .action(async (slug: string, id: string) => {
      try {
        const client = getClient()
        const data = await client.get<AnswersResponse>(`/interviews/${slug}/conversations/${id}/answers`)
        printJson(data)
      } catch (err) {
        handleError(err)
      }
    })

  conversations
    .command("export <slug>")
    .description("Export all conversation transcripts to CSV")
    .option("-o, --output <file>", "Write to file instead of stdout")
    .option("-s, --status <status>", "Filter by status (e.g. completed, timed_out)")
    .action(async (slug: string, opts: { output?: string; status?: string }) => {
      try {
        const client = getClient()

        // Page through all conversations
        const allItems: Conversation[] = []
        let page = 1
        const size = 100
        while (true) {
          const params: Record<string, string> = { page: String(page), size: String(size) }
          if (opts.status) params["status"] = opts.status
          const data = await client.get<ConversationListResponse>(
            `/interviews/${slug}/conversations`,
            params
          )
          allItems.push(...data.items)
          if (allItems.length >= data.total || data.items.length < size) break
          page++
        }

        if (allItems.length === 0) {
          process.stderr.write("No conversations found.\n")
          return
        }

        // Fetch transcripts in parallel (capped concurrency)
        const concurrency = 5
        const transcripts = new Map<number, string>()
        for (let i = 0; i < allItems.length; i += concurrency) {
          const batch = allItems.slice(i, i + concurrency)
          process.stderr.write(`Fetching transcripts ${i + 1}-${Math.min(i + concurrency, allItems.length)}/${allItems.length}...\r`)
          await Promise.all(batch.map(async (c) => {
            try {
              const t = await client.get<TranscriptResponse>(`/interviews/${slug}/conversations/${c.readable_id}/transcript`)
              transcripts.set(c.readable_id, t.transcript)
            } catch {
              transcripts.set(c.readable_id, "")
            }
          }))
        }
        process.stderr.write("\n")

        // Build CSV
        const escape = (s: string) => `"${(s ?? "").replace(/"/g, '""')}"`
        const lines = [["#", "Participant", "Status", "Started", "Transcript"].join(",")]
        for (const c of allItems) {
          lines.push([
            String(c.readable_id),
            escape(c.participant_name || "(anonymous)"),
            c.status,
            c.started_at?.slice(0, 19).replace("T", " ") ?? "",
            escape(transcripts.get(c.readable_id) ?? ""),
          ].join(","))
        }
        const csv = lines.join("\n") + "\n"

        if (opts.output) {
          const { writeFileSync } = await import("node:fs")
          writeFileSync(opts.output, csv, "utf-8")
          success(`Wrote ${allItems.length} conversation(s) to ${opts.output}`)
        } else {
          process.stdout.write(csv)
        }
      } catch (err) {
        handleError(err)
      }
    })

  conversations
    .command("hide <slug> <id>")
    .description("Hide a conversation (excluded from reports/analysis)")
    .action(async (slug: string, id: string) => {
      try {
        const client = getClient()
        await client.patch(`/interviews/${slug}/conversations/${id}/visibility`, { is_hidden: true })
        success(`Conversation #${id} hidden`)
      } catch (err) {
        handleError(err)
      }
    })

  conversations
    .command("unhide <slug> <id>")
    .description("Restore a hidden conversation")
    .action(async (slug: string, id: string) => {
      try {
        const client = getClient()
        await client.patch(`/interviews/${slug}/conversations/${id}/visibility`, { is_hidden: false })
        success(`Conversation #${id} restored`)
      } catch (err) {
        handleError(err)
      }
    })
}
