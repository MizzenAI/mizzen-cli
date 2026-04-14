import { Command } from "commander"
import { getClient } from "../client"
import { printData, printKeyValue, printJson } from "../output"
import { handleError } from "../errors"
import type { Conversation, ConversationListResponse, TranscriptResponse, AnswersResponse } from "../types/api"

function statusColor(status: string): string {
  switch (status) {
    case "completed": return `\x1b[32m${status}\x1b[0m`
    case "in_progress": return `\x1b[33m${status}\x1b[0m`
    case "screened_out": return `\x1b[31m${status}\x1b[0m`
    case "failed": return `\x1b[31m${status}\x1b[0m`
    default: return status
  }
}

function formatDuration(seconds: number | null): string {
  if (seconds === null) return "-"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

export function registerConversationsCommand(program: Command): void {
  const conversations = program
    .command("conversations")
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
          ["#", "Participant", "Status", "Duration", "Started"],
          data.items.map((c) => [
            String(c.readable_id),
            c.participant_name || "(anonymous)",
            statusColor(c.status),
            formatDuration(c.duration_seconds),
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
          ["Duration", formatDuration(data.duration_seconds)],
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
}
