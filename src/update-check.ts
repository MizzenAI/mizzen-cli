import { spawn } from "node:child_process"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const CACHE_DIR = join(homedir(), ".mizzen")
const CACHE_FILE = join(CACHE_DIR, "update-check.json")
const CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24h
const REGISTRY_URL = "https://registry.npmjs.org/@mizzenai/cli/latest"

const WORKER_FLAG = "--__internal-update-check"

interface CacheEntry {
  latestVersion: string
  checkedAt: number
}

function compareVersions(a: string, b: string): number {
  const pa = a.split(".").map(Number)
  const pb = b.split(".").map(Number)
  for (let i = 0; i < 3; i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

function readCache(): CacheEntry | null {
  try {
    if (!existsSync(CACHE_FILE)) return null
    return JSON.parse(readFileSync(CACHE_FILE, "utf-8")) as CacheEntry
  } catch {
    return null
  }
}

function writeCache(entry: CacheEntry): void {
  try {
    if (!existsSync(CACHE_DIR)) mkdirSync(CACHE_DIR, { recursive: true })
    writeFileSync(CACHE_FILE, JSON.stringify(entry), "utf-8")
  } catch {
    // Ignore cache write failures
  }
}

function printBanner(currentVersion: string, latestVersion: string): void {
  process.stderr.write(
    `\n[33m┌─ Update available: ${currentVersion} → ${latestVersion}\n` +
    `│  Run: npm install -g @mizzenai/cli\n` +
    `└─[0m\n\n`
  )
}

/**
 * Sync read of cache, print banner if cached "latest" is newer than current.
 * Runs at process startup so the banner shows on every code path
 * (--help, --version, missing-command, errors, success).
 */
export function maybePrintUpdateBanner(currentVersion: string): void {
  const cache = readCache()
  if (!cache) return
  if (compareVersions(currentVersion, cache.latestVersion) < 0) {
    printBanner(currentVersion, cache.latestVersion)
  }
}

/**
 * Spawn a detached child process that fetches the latest version and writes
 * the cache. The child outlives the parent — even if the parent calls
 * process.exit, the child keeps running. The fetched value shows up as a
 * banner on the *next* invocation.
 *
 * Skipped if cache is still fresh (within TTL).
 */
export function refreshUpdateCacheInBackground(): void {
  const cache = readCache()
  if (cache && Date.now() - cache.checkedAt < CACHE_TTL_MS) return

  // Re-invoke ourselves with WORKER_FLAG so the child runs `runUpdateWorker()`
  // and exits, instead of going through commander's argv parsing.
  const entry = process.argv[1]
  if (!entry) return
  try {
    const child = spawn(process.execPath, [entry, WORKER_FLAG], {
      detached: true,
      stdio: "ignore",
    })
    child.unref()
  } catch {
    // Spawn errors are non-fatal — try again next run
  }
}

/**
 * Body of the detached worker. Returns true if argv indicates we should
 * run the worker and exit (so the caller can short-circuit before commander
 * parses the special flag).
 */
export function isUpdateWorkerInvocation(): boolean {
  return process.argv.includes(WORKER_FLAG)
}

export async function runUpdateWorker(): Promise<void> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000)
    const response = await fetch(REGISTRY_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    clearTimeout(timeoutId)
    if (!response.ok) return
    const data = await response.json() as { version?: string }
    if (data.version) {
      writeCache({ latestVersion: data.version, checkedAt: Date.now() })
    }
  } catch {
    // Network failures are fine — try again next run
  }
}
