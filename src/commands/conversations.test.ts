import { expect, test } from "bun:test"
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

test("conversation get displays summary fields and empty fallbacks", async () => {
  const home = mkdtempSync(join(tmpdir(), "mizzen-conversation-"))
  const configDir = join(home, ".mizzen")
  mkdirSync(configDir)

  const server = Bun.serve({
    port: 0,
    fetch(request) {
      const complete = new URL(request.url).pathname.endsWith("/1")
      return Response.json({
        readable_id: complete ? 1 : 2,
        participant_name: "Alice",
        status: "completed",
        started_at: null,
        ended_at: null,
        duration_seconds: 60,
        active_time_seconds: 60,
        summary: complete ? "Values durability" : null,
        user_profile: complete ? { tags: ["pragmatic buyer"] } : null,
        conversation_quality_score: complete ? 4.3 : null,
        messages: [],
      })
    },
  })

  writeFileSync(join(configDir, "config.json"), JSON.stringify({
    api: { base_url: server.url.toString(), site_url: "https://mizzen.top", timeout: 5 },
  }))
  const env = { ...process.env, HOME: home, MIZZEN_API_KEY: "mk_test_key", CI: "1" }

  async function run(id: string): Promise<string> {
    const cli = Bun.spawn([process.execPath, "src/index.ts", "conversation", "get", "study", id], {
      cwd: process.cwd(),
      env,
      stdout: "pipe",
      stderr: "pipe",
    })
    const [stdout, exitCode] = await Promise.all([
      new Response(cli.stdout).text(),
      cli.exited,
    ])
    expect(exitCode).toBe(0)
    return stdout
  }

  try {
    const complete = await run("1")
    expect(complete).toContain("4.3/5")
    expect(complete).toContain('{"tags":["pragmatic buyer"]}')
    expect(complete).toContain("Values durability")

    const pending = await run("2")
    expect(pending).toMatch(/Quality Score\s+-/)
    expect(pending).toMatch(/User Profile\s+-/)
    expect(pending).toMatch(/Summary\s+-/)
  } finally {
    server.stop(true)
    rmSync(home, { recursive: true, force: true })
  }
})
