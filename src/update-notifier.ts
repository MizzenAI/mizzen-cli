import { spawn } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { getConfigDir } from "./config"

const REGISTRY_URL = process.env["MIZZEN_CLI_UPDATE_REGISTRY_URL"]
  ?? "https://registry.npmjs.org/@mizzenai/cli/latest"
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const FETCH_TIMEOUT_MS = 5_000
const UPDATE_WORKER_ENV = "MIZZEN_CLI_UPDATE_WORKER"

type UpdateState = {
  latestVersion: string
  checkedAt: number
}

export type UpdateNotice = {
  currentVersion: string
  latestVersion: string
}

function statePath(): string {
  return join(getConfigDir(), "update-state.json")
}

function parseVersion(version: string): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(version)
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null
}

function isNewer(latest: string, current: string): boolean {
  const latestParts = parseVersion(latest)
  const currentParts = parseVersion(current)
  if (!latestParts || !currentParts) return false

  for (let index = 0; index < latestParts.length; index++) {
    if (latestParts[index]! !== currentParts[index]!) {
      return latestParts[index]! > currentParts[index]!
    }
  }
  return false
}

function readState(path: string): UpdateState | null {
  if (!existsSync(path)) return null
  try {
    const state = JSON.parse(readFileSync(path, "utf-8")) as Record<string, unknown>
    if (typeof state["latestVersion"] !== "string" || typeof state["checkedAt"] !== "number") {
      return null
    }
    return { latestVersion: state["latestVersion"], checkedAt: state["checkedAt"] }
  } catch {
    return null
  }
}

function writeState(path: string, state: UpdateState): void {
  try {
    mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
    writeFileSync(path, JSON.stringify(state), { mode: 0o600 })
  } catch {
    // Update checks must never affect the command being run.
  }
}

export async function refreshUpdateState(path = statePath()): Promise<UpdateState> {
  const previous = readState(path)
  const state = {
    latestVersion: previous?.latestVersion ?? "",
    checkedAt: Date.now(),
  }

  try {
    const response = await fetch(REGISTRY_URL, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
    if (response.ok) {
      const result = await response.json() as Record<string, unknown>
      if (typeof result["version"] === "string" && parseVersion(result["version"])) {
        state.latestVersion = result["version"]
      }
    }
  } catch {
    // A failed check is cached too, so commands do not repeatedly wait on a bad network.
  }

  writeState(path, state)
  return state
}

function startUpdateWorker(): void {
  const entry = process.argv[1]
  if (!entry) return

  try {
    const worker = spawn(process.execPath, [entry], {
      detached: true,
      stdio: "ignore",
      env: { ...process.env, [UPDATE_WORKER_ENV]: "1" },
    })
    worker.unref()
  } catch {
    // The next CLI invocation will try again.
  }
}

export async function runUpdateWorkerIfRequested(): Promise<boolean> {
  if (process.env[UPDATE_WORKER_ENV] !== "1") return false
  await refreshUpdateState()
  return true
}

export function getCachedUpdate(
  currentVersion: string,
  path = statePath(),
): UpdateNotice | null {
  const state = readState(path)
  if (!state || !isNewer(state.latestVersion, currentVersion)) return null
  return { currentVersion, latestVersion: state.latestVersion }
}

export function checkForUpdate(
  currentVersion: string,
  path = statePath(),
  scheduleRefresh: () => void = startUpdateWorker,
): UpdateNotice | null {
  if (process.env["CI"] || !parseVersion(currentVersion)) return null

  const state = readState(path)
  if (!state || Date.now() - state.checkedAt >= CACHE_TTL_MS) {
    scheduleRefresh()
  }

  return getCachedUpdate(currentVersion, path)
}
