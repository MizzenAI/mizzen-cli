import { ApiError } from "./client"
import { error } from "./output"

export function translationDetails(details: unknown): string {
  if (!details || typeof details !== "object") return ""
  const data = details as Record<string, unknown>
  const lines: string[] = []
  const missingMap = (data["incomplete"] ?? data["missing"]) as Record<string, unknown> | undefined
  if (missingMap && typeof missingMap === "object") {
    for (const [locale, missing] of Object.entries(missingMap)) {
      lines.push(`${locale}: missing ${missing} segment(s)`)
    }
  }
  if (Array.isArray(data["languages"])) {
    for (const language of data["languages"]) {
      const job = language.job
      lines.push(`${language.locale}: ${language.status ?? job?.status ?? "pending"}`
        + (job ? `, ${job.done}/${job.total}, failed ${job.failed_count ?? 0}` : "")
        + (language.missing !== undefined ? `, missing ${language.missing} segment(s)` : "")
        + (job?.last_error_code ? `, ${job.last_error_code}` : "")
        + (language.failed_targets?.length ? `, failed targets ${JSON.stringify(language.failed_targets)}` : ""))
    }
  } else if (data["languages"] && typeof data["languages"] === "object") {
    for (const [locale, rawJob] of Object.entries(data["languages"] as Record<string, Record<string, unknown> | null>)) {
      const job = rawJob ?? {}
      lines.push(`${locale}: ${job["status"] ?? "pending"}`
        + (job["done"] !== undefined && job["total"] !== undefined ? `, ${job["done"]}/${job["total"]}, failed ${job["failed_count"] ?? 0}` : "")
        + (job["last_error_code"] ? `, ${job["last_error_code"]}` : ""))
    }
  }
  return lines.join("\n")
}

export function handleError(err: unknown): never {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      error(`${err.detail}\n  Run: mizzen-cli auth set-key <your-api-key>`)
    } else if (err.status === 0) {
      error(err.detail)
    } else {
      error(`[${err.status}] ${err.detail}`)
    }
    const translations = translationDetails(err.details)
    if (translations) error(translations)
  } else if (err instanceof Error) {
    error(err.message)
  } else {
    error(String(err))
  }
  process.exit(1)
}
