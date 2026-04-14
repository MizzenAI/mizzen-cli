import { Command } from "commander"
import { getClient } from "../client"
import { loadConfig } from "../config"
import { printData, printKeyValue, success } from "../output"
import { handleError } from "../errors"
import type { Interview, InterviewListResponse, InterviewStats, OutlineResponse } from "../types/api"

function getSiteUrl(): string {
  return loadConfig().api.site_url.replace(/\/$/, "")
}

function getManageUrl(slug: string): string {
  return `${getSiteUrl()}/interview/${slug}/create`
}

function getShareUrl(slug: string): string {
  return `${getSiteUrl()}/interview/${slug}?source=link`
}

function statusColor(status: string): string {
  switch (status) {
    case "active": return `\x1b[32m${status}\x1b[0m`
    case "draft": return `\x1b[33m${status}\x1b[0m`
    case "paused": return `\x1b[34m${status}\x1b[0m`
    default: return status
  }
}

export function registerInterviewsCommand(program: Command): void {
  const interviews = program
    .command("interviews")
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
            statusColor(i.status),
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
          ["Description", data.description || "-"],
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
    .option("-d, --description <desc>", "Description")
    .option("--background <bg>", "Research background")
    .option("--goal <goal>", "Study goal")
    .option("--welcome <msg>", "Welcome message")
    .option("--closing <msg>", "Closing message")
    .option("--language <lang>", "User language", "zh-CN")
    .action(async (opts: {
      title: string; description?: string; background?: string;
      goal?: string; welcome?: string; closing?: string; language: string
    }) => {
      try {
        const client = getClient()
        const body: Record<string, unknown> = {
          title: opts.title,
          userLanguage: opts.language,
        }
        if (opts.description) body["description"] = opts.description
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
    .option("-d, --description <desc>", "New description")
    .option("--background <bg>", "New background")
    .option("--goal <goal>", "New study goal")
    .option("--welcome <msg>", "New welcome message")
    .option("--closing <msg>", "New closing message")
    .option("--language <lang>", "New user language")
    .action(async (slug: string, opts: {
      title?: string; description?: string; background?: string;
      goal?: string; welcome?: string; closing?: string; language?: string
    }) => {
      try {
        const client = getClient()
        const body: Record<string, unknown> = {}
        if (opts.title) body["title"] = opts.title
        if (opts.description) body["description"] = opts.description
        if (opts.background) body["background"] = opts.background
        if (opts.goal) body["studyGoal"] = opts.goal
        if (opts.welcome) body["welcomeMessage"] = opts.welcome
        if (opts.closing) body["closingMessage"] = opts.closing
        if (opts.language) body["userLanguage"] = opts.language

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
    .command("publish <slug>")
    .description("Publish a draft interview")
    .action(async (slug: string) => {
      try {
        const client = getClient()
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
          ["Avg Duration", data.avg_duration_seconds ? `${Math.round(data.avg_duration_seconds)}s` : "-"],
          ["Median Duration", data.median_duration_seconds ? `${Math.round(data.median_duration_seconds)}s` : "-"],
        ])
      } catch (err) {
        handleError(err)
      }
    })

  interviews
    .command("outline <slug>")
    .description("Get study guide outline")
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
}
