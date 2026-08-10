import { describe, expect, test } from "bun:test"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { checkForUpdate, getCachedUpdate } from "./update-notifier"

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

  test("waits for the first registry check and caches its result", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "mizzen-update-")), "state.json")
    const originalFetch = globalThis.fetch
    const originalCI = process.env["CI"]
    delete process.env["CI"]
    globalThis.fetch = Object.assign(
      async () => new Response(JSON.stringify({ version: "0.3.0" })),
      { preconnect: originalFetch.preconnect },
    )

    try {
      await expect(checkForUpdate("0.2.0", path)).resolves.toEqual({
        currentVersion: "0.2.0",
        latestVersion: "0.3.0",
      })
      expect(getCachedUpdate("0.2.0", path)?.latestVersion).toBe("0.3.0")
    } finally {
      globalThis.fetch = originalFetch
      if (originalCI === undefined) delete process.env["CI"]
      else process.env["CI"] = originalCI
    }
  })
})
