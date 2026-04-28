import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

const CACHE_DIR = join(homedir(), ".mizzen")
const CACHE_FILE = join(CACHE_DIR, "update-check.json")
const CACHE_TTL_MS = 24 * 60 * 60 * 1000  // 24h
const REGISTRY_URL = "https://registry.npmjs.org/@mizzenai/cli/latest"

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
 * Synchronously print an update banner if our cached "latest" is newer than
 * what's running. Cheap (one file read), happens before commander runs so the
 * banner shows on every invocation — even --help, --version, missing-command,
 * or any error path.
 */
export function maybePrintUpdateBanner(currentVersion: string): void {
  const cache = readCache()
  if (!cache) return
  if (compareVersions(currentVersion, cache.latestVersion) < 0) {
    printBanner(currentVersion, cache.latestVersion)
  }
}

/**
 * Fire-and-forget refresh of the cache. Runs in the background; if the process
 * exits before fetch completes, the cache stays stale and next run will retry.
 * Banner appears starting the run AFTER a successful fetch.
 */
export function refreshUpdateCacheInBackground(): void {
  const cache = readCache()
  if (cache && Date.now() - cache.checkedAt < CACHE_TTL_MS) return

  // Don't await — let the request race the process lifetime.
  void (async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)
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
      // Network errors are fine — try again next run
    }
  })()
}
