import { Command } from "commander"
import { getClient } from "../client"
import { success, printJson, printKeyValue } from "../output"
import { handleError } from "../errors"

export function registerInsightsCommand(program: Command): void {
  const insights = program
    .command("insights")
    .description("Manage insight reports")

  insights
    .command("get <slug>")
    .description("Get the latest insight report")
    .action(async (slug: string) => {
      try {
        const client = getClient()
        const data = await client.get<{
          id: string; version: number; status: string;
          participant_count: number; report_data: unknown; generated_at: string | null
        }>(`/interviews/${slug}/insights/latest`)

        printKeyValue([
          ["ID", data.id],
          ["Version", String(data.version)],
          ["Status", data.status],
          ["Participants", String(data.participant_count)],
          ["Generated", data.generated_at?.slice(0, 16).replace("T", " ") ?? "-"],
        ])

        if (data.report_data) {
          process.stdout.write("\nReport data:\n")
          printJson(data.report_data)
        }
      } catch (err) {
        handleError(err)
      }
    })

  insights
    .command("generate <slug>")
    .description("Trigger generation of an insight report")
    .option("--include-incomplete", "Include incomplete conversations")
    .option("--min-participants <n>", "Minimum participants required", "3")
    .action(async (slug: string, opts: { includeIncomplete?: boolean; minParticipants: string }) => {
      try {
        const client = getClient()
        const data = await client.post<{ id: string; status: string; message: string }>(
          `/interviews/${slug}/insights`,
          {
            include_incomplete: opts.includeIncomplete ?? false,
            min_participants: parseInt(opts.minParticipants, 10),
          },
        )
        success(data.message)
        printKeyValue([
          ["ID", data.id ?? "-"],
          ["Status", data.status],
        ])
      } catch (err) {
        handleError(err)
      }
    })
}
