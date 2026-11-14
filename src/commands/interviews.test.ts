import { afterEach, beforeEach, describe, expect, mock, spyOn, test } from "bun:test"
import { Command } from "commander"
import { buildInterviewConfig, registerInterviewsCommand } from "./interviews"
import * as config from "../config"
import * as auth from "../auth"
import { ConfigSchema } from "../types/config"
import { MizzenClient } from "../client"
import { publishInterviewAndWait } from "./interviews"
describe("interview field visibility in help", () => {
  for (const name of ["create", "update"]) {
    test(`${name} explains respondent-facing descriptions and internal backgrounds`, () => {
      const program = new Command()
      registerInterviewsCommand(program)
      const interview = program.commands.find(command => command.name() === "interview")!
      const command = interview.commands.find(command => command.name() === name)!
      const help = command.helpInformation().replace(/\s+/g, " ").toLowerCase()

      expect(help).toContain("introduction shown to respondents")
      expect(help).toContain("no internal notes or instructions")
      expect(help).toContain("internal research background")
      expect(help).toContain("not shown on the respondent start page")
      expect(help).not.toContain("internal description")
      expect(command.options.find(option => option.long === "--description")!.attributeName()).toBe("description")
      expect(command.options.find(option => option.long === "--background")!.attributeName()).toBe("background")
    })
  }
})

describe("interview TTS config", () => {
  test("serializes TTS as an object without dropping existing settings", () => {
    expect(buildInterviewConfig({ mode: "audio", talkMode: "manual", tts: true })).toEqual({
      interviewMode: "audio",
      talkMode: "manual",
      tts: { enabled: true },
    })
    expect(buildInterviewConfig(
      { tts: false },
      { enabled: true, speed: 1.2, voiceByLanguage: { zh: { voiceId: "voice-1" } } },
    )).toEqual({
      tts: { enabled: false, speed: 1.2, voiceByLanguage: { zh: { voiceId: "voice-1" } } },
    })
    expect(buildInterviewConfig({ tts: true }, false)).toEqual({ tts: { enabled: true } })
    expect(() => buildInterviewConfig({ tts: true }, [])).toThrow(
      "Interview TTS config must be an object",
    )
  })
})


const published = { slug: "study", status: "active", published_at: "2026-11-14" }
const complete = { locale: "en", status: "complete", missing: 0, total: 3, job: null }
const running = { ...complete, status: "generating", missing: 2, job: { status: "running", done: 1, total: 3, failed_count: 0 } }
let calls: Array<{ path: string; body: unknown }>
let responses: Array<{ status?: number; body: unknown }>
let stderr: string
let stdout: string

beforeEach(() => {
  calls = []
  responses = []
  stderr = ""
  stdout = ""
  spyOn(config, "loadConfig").mockReturnValue(ConfigSchema.parse({}))
  spyOn(auth, "loadApiKey").mockReturnValue("test-key")
  spyOn(process.stderr, "write").mockImplementation((chunk: any) => { stderr += String(chunk); return true })
  spyOn(process.stdout, "write").mockImplementation((chunk: any) => { stdout += String(chunk); return true })
  spyOn(process, "exit").mockImplementation((code) => { throw new Error(`exit:${code}`) })
  spyOn(globalThis, "fetch").mockImplementation((async (url: URL | RequestInfo, options?: RequestInit) => {
    calls.push({ path: new URL(String(url)).pathname, body: options?.body ? JSON.parse(String(options.body)) : undefined })
    const next = responses.shift()
    if (!next) throw new Error("Unexpected request")
    return Response.json(next.body, { status: next.status ?? 200 })
  }) as typeof fetch)
})
afterEach(() => mock.restore())

async function command(...args: string[]) {
  const program = new Command()
  registerInterviewsCommand(program)
  await program.parseAsync(["interview", ...args], { from: "user" })
}
const checkPassed = { body: { error_count: 0, warning_count: 0, issues: [] } }
const inProgress = { status: 409, body: { detail: { code: "TRANSLATIONS_IN_PROGRESS", languages: [running] } } }

describe("atomic interview publish", () => {
  test("default publishes with auto_translate true and prints summary", async () => {
    responses.push(checkPassed, { body: published })
    await command("publish", "study")
    expect(calls[1]?.body).toEqual({ auto_translate: true })
    expect(stdout).toContain("active")
    expect(stderr).toContain("published")
  })

  test("strict mode reports per-locale missing counts and exits 1", async () => {
    responses.push(checkPassed, { status: 409, body: { detail: { code: "TRANSLATIONS_INCOMPLETE", incomplete: { en: 3, ja: 2 } } } })
    await expect(command("publish", "study", "--no-auto-translate")).rejects.toThrow("exit:1")
    expect(calls[1]?.body).toEqual({ auto_translate: false })
    expect(stderr).toContain("en: missing 3")
    expect(stderr).toContain("ja: missing 2")
    expect(calls).toHaveLength(2)
  })

  test("polls queued and running jobs then retries atomic publish", async () => {
    responses.push(inProgress, { body: { languages: [{ ...running, job: { ...running.job, status: "queued" } }] } },
      { body: { languages: [running] } }, { body: { languages: [complete] } }, { body: published })
    const result = await publishInterviewAndWait(new MizzenClient(), "study", true, { pollIntervalMs: 1 })
    expect(result).toEqual(published)
    expect(calls.map(c => c.path)).toEqual([
      "/open/v1/interviews/study/publish", "/open/v1/interviews/study/languages", "/open/v1/interviews/study/languages",
      "/open/v1/interviews/study/languages", "/open/v1/interviews/study/publish",
    ])
    expect(calls[4]?.body).toEqual({ auto_translate: true })
    expect(stderr).toContain("1/3")
  })

  test.each(["failed", "incomplete", "empty_draft"])("terminal %s exits 1 and never republishes", async (status) => {
    responses.push(checkPassed, inProgress, { body: { languages: [{ ...running, status, missing: 2,
      failed_targets: [{ hash: "h1", scope: "question-1" }], job: { status: "finished", done: 1, total: 3, failed_count: 2, last_error_code: "TRANSLATION_INVALID" },
    }] } })
    await expect(command("publish", "study")).rejects.toThrow("exit:1")
    expect(stderr).toContain("missing 2")
    expect(stderr).toContain("failed 2")
    expect(stderr).toContain("TRANSLATION_INVALID")
    expect(stderr).toContain("question-1")
    expect(calls).toHaveLength(3)
  })

  test("bounds repeated in-progress responses with one timeout", async () => {
    responses.push(...Array.from({ length: 100 }, (_, index) => index % 2 === 0 ? inProgress : { body: { languages: [complete] } }))
    await expect(publishInterviewAndWait(new MizzenClient(), "study", true, { timeoutMs: 10, pollIntervalMs: 1 })).rejects.toThrow("timed out")
  })

  test("does not retry unrelated conflicts", async () => {
    responses.push({ status: 409, body: { detail: { code: "CONTENT_CHANGED", message: "Draft changed" } } })
    await expect(publishInterviewAndWait(new MizzenClient(), "study")).rejects.toThrow("CONTENT_CHANGED")
    expect(calls).toHaveLength(1)
  })

  test("study check errors prevent publishing", async () => {
    responses.push({ body: { error_count: 1, warning_count: 0, issues: [] } })
    await expect(command("publish", "study")).rejects.toThrow("exit:1")
    expect(calls).toHaveLength(1)
  })
})

describe("source language commands", () => {
  for (const name of ["create", "update"]) {
    const args = name === "create" ? [name, "-t", "Study"] : [name, "study"]
    test(`${name} serializes explicit pin and automatic detection`, async () => {
      responses.push({ body: published }, { body: published }, { body: published })
      await command(...args, "--source-language", "en")
      await command(...args, "--auto-source-language")
      await command(...args)
      expect(calls[0]?.body).toMatchObject({ source_language: "en" })
      expect(calls[0]?.body).not.toHaveProperty("source_language_mode")
      expect(calls[1]?.body).toMatchObject({ source_language_mode: "auto" })
      expect(calls[1]?.body).not.toHaveProperty("source_language")
      expect(calls[2]?.body).not.toHaveProperty("source_language")
      expect(calls[2]?.body).not.toHaveProperty("source_language_mode")
    })
    test(`${name} rejects both flags before HTTP`, async () => {
      await expect(command(...args, "--source-language", "en", "--auto-source-language")).rejects.toThrow("exit:1")
      expect(stderr).toContain("cannot be used together")
      expect(calls).toHaveLength(0)
    })
  }
  test("get displays language and mode when present", async () => {
    responses.push({ body: { ...published, source_language: "en", source_language_mode: "manual" } })
    await command("get", "study")
    expect(stdout).toContain("Source language")
    expect(stdout).toContain("manual")
  })
})

test("waits for all locales before reporting terminal failures", async () => {
  const failed = { ...complete, status: "failed", missing: 2, job: { status: "finished", done: 1, total: 3, failed_count: 2 } }
  responses.push(inProgress,
    { body: { languages: [failed, { ...running, locale: "ja" }] } },
    { body: { languages: [failed, { ...complete, locale: "ja" }] } },
  )
  await expect(publishInterviewAndWait(new MizzenClient(), "study", true, { pollIntervalMs: 1 })).rejects.toThrow("TRANSLATIONS_INCOMPLETE")
  expect(calls).toHaveLength(3)
})

test("strict publish does not poll an in-progress response", async () => {
  responses.push(checkPassed, inProgress)
  await expect(command("publish", "study", "--no-auto-translate")).rejects.toThrow("exit:1")
  expect(calls).toHaveLength(2)
})

test("get omits source fields on older responses", async () => {
  responses.push({ body: published })
  await command("get", "study")
  expect(stdout).not.toContain("Source language")
})
