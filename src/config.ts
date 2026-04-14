import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"
import { ConfigSchema, type Config } from "./types/config"

const CONFIG_DIR = join(homedir(), ".mizzen")
const CONFIG_FILE = join(CONFIG_DIR, "config.json")

function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true, mode: 0o700 })
  }
}

function getDefaultConfig(): Config {
  return ConfigSchema.parse({})
}

export function loadConfig(): Config {
  ensureConfigDir()

  if (!existsSync(CONFIG_FILE)) {
    const defaults = getDefaultConfig()
    writeFileSync(CONFIG_FILE, JSON.stringify(defaults, null, 2), { encoding: "utf-8", mode: 0o600 })
    return defaults
  }

  try {
    const raw = readFileSync(CONFIG_FILE, "utf-8")
    const parsed = JSON.parse(raw)
    return ConfigSchema.parse(parsed)
  } catch {
    return getDefaultConfig()
  }
}

export function saveConfig(config: Config): void {
  ensureConfigDir()
  const validated = ConfigSchema.parse(config)
  writeFileSync(CONFIG_FILE, JSON.stringify(validated, null, 2), { encoding: "utf-8", mode: 0o600 })
}

export function resetConfig(): Config {
  const defaults = getDefaultConfig()
  saveConfig(defaults)
  return defaults
}

export function updateConfig(key: string, value: string): Config {
  const config = loadConfig()
  const parts = key.split(".")

  if (parts.length !== 2) {
    throw new Error(`Invalid config key: ${key}. Use format: section.key (e.g., api.base_url)`)
  }

  const [section, field] = parts as [string, string]

  if (section === "api" && field === "base_url") {
    return saveAndReturn({ ...config, api: { ...config.api, base_url: value } })
  }
  if (section === "api" && field === "timeout") {
    const num = parseInt(value, 10)
    if (isNaN(num)) throw new Error(`Invalid timeout value: ${value}`)
    return saveAndReturn({ ...config, api: { ...config.api, timeout: num } })
  }
  if (section === "output" && field === "format") {
    if (!["table", "json", "csv"].includes(value)) {
      throw new Error(`Invalid format: ${value}. Must be: table, json, or csv`)
    }
    return saveAndReturn({
      ...config,
      output: { ...config.output, format: value as "table" | "json" | "csv" },
    })
  }
  if (section === "output" && field === "color") {
    const bool = value === "true" ? true : value === "false" ? false : null
    if (bool === null) throw new Error(`Invalid color value: ${value}. Must be: true or false`)
    return saveAndReturn({ ...config, output: { ...config.output, color: bool } })
  }

  throw new Error(
    `Unknown config key: ${key}. Valid keys: api.base_url, api.timeout, output.format, output.color`
  )
}

function saveAndReturn(config: Config): Config {
  saveConfig(config)
  return config
}

export function getConfigDir(): string {
  return CONFIG_DIR
}
