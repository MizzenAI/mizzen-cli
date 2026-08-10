import { describe, expect, test } from "bun:test"
import {
  assertFollowUpSupported,
  buildScaleConfig,
  deleteOptionById,
  findQuestion,
  findQuestionOptions,
  parseOptions,
  reorderOptions,
  resolveQuestionType,
  updateOptionById,
  withStableOptionIds,
} from "./questions"
import type { OutlineResponse, StudyGuideOption } from "../types/api"

const OPTION_A = "11111111-1111-4111-8111-111111111111"
const OPTION_B = "22222222-2222-4222-8222-222222222222"

const optionA: StudyGuideOption = {
  id: OPTION_A,
  text: "Option 4",
  status: "neutral",
  isExclusive: true,
}
const optionB: StudyGuideOption = {
  id: OPTION_B,
  text: "Option 5",
  isOtherOption: true,
}
const options: StudyGuideOption[] = [optionA, optionB]

const outline: OutlineResponse = {
  outline: [{
    id: "section-id",
    readableId: "S1",
    sectionTitle: "Section",
    sectionType: "flat",
    items: [{
      id: "question-id",
      readableId: "Q1",
      itemType: "question",
      questionType: "multiple_choice",
      text: "Question",
      options,
    }, {
      id: "statement-id",
      readableId: "T1",
      itemType: "statement",
      questionType: null,
      text: "Statement",
    }],
  }],
}

describe("parseOptions", () => {
  test("assigns a unique UUID to every option", () => {
    const options = parseOptions("+全职,-学生,其他")

    expect(options.map(({ text, status }) => ({ text, status }))).toEqual([
      { text: "全职", status: "approve" },
      { text: "学生", status: "reject" },
      { text: "其他", status: undefined },
    ])
    expect(new Set(options.map((option) => option.id)).size).toBe(options.length)
    for (const option of options) {
      expect(option.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      )
    }
  })

  test("fills missing payload ids while preserving existing ids and metadata", () => {
    const body = {
      options: [
        { text: "Option 4", status: "neutral", isExclusive: true },
        { id: OPTION_A, text: "Option 5", isOtherOption: true },
        "Option 6",
        { id: "", text: "Invalid option" },
      ],
    }

    const result = withStableOptionIds(body)
    const resultOptions = result["options"] as Array<Record<string, unknown>>

    expect(resultOptions[0]).toMatchObject({
      text: "Option 4",
      status: "neutral",
      isExclusive: true,
    })
    expect(resultOptions[0]?.["id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(resultOptions[1]).toEqual({
      id: OPTION_A,
      text: "Option 5",
      isOtherOption: true,
    })
    expect(resultOptions[2]?.["text"]).toBe("Option 6")
    expect(resultOptions[2]?.["id"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    )
    expect(resultOptions[3]).toEqual({ id: "", text: "Invalid option" })
    expect(body.options[0]).not.toHaveProperty("id")
  })
})

describe("stable option edits", () => {
  test("reads options from the outline", () => {
    expect(findQuestion(outline, "question-id").questionType).toBe("multiple_choice")
    expect(resolveQuestionType(findQuestion(outline, "statement-id"))).toBe("statement")
    expect(findQuestionOptions(outline, "question-id")).toEqual(options)
  })

  test("updates text without changing identity or option metadata", () => {
    expect(updateOptionById(options, OPTION_A, { text: "option 4" })).toEqual([
      { id: OPTION_A, text: "option 4", status: "neutral", isExclusive: true },
      optionB,
    ])
  })

  test("deletes and reorders by stable id", () => {
    expect(deleteOptionById(options, OPTION_A)).toEqual([optionB])
    expect(reorderOptions(options, [OPTION_B, OPTION_A])).toEqual([optionB, optionA])
  })

  test("rejects incomplete reorder lists and legacy options without ids", () => {
    expect(() => reorderOptions(options, [OPTION_A])).toThrow("every option id exactly once")
    expect(() => reorderOptions(["legacy", optionA], [OPTION_A])).toThrow("stable ids")
  })
})

describe("question follow-up", () => {
  test("validates open-ended follow-up and rejects it for structured questions", () => {
    expect(() => assertFollowUpSupported({ questionType: "open_ended", followUp: "heavy" })).not.toThrow()
    expect(() => assertFollowUpSupported({ questionType: "open_ended", followUp: "timed", timeBudget: 5 })).not.toThrow()
    expect(() => assertFollowUpSupported({ questionType: "open_ended", followUp: "timed" })).toThrow(
      "requires --time-budget",
    )
    expect(() => assertFollowUpSupported({ questionType: "open_ended", followUp: "auto" })).toThrow(
      "none, light, heavy, timed",
    )
    expect(() => assertFollowUpSupported({ questionType: "open_ended", followUp: "heavy", timeBudget: 5 })).toThrow(
      "requires timed follow-up",
    )
    for (const questionType of ["multiple_choice", "scale", "submission", "cascading", "matrix", "ranking", "proportion"]) {
      expect(() => assertFollowUpSupported({ questionType, followUp: "none" })).toThrow(
        `Question type '${questionType}' does not support follow-up`,
      )
    }
    expect(() => assertFollowUpSupported({ itemType: "statement", followUp: "none" })).toThrow(
      "Question type 'statement' does not support follow-up",
    )
  })
})

describe("scale config", () => {
  test("builds a complete config and rejects partial updates", () => {
    expect(buildScaleConfig({}, true)).toEqual({ minLabel: "", maxLabel: "", minValue: 0, maxValue: 10 })
    expect(buildScaleConfig({ minLabel: "低", maxLabel: "高", minValue: "1", maxValue: "7" })).toEqual({
      minLabel: "低",
      maxLabel: "高",
      minValue: 1,
      maxValue: 7,
    })
    expect(() => buildScaleConfig({ minLabel: "低" })).toThrow("require --min-label, --max-label")
  })
})
