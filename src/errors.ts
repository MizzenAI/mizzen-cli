import { ApiError } from "./client"
import { error } from "./output"

export function handleError(err: unknown): never {
  if (err instanceof ApiError) {
    if (err.status === 401) {
      error(`${err.detail}\n  Run: mizzen-cli auth set-key <your-api-key>`)
    } else if (err.status === 0) {
      error(err.detail)
    } else {
      error(`[${err.status}] ${err.detail}`)
    }
  } else if (err instanceof Error) {
    error(err.message)
  } else {
    error(String(err))
  }
  process.exit(1)
}
