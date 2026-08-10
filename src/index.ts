import { Command } from "commander"
import { readFileSync } from "node:fs"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { setClientVersion } from "./client"
import { isConfigured, maskApiKey, loadApiKey } from "./auth"
import { registerAuthCommand } from "./commands/auth"
import { registerConfigCommand } from "./commands/config"
import { registerInterviewsCommand } from "./commands/interviews"
import { registerConversationsCommand } from "./commands/conversations"
import { registerOutlineCommand } from "./commands/questions"
import { registerInsightsCommand } from "./commands/insights"
import { checkForUpdate } from "./update-notifier"
import { warning } from "./output"

function loadVersion(): string {
  try {
    const currentDir = dirname(fileURLToPath(import.meta.url))
    const pkgPath = join(currentDir, "..", "package.json")
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"))
    return pkg.version ?? "0.0.0"
  } catch {
    return "0.0.0"
  }
}

function buildStatusLine(): string {
  if (!isConfigured()) {
    return "Not configured. Run: mizzen-cli auth set-key <your-api-key>"
  }
  const key = loadApiKey()
  return key ? `Authenticated (${maskApiKey(key)})` : "Not configured"
}

function createProgram(version: string): Command {
  setClientVersion(version)

  const program = new Command()
    .name("mizzen-cli")
    .description(`Mizzen CLI — Manage interviews, study guides and conversation data\n\n  ${buildStatusLine()}`)
    .version(version, "-v, --version")

  registerAuthCommand(program)
  registerInterviewsCommand(program)
  registerOutlineCommand(program)
  registerConversationsCommand(program)
  registerInsightsCommand(program)
  registerConfigCommand(program)

  return program
}

const version = loadVersion()
const update = checkForUpdate(version)
if (update) {
  warning(
    `mizzen-cli ${update.latestVersion} is available (current ${update.currentVersion}). `
    + "Run: npm update -g @mizzenai/cli",
  )
}

const program = createProgram(version)
program.parseAsync(process.argv).catch((err: unknown) => {
  if (err instanceof Error) {
    process.stderr.write(`Error: ${err.message}\n`)
  } else {
    process.stderr.write(`Error: ${String(err)}\n`)
  }
  process.exit(1)
})
