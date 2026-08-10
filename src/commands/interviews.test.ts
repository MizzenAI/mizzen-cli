import { describe, expect, test } from "bun:test"
import { buildInterviewConfig } from "./interviews"

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
