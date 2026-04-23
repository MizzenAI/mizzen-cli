import { Command } from "commander"
import { getClient } from "../client"
import { loadConfig } from "../config"
import { colorStatus, formatDuration } from "../format"
import { printData, printKeyValue, success } from "../output"
import { handleError } from "../errors"
import type { Interview, InterviewListResponse, InterviewStats } from "../types/api"

function getSiteUrl(): string {
  return loadConfig().api.site_url.replace(/\/$/, "")
}

function getManageUrl(slug: string): string {
  return `${getSiteUrl()}/interview/${slug}/create`
}

function getShareUrl(slug: string): string {
  return `${getSiteUrl()}/interview/${slug}?source=link`
}

export function registerInterviewsCommand(program: Command): void {
  const interviews = program
    .command("interview")
    .description("Manage interviews")

  interviews
    .command("list")
    .description("List all interviews")
    .option("-s, --status <status>", "Filter by status (draft, active, paused)")
    .option("-q, --search <query>", "Search by title")
    .option("-p, --page <n>", "Page number", "1")
    .option("--size <n>", "Page size", "20")
    .action(async (opts: { status?: string; search?: string; page: string; size: string }) => {
      try {
        const client = getClient()
        const params: Record<string, string> = { page: opts.page, size: opts.size }
        if (opts.status) params["status"] = opts.status
        if (opts.search) params["search"] = opts.search

        const data = await client.get<InterviewListResponse>("/interviews", params)

        printData(
          ["Slug", "Title", "Status", "Participants", "Created"],
          data.items.map((i) => [
            i.slug,
            i.title || "(untitled)",
            colorStatus(i.status),
            String(i.participant_count),
            i.created_at?.slice(0, 10) ?? "-",
          ]),
          data,
        )
      } catch (err) {
        handleError(err)
      }
    })

  interviews
    .command("get <slug>")
    .description("Get interview details")
    .action(async (slug: string) => {
      try {
        const client = getClient()
        const data = await client.get<Interview>(`/interviews/${slug}`)

        printKeyValue([
          ["Slug", data.slug],
          ["Title", data.title || "(untitled)"],
          ["Status", data.status],
          ["Background", data.background || "-"],
          ["Study Goal", data.study_goal || "-"],
          ["Language", data.user_language],
          ["Participants", String(data.participant_count)],
          ["Created", data.created_at?.slice(0, 10) ?? "-"],
          ["Published", data.published_at?.slice(0, 10) ?? "-"],
          ["管理链接", getManageUrl(data.slug)],
          ["分享链接", data.status === "active" ? getShareUrl(data.slug) : "(需先发布)"],
        ])
      } catch (err) {
        handleError(err)
      }
    })

  interviews
    .command("create")
    .description("Create a new interview")
    .requiredOption("-t, --title <title>", "Interview title")
    .option("--external-title <title>", "Title shown to respondents (defaults to --title)")
    .option("--background <bg>", "Research background")
    .option("--goal <goal>", "Study goal")
    .option("--welcome <msg>", "Welcome message")
    .option("--closing <msg>", "Closing message")
    .option("--language <lang>", "User language", "zh-CN")
    .option("--mode <mode>", "Interview mode: audio, video, video_screen, text", "audio")
    .option("--talk-mode <mode>", "Talk mode: manual (push-to-talk), auto (voice-activated)", "manual")
    .option("--tts", "Enable AI text-to-speech")
    .action(async (opts: {
      title: string; externalTitle?: string; background?: string;
      goal?: string; welcome?: string; closing?: string; language: string;
      mode: string; talkMode: string; tts?: boolean
    }) => {
      try {
        const client = getClient()
        const body: Record<string, unknown> = {
          title: opts.title,
          userLanguage: opts.language,
          config: {
            interviewMode: opts.mode,
            talkMode: opts.talkMode,
            ...(opts.tts ? { tts: true } : {}),
          },
        }
        if (opts.externalTitle) body["externalTitle"] = opts.externalTitle
        if (opts.background) body["background"] = opts.background
        if (opts.goal) body["studyGoal"] = opts.goal
        if (opts.welcome) body["welcomeMessage"] = opts.welcome
        if (opts.closing) body["closingMessage"] = opts.closing

        const data = await client.post<{ slug: string; title: string; status: string; created_at: string }>("/interviews", body)
        success(`Interview created: ${data.slug}`)
        printKeyValue([
          ["Slug", data.slug],
          ["Title", data.title],
          ["Status", data.status],
          ["管理链接", getManageUrl(data.slug)],
        ])
      } catch (err) {
        handleError(err)
      }
    })

  interviews
    .command("update <slug>")
    .description("Update an interview")
    .option("-t, --title <title>", "New title")
    .option("--background <bg>", "New background")
    .option("--goal <goal>", "New study goal")
    .option("--welcome <msg>", "New welcome message")
    .option("--closing <msg>", "New closing message")
    .option("--language <lang>", "New user language")
    .option("--mode <mode>", "Interview mode: audio, video, video_screen, text")
    .option("--talk-mode <mode>", "Talk mode: manual, auto")
    .option("--tts", "Enable AI text-to-speech")
    .option("--no-tts", "Disable AI text-to-speech")
    .action(async (slug: string, opts: {
      title?: string; background?: string;
      goal?: string; welcome?: string; closing?: string; language?: string;
      mode?: string; talkMode?: string; tts?: boolean
    }) => {
      try {
        const client = getClient()
        const body: Record<string, unknown> = {}
        if (opts.title) body["title"] = opts.title
        if (opts.background) body["background"] = opts.background
        if (opts.goal) body["studyGoal"] = opts.goal
        if (opts.welcome) body["welcomeMessage"] = opts.welcome
        if (opts.closing) body["closingMessage"] = opts.closing
        if (opts.language) body["userLanguage"] = opts.language
        if (opts.mode || opts.talkMode || opts.tts !== undefined) {
          const config: Record<string, unknown> = {}
          if (opts.mode) config["interviewMode"] = opts.mode
          if (opts.talkMode) config["talkMode"] = opts.talkMode
          if (opts.tts !== undefined) config["tts"] = opts.tts
          body["config"] = config
        }

        const data = await client.put<Interview>(`/interviews/${slug}`, body)
        success(`Interview ${slug} updated`)
        printKeyValue([
          ["Slug", data.slug],
          ["Title", data.title || "(untitled)"],
          ["Status", data.status],
        ])
      } catch (err) {
        handleError(err)
      }
    })

  interviews
    .command("delete <slug>")
    .description("Delete an interview")
    .action(async (slug: string) => {
      try {
        const client = getClient()
        await client.delete(`/interviews/${slug}`)
        success(`Interview ${slug} deleted`)
      } catch (err) {
        handleError(err)
      }
    })

  interviews
    .command("check <slug>")
    .description("Run study check for an interview")
    .action(async (slug: string) => {
      try {
        const client = getClient()
        process.stdout.write("Running study check... ")
        const check = await client.post<{
          success: boolean
          cached: boolean
          issues: Array<{ severity: string; short_description: string; issue_details: string }>
          error_count: number
          warning_count: number
        }>(`/interviews/${slug}/check`)

        const errors = check.issues.filter(i => i.severity === "error")
        const warnings = check.issues.filter(i => i.severity === "warning")
        const recommendations = check.issues.filter(i => i.severity === "recommendation")

        if (errors.length > 0) {
          console.log(`\n✗ ${errors.length} error(s):`)
          for (const issue of errors) {
            console.log(`  • ${issue.short_description}`)
            console.log(`    ${issue.issue_details}\n`)
          }
        } else {
          console.log("✓ No errors")
        }

        if (warnings.length > 0) {
          console.log(`⚠ ${warnings.length} warning(s):`)
          for (const issue of warnings) {
            console.log(`  • ${issue.short_description}`)
          }
        }

        if (recommendations.length > 0) {
          console.log(`ℹ ${recommendations.length} recommendation(s):`)
          for (const issue of recommendations) {
            console.log(`  • ${issue.short_description}`)
          }
        }

        if (check.cached) {
          console.log("\n(cached result)")
        }

        if (errors.length > 0) process.exit(1)
      } catch (err) {
        handleError(err)
      }
    })

  interviews
    .command("publish <slug>")
    .description("Publish a draft interview")
    .action(async (slug: string) => {
      try {
        const client = getClient()

        // Step 1: Run study check
        process.stdout.write("Running study check... ")
        const check = await client.post<{
          success: boolean
          cached: boolean
          issues: Array<{ severity: string; short_description: string; issue_details: string }>
          error_count: number
          warning_count: number
        }>(`/interviews/${slug}/check`)

        if (check.error_count > 0) {
          console.log(`\n✗ Study check found ${check.error_count} error(s):`)
          for (const issue of check.issues.filter(i => i.severity === "error")) {
            console.log(`  • ${issue.short_description}`)
            console.log(`    ${issue.issue_details}\n`)
          }
          process.exit(1)
        }

        const warnings = check.warning_count
        console.log(
          `✓ Passed${warnings > 0 ? ` (${warnings} warning${warnings > 1 ? "s" : ""})` : ""}`
        )

        // Step 2: Publish
        await client.post(`/interviews/${slug}/publish`)
        success(`Interview ${slug} published`)
        printKeyValue([
          ["分享链接", getShareUrl(slug)],
          ["管理链接", getManageUrl(slug)],
        ])
      } catch (err) {
        handleError(err)
      }
    })

  interviews
    .command("share <slug>")
    .description("Create share link for respondents (auto-publishes if draft)")
    .action(async (slug: string) => {
      try {
        const client = getClient()
        const data = await client.post<{ slug: string; status: string; share_url: string; message: string }>(
          `/interviews/${slug}/share-link`
        )
        success(data.message)
        printKeyValue([
          ["分享链接", `${getSiteUrl()}${data.share_url}`],
          ["状态", data.status],
        ])
      } catch (err) {
        handleError(err)
      }
    })

  interviews
    .command("stats <slug>")
    .description("Get interview statistics")
    .action(async (slug: string) => {
      try {
        const client = getClient()
        const data = await client.get<InterviewStats>(`/interviews/${slug}/stats`)

        printKeyValue([
          ["Total", String(data.total_conversations)],
          ["Completed", String(data.completed)],
          ["In Progress", String(data.in_progress)],
          ["Screened Out", String(data.screened_out)],
          ["Failed", String(data.failed)],
          ["Timed Out", String(data.timed_out)],
          ["Completion Rate", `${(data.completion_rate * 100).toFixed(1)}%`],
          ["Avg Active Time", data.avg_active_time_seconds ? formatDuration(Math.round(data.avg_active_time_seconds)) : "-"],
          ["Median Active Time", data.median_active_time_seconds ? formatDuration(Math.round(data.median_active_time_seconds)) : "-"],
        ])
      } catch (err) {
        handleError(err)
      }
    })

}
