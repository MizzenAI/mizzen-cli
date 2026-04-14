import chalk from "chalk"
import Table from "cli-table3"

type OutputFormat = "table" | "json" | "csv"

let currentFormat: OutputFormat = "table"

export function setOutputFormat(format: OutputFormat): void {
  currentFormat = format
}

export function getOutputFormat(): OutputFormat {
  return currentFormat
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

// --- JSON output ---

export function printJson(data: unknown): void {
  process.stdout.write(JSON.stringify(data, null, 2) + "\n")
}

// --- CSV output ---

function escapeCsvField(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n")) {
    return `"${field.replace(/"/g, '""')}"`
  }
  return field
}

export function printCsv(headers: string[], rows: string[][]): void {
  const lines: string[] = [headers.map(escapeCsvField).join(",")]
  for (const row of rows) {
    lines.push(row.map(escapeCsvField).join(","))
  }
  process.stdout.write(lines.join("\n") + "\n")
}

// --- Auto-format (respects --json / --csv flags) ---

export function printData(
  headers: string[],
  rows: string[][],
  jsonData?: unknown,
): void {
  switch (currentFormat) {
    case "json":
      printJson(jsonData ?? rows)
      break
    case "csv":
      printCsv(headers, rows)
      break
    default:
      printTable(headers, rows)
      break
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

// --- Key-value display ---

export function printKeyValue(pairs: Array<[string, string]>): void {
  if (currentFormat === "json") {
    const obj = Object.fromEntries(pairs)
    printJson(obj)
    return
  }

  if (currentFormat === "csv") {
    printCsv(["Key", "Value"], pairs.map(([k, v]) => [k, v]))
    return
  }

  const maxKeyLen = Math.max(...pairs.map(([k]) => k.length))
  for (const [key, value] of pairs) {
    const paddedKey = key.padEnd(maxKeyLen)
    process.stdout.write(`  ${chalk.cyan(paddedKey)}  ${value}\n`)
  }
}
