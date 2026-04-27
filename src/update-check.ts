import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs"
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
    const cache = JSON.parse(readFileSync(CACHE_FILE, "utf-8")) as CacheEntry
    if (Date.now() - cache.checkedAt > CACHE_TTL_MS) return null
    return cache
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

async function fetchLatestVersion(): Promise<string | null> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    const response = await fetch(REGISTRY_URL, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    })
    clearTimeout(timeoutId)
    if (!response.ok) return null
    const data = await response.json() as { version?: string }
    return data.version ?? null
  } catch {
    return null
  }
}

export async function checkForUpdate(currentVersion: string): Promise<void> {
  const cached = readCache()
  let latest = cached?.latestVersion

  if (!latest) {
    const fetched = await fetchLatestVersion()
    if (!fetched) return
    latest = fetched
    writeCache({ latestVersion: latest, checkedAt: Date.now() })
  }

  if (compareVersions(currentVersion, latest) < 0) {
    process.stderr.write(
      `\n[33m┌─ Update available: ${currentVersion} → ${latest}\n` +
      `│  Run: npm install -g @mizzenai/cli\n` +
      `└─[0m\n`
    )
  }
}
