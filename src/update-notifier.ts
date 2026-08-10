import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { get } from "node:https"
import { dirname, join } from "node:path"
import { getConfigDir } from "./config"

const REGISTRY_URL = "https://registry.npmjs.org/@mizzenai/cli/latest"
const CACHE_TTL_MS = 24 * 60 * 60 * 1000
const MAX_RESPONSE_BYTES = 64 * 1024

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

function refreshState(path: string): void {
  const request = get(REGISTRY_URL, (response) => {
    if (response.statusCode !== 200) {
      response.resume()
      return
    }

    response.setEncoding("utf-8")
    let body = ""
    response.on("data", (chunk: string) => {
      body += chunk
      if (body.length > MAX_RESPONSE_BYTES) response.destroy()
    })
    response.on("end", () => {
      try {
        const result = JSON.parse(body) as Record<string, unknown>
        if (typeof result["version"] !== "string" || !parseVersion(result["version"])) return
        mkdirSync(dirname(path), { recursive: true, mode: 0o700 })
        writeFileSync(path, JSON.stringify({
          latestVersion: result["version"],
          checkedAt: Date.now(),
        }), { mode: 0o600 })
      } catch {
        // Update checks must never affect the command being run.
      }
    })
  })

  request.on("socket", (socket) => socket.unref())
  request.on("error", () => {})
  request.setTimeout(5_000, () => request.destroy())
}

export function getCachedUpdate(
  currentVersion: string,
  path = statePath(),
): UpdateNotice | null {
  const state = readState(path)
  if (!state || !isNewer(state.latestVersion, currentVersion)) return null
  return { currentVersion, latestVersion: state.latestVersion }
}

export function checkForUpdate(currentVersion: string): UpdateNotice | null {
  if (process.env["CI"] || !parseVersion(currentVersion)) return null

  const path = statePath()
  const state = readState(path)
  if (!state || Date.now() - state.checkedAt >= CACHE_TTL_MS) refreshState(path)

  return getCachedUpdate(currentVersion, path)
}
