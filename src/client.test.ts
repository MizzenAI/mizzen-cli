import { describe, expect, test } from "bun:test"
import { formatStructuredDetail } from "./client"
import { afterEach, spyOn, mock } from "bun:test"
import { ApiError, MizzenClient } from "./client"
import * as config from "./config"
import * as auth from "./auth"
import { ConfigSchema } from "./types/config"
describe("formatStructuredDetail", () => {
  test("renders option identity errors with their code and path", () => {
    expect(formatStructuredDetail({
      code: "INVALID_OPTION_ID",
      message: "New study guide options require UUID ids",
      path: "aiMetaInfo.studyGuideState.sections[0].items[0].options[1].id",
    })).toBe(
      "INVALID_OPTION_ID: New study guide options require UUID ids: at aiMetaInfo.studyGuideState.sections[0].items[0].options[1].id",
    )
  })
})


afterEach(() => mock.restore())

test.each(["detail", "error"])("preserves structured %s fields on 409", async (envelope) => {
  spyOn(config, "loadConfig").mockReturnValue(ConfigSchema.parse({}))
  spyOn(auth, "loadApiKey").mockReturnValue("test-key")
  const details = { code: "TRANSLATIONS_INCOMPLETE", message: "Translations missing", incomplete: { en: 2 }, languages: [] }
  spyOn(globalThis, "fetch").mockResolvedValue(Response.json({ [envelope]: details }, { status: 409 }))
  try {
    await new MizzenClient().post("/interviews/study/publish")
    throw new Error("Expected ApiError")
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(409)
    expect((error as ApiError).code).toBe("TRANSLATIONS_INCOMPLETE")
    expect((error as ApiError).details).toEqual(details)
  }
})
