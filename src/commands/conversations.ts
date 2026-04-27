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
