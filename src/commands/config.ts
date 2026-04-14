import { Command } from "commander"
import { loadConfig, updateConfig, resetConfig } from "../config"
import { success, printJson, printKeyValue } from "../output"
import { handleError } from "../errors"

export function registerConfigCommand(program: Command): void {
  const config = program
    .command("config")
    .description("Manage CLI configuration")

  config
    .command("show")
    .description("Show current configuration")
    .action(() => {
      const cfg = loadConfig()
      printJson(cfg)
    })

  config
    .command("set <key> <value>")
    .description("Set a configuration value (e.g., api.base_url, output.format)")
    .action((key: string, value: string) => {
      try {
        const cfg = updateConfig(key, value)
        success(`Set ${key} = ${value}`)
        printKeyValue([
          ["api.base_url", cfg.api.base_url],
          ["api.timeout", String(cfg.api.timeout)],
          ["output.format", cfg.output.format],
          ["output.color", String(cfg.output.color)],
        ])
      } catch (err) {
        handleError(err)
      }
    })

  config
    .command("reset")
    .description("Reset configuration to defaults")
    .action(() => {
      resetConfig()
      success("Configuration reset to defaults")
    })
}
