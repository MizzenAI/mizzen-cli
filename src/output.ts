import chalk from "chalk"
import Table from "cli-table3"
import type { UpdateNotice } from "./update-notifier"

const UPDATE_COMMAND = "npm update -g @mizzenai/cli"
let pendingUpdate: UpdateNotice | null = null
let updateNoticeIncluded = false

export function setUpdateNotice(update: UpdateNotice): void {
  pendingUpdate = update
}

export function wasUpdateNoticeIncluded(): boolean {
  return updateNoticeIncluded
}

export function updateWarningMessage(update: UpdateNotice): string {
  return `mizzen-cli ${update.latestVersion} is available (current ${update.currentVersion}). Run: ${UPDATE_COMMAND}`
}

// --- Table output ---

export function printTable(
  headers: string[],
  rows: string[][],
  options?: { title?: string }
): void {
  const table = new Table({
    head: headers.map((h) => chalk.cyan.bold(h)),
    style: { head: [], border: [] },
  })

  for (const row of rows) {
    table.push(row)
  }

  if (options?.title) {
    process.stdout.write(chalk.bold(options.title) + "\n\n")
  }
  process.stdout.write(table.toString() + "\n")
}

// --- JSON output (used directly by commands that emit raw structured data) ---

export function printJson(data: unknown): void {
  if (pendingUpdate && data !== null && typeof data === "object" && !Array.isArray(data)) {
    data = {
      ...data,
      _notice: {
        update: {
          current: pendingUpdate.currentVersion,
          latest: pendingUpdate.latestVersion,
          message: `mizzen-cli ${pendingUpdate.latestVersion} available, current ${pendingUpdate.currentVersion}`,
          command: UPDATE_COMMAND,
        },
      },
    }
    updateNoticeIncluded = true
  }

  process.stdout.write(JSON.stringify(data, null, 2) + "\n")
}

// --- Default list/key-value output (table format) ---

export function printData(
  headers: string[],
  rows: string[][],
  // jsonData is accepted for forward-compat but not currently rendered;
  // commands that want JSON output should call printJson() directly.
  _jsonData?: unknown,
): void {
  printTable(headers, rows)
}

export function printKeyValue(pairs: Array<[string, string]>): void {
  const maxKeyLen = Math.max(...pairs.map(([k]) => k.length))
  for (const [key, value] of pairs) {
    const paddedKey = key.padEnd(maxKeyLen)
    process.stdout.write(`  ${chalk.cyan(paddedKey)}  ${value}\n`)
  }
}

// --- Message helpers ---

export function success(message: string): void {
  process.stderr.write(chalk.green("✓ ") + message + "\n")
}

export function error(message: string): void {
  process.stderr.write(chalk.red("Error: ") + message + "\n")
}

export function warning(message: string): void {
  process.stderr.write(chalk.yellow("Warning: ") + message + "\n")
}

export function info(message: string): void {
  process.stderr.write(chalk.blue("Info: ") + message + "\n")
}
