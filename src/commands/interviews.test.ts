import { describe, expect, test } from "bun:test"
import { Command } from "commander"
import { buildInterviewConfig, registerInterviewsCommand } from "./interviews"

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
