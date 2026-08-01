import { describe, expect, test } from "bun:test"
import { formatStructuredDetail } from "./client"

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
