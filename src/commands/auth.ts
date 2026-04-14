import { Command } from "commander"
import { saveApiKey, loadApiKey, clearApiKey, maskApiKey } from "../auth"
import { success, error, printKeyValue } from "../output"

export function registerAuthCommand(program: Command): void {
  const auth = program
    .command("auth")
    .description("Manage API key authentication")

  auth
    .command("set-key <api-key>")
    .description("Save your API key")
    .action((apiKey: string) => {
      if (!apiKey.startsWith("mk_")) {
        error("Invalid API key format. Key should start with 'mk_'")
        process.exit(1)
      }

      saveApiKey(apiKey)
      success(`API key saved: ${maskApiKey(apiKey)}`)
    })

  auth
    .command("status")
    .description("Show current authentication status")
    .action(() => {
      const key = loadApiKey()
      if (key) {
        printKeyValue([
          ["Status", "Configured"],
          ["API Key", maskApiKey(key)],
          ["Source", process.env["MIZZEN_API_KEY"] ? "MIZZEN_API_KEY env var" : "~/.mizzen/credentials.json"],
        ])
      } else {
        error("No API key configured. Run: mizzen auth set-key <your-api-key>")
        process.exit(1)
      }
    })

  auth
    .command("clear")
    .description("Remove saved API key")
    .action(() => {
      clearApiKey()
      success("API key cleared")
    })
}
