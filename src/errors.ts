import { ApiError } from "./client"
import { error } from "./output"

/**
 * Sentinel error: tells the top-level runner to exit 1 after running
 * post-command tasks (update check). Throwing instead of process.exit'ing
 * here lets parseAsync's promise chain resolve so the update banner can fire.
 */
export class HandledExit extends Error {
  constructor() {
    super("HandledExit")
    this.name = "HandledExit"
  }
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
  } else if (err instanceof Error) {
    error(err.message)
  } else {
    error(String(err))
  }
  throw new HandledExit()
}
