import { describe, expect, test } from "bun:test"
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { checkForUpdate, getCachedUpdate, refreshUpdateState } from "./update-notifier"

describe("update notifier", () => {
  test("returns a notice only when the cached npm version is newer", () => {
    const path = join(mkdtempSync(join(tmpdir(), "mizzen-update-")), "state.json")
    writeFileSync(path, JSON.stringify({ latestVersion: "0.3.0", checkedAt: Date.now() }))

    expect(getCachedUpdate("0.2.0", path)).toEqual({
      currentVersion: "0.2.0",
      latestVersion: "0.3.0",
    })
    expect(getCachedUpdate("0.3.0", path)).toBeNull()
    expect(getCachedUpdate("0.4.0", path)).toBeNull()
  })

  test("the detached worker caches the registry result", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "mizzen-update-")), "state.json")
    const originalFetch = globalThis.fetch
    const originalCI = process.env["CI"]
    delete process.env["CI"]
    globalThis.fetch = Object.assign(
      async () => new Response(JSON.stringify({ version: "0.3.0" })),
      { preconnect: originalFetch.preconnect },
    )

    try {
      await refreshUpdateState(path)
      expect(getCachedUpdate("0.2.0", path)?.latestVersion).toBe("0.3.0")
    } finally {
      globalThis.fetch = originalFetch
      if (originalCI === undefined) delete process.env["CI"]
      else process.env["CI"] = originalCI
    }
  })

  test("schedules a refresh without waiting for network", () => {
    const path = join(mkdtempSync(join(tmpdir(), "mizzen-update-")), "missing.json")
    let scheduled = false
    const originalCI = process.env["CI"]
    delete process.env["CI"]

    try {
      expect(checkForUpdate("0.2.0", path, () => { scheduled = true })).toBeNull()
      expect(scheduled).toBe(true)
    } finally {
      if (originalCI === undefined) delete process.env["CI"]
      else process.env["CI"] = originalCI
    }
  })

  test("the CLI exits before its detached worker writes the cache", async () => {
    const home = mkdtempSync(join(tmpdir(), "mizzen-update-home-"))
    const statePath = join(home, ".mizzen", "update-state.json")
    const server = Bun.serve({
      port: 0,
      fetch: async () => {
        await Bun.sleep(300)
        return Response.json({ version: "0.3.0" })
      },
    })
    const env: Record<string, string | undefined> = {
      ...process.env,
      HOME: home,
      MIZZEN_CLI_UPDATE_REGISTRY_URL: `${server.url}latest`,
    }
    delete env["CI"]

    try {
      const cli = Bun.spawn([process.execPath, "src/index.ts", "--version"], {
        cwd: process.cwd(),
        env,
        stdout: "pipe",
        stderr: "pipe",
      })
      expect(await cli.exited).toBe(0)
      expect(existsSync(statePath)).toBe(false)

      for (let attempt = 0; attempt < 20 && !existsSync(statePath); attempt++) {
        await Bun.sleep(100)
      }

      expect(JSON.parse(readFileSync(statePath, "utf-8"))).toMatchObject({
        latestVersion: "0.3.0",
      })
    } finally {
      server.stop(true)
      rmSync(home, { recursive: true, force: true })
    }
  })

  test("JSON output carries the update notice while text output keeps the warning", async () => {
    const home = mkdtempSync(join(tmpdir(), "mizzen-update-home-"))
    const configDir = join(home, ".mizzen")
    const currentVersion = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf-8")).version
    const latestVersion = "99.0.0"
    mkdirSync(configDir)
    writeFileSync(join(configDir, "update-state.json"), JSON.stringify({
      latestVersion,
      checkedAt: Date.now(),
    }))
    const env: Record<string, string | undefined> = { ...process.env, HOME: home }
    delete env["CI"]

    try {
      const cli = Bun.spawn([process.execPath, "src/index.ts", "config", "show"], {
        cwd: process.cwd(),
        env,
        stdout: "pipe",
        stderr: "pipe",
      })
      const stdout = await new Response(cli.stdout).text()
      const stderr = await new Response(cli.stderr).text()

      expect(await cli.exited).toBe(0)
      expect(JSON.parse(stdout)["_notice"]).toEqual({
        update: {
          current: currentVersion,
          latest: latestVersion,
          message: `mizzen-cli ${latestVersion} available, current ${currentVersion}`,
          command: "npm update -g @mizzenai/cli",
        },
      })
      expect(stderr).toBe("")

      const versionCli = Bun.spawn([process.execPath, "src/index.ts", "--version"], {
        cwd: process.cwd(),
        env,
        stdout: "pipe",
        stderr: "pipe",
      })
      expect((await new Response(versionCli.stdout).text()).trim()).toBe(currentVersion)
      expect(await new Response(versionCli.stderr).text()).toContain(
        `Warning: mizzen-cli ${latestVersion} is available (current ${currentVersion})`,
      )
      expect(await versionCli.exited).toBe(0)
    } finally {
      rmSync(home, { recursive: true, force: true })
    }
  })
})
