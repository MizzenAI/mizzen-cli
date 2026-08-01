import { describe, expect, test } from "bun:test"
import {
  deleteOptionById,
  findQuestionOptions,
  parseOptions,
  reorderOptions,
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
    expect(body.options[0]).not.toHaveProperty("id")
  })
})

describe("stable option edits", () => {
  test("reads options from the outline", () => {
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
