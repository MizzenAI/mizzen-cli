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
import { checkForUpdate } from "./update-check"
import { HandledExit } from "./errors"

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

function createProgram(): Command {
  const version = loadVersion()
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

const program = createProgram()
const currentVersion = loadVersion()

// exitOverride() makes commander throw a CommanderError instead of
// process.exit'ing on --help, --version, missing command, etc. — that lets
// the post-command update check run for every code path, not just successful
// actions.
program.exitOverride()

;(async () => {
  let exitCode = 0
  try {
    await program.parseAsync(process.argv)
  } catch (err: unknown) {
    if (err instanceof HandledExit) {
      // handleError already printed the message
      exitCode = 1
    } else if (
      err && typeof err === "object" && "code" in err &&
      typeof (err as { code?: unknown }).code === "string" &&
      ((err as { code: string }).code).startsWith("commander.")
    ) {
      // Commander's normal exits (help, version, missing command, etc.)
      exitCode = (err as { exitCode?: number }).exitCode ?? 0
    } else if (err instanceof Error) {
      process.stderr.write(`Error: ${err.message}\n`)
      exitCode = 1
    } else {
      process.stderr.write(`Error: ${String(err)}\n`)
      exitCode = 1
    }
  }
  await checkForUpdate(currentVersion)
  process.exit(exitCode)
})()
