import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, chmodSync } from "node:fs"
import { join } from "node:path"
import { getConfigDir } from "./config"

const CREDENTIALS_FILE = "credentials.json"

interface Credentials {
  api_key: string
}

function getCredentialsPath(): string {
  return join(getConfigDir(), CREDENTIALS_FILE)
}

export function saveApiKey(apiKey: string): void {
  const dir = getConfigDir()
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true, mode: 0o700 })
  }
  const filePath = getCredentialsPath()
  const data: Credentials = { api_key: apiKey }
  writeFileSync(filePath, JSON.stringify(data, null, 2), { encoding: "utf-8", mode: 0o600 })

  try {
    chmodSync(filePath, 0o600)
  } catch {
    // chmod may fail on some systems
  }
}

export function loadApiKey(): string | null {
  // Environment variable takes precedence
  const envKey = process.env["MIZZEN_API_KEY"]
  if (envKey && envKey.length > 0) {
    return envKey
  }

  const filePath = getCredentialsPath()
  if (!existsSync(filePath)) {
    return null
  }

  try {
    const raw = readFileSync(filePath, "utf-8")
    const parsed = JSON.parse(raw) as Credentials
    return parsed.api_key ?? null
  } catch {
    return null
  }
}

export function clearApiKey(): void {
  const filePath = getCredentialsPath()
  if (existsSync(filePath)) {
    unlinkSync(filePath)
  }
}

export function isConfigured(): boolean {
  return loadApiKey() !== null
}

export function maskApiKey(key: string): string {
  if (key.length <= 12) return key
  const prefix = key.slice(0, 8)
  const suffix = key.slice(-4)
  return `${prefix}...${suffix}`
}
