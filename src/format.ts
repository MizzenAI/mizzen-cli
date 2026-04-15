import chalk from "chalk"

const STATUS_COLORS: Record<string, (s: string) => string> = {
  active: chalk.green,
  completed: chalk.green,
  draft: chalk.yellow,
  in_progress: chalk.yellow,
  generating: chalk.yellow,
  paused: chalk.blue,
  screened_out: chalk.red,
  failed: chalk.red,
  timed_out: chalk.gray,
}

export function colorStatus(status: string): string {
  const colorFn = STATUS_COLORS[status]
  return colorFn ? colorFn(status) : status
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return "-"
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}
