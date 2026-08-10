import { describe, expect, test } from "bun:test"
import { mkdtempSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { getCachedUpdate } from "./update-notifier"

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
})
