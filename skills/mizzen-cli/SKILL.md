---
name: mizzen-cli
description: |
  AI 访谈设计与管理技能。通过 Mizzen CLI 创建和管理用户研究访谈。
  触发词: create interview, design study guide, user research, user interview, 用户访谈, 访谈设计,
  study guide, 调研, 创建访谈, 设计大纲, research interview, screener design.
  核心能力: 访谈创建、大纲设计、题目设计、甄别筛选、对话数据获取。
---

# Mizzen CLI Skill

通过 Mizzen CLI 设计和管理用户研究访谈。本 skill 包含访谈设计方法论和 CLI 使用指南。

**CRITICAL — 使用任何 CLI 命令前，必须先确认认证状态：`mizzen auth status`**

## Core Concepts

- **Interview**：访谈项目，由 `slug` 标识。包含标题、研究背景、目标、欢迎语、结束语等配置
- **Outline**：访谈大纲，由多个 Section 组成
- **Section**：板块，由 `section_id` 标识。类型：`flat`（普通）/ `screening`（甄别）/ `concept`（概念测试）
- **Question**：题目，由 `question_id` 标识。类型：`open_ended` / `multiple_choice` / `scale` / `submission` / `statement`
- **Conversation**：一次对话（一个受访者的完整访谈过程），由 `readable_id` 标识
- **Insight**：洞察报告，基于多个已完成对话的 AI 分析

## Resource Relationships

```
Interview (slug)
├── Outline
│   ├── Section (section_id)
│   │   ├── Question (question_id)
│   │   └── Question
│   └── Section
│       └── Question
├── Conversation (readable_id)
│   ├── Messages (role + content + timestamp)
│   ├── Transcript (纯文本逐字稿)
│   └── Answers (结构化回答)
└── Insight (洞察报告)
```

## 行为决策指引

> **意图识别**：先判断用户要做什么，再选择对应的命令。不要混淆类似操作。

### 创建 vs 查看 vs 分析

| 用户意图 | 应该做什么 | 不要做什么 |
|----------|-----------|-----------|
| "帮我设计一个访谈" | 走完整工作流（[workflow.md](rules/workflow.md)）：理解目标 → 设计大纲 → 确认 → 创建 | 不要跳过方法论直接 `interview create` |
| "查看访谈数据" | `conversation list` → `conversation get/transcript/answers` | 不要用 `interview get`（那是看配置，不是看数据） |
| "有多少人参与了" | `interview stats <slug>` | 不要用 `conversation list` 手动计数 |
| "分析结果 / 出报告" | `insight get` → 没有则 `insight generate` | 不要自己逐个读 conversation 手动总结 |
| "修改题目" | 先 `outline show` 获取当前状态和 ID，再 `question update` | 不要凭记忆操作，先看当前大纲 |
| "访谈链接在哪" | `interview get <slug>` 返回管理链接和分享链接 | 不要用 `interview list` |

### ID 获取规则

> **所有 ID 都必须从命令返回值获取，不要猜测或编造。**

| 需要的 ID | 从哪里获取 |
|-----------|-----------|
| `slug` | `interview create` 返回值 或 `interview list` |
| `section_id` | `outline section add` 返回值 或 `outline show` |
| `question_id` | `outline question add` 返回值 或 `outline show` |
| `readable_id`（对话编号） | `conversation list` 返回的 # 列 |

## 核心原则

| 原则 | 规则 |
|------|------|
| 开放题优先 | 优先使用开放题探索"为什么"；选择题仅用于甄别或量化 |
| 问"为什么"和"怎么" | 关注动机和过程，而非只问"是什么"和"什么时候" |
| 具体化提问 | **必须问具体事件**（"你昨天/上次……发生了什么"），**禁止问泛泛感受**（"你觉得……怎么样"） |
| 场景化切入 | 每道题要有明确的场景锚点（时间、地点、触发事件） |
| 追问深度 | 甄别题用 `none`，事实性问题用 `light`，深度探索用 `heavy` |
| 访谈时长 | 目标约 20-30 分钟（10-15 题），最长不超过 1 小时 |
| 甄别选项 | 甄别题的选项用 `+` 标记通过、`-` 标记筛除，在 `--options` 中设置 |

## 方法论规则

| 文件 | 内容 | 何时读取 |
|------|------|----------|
| [workflow.md](rules/workflow.md) | 分步创建工作流（10 步） | 开始创建访谈前 |
| [question-design.md](rules/question-design.md) | 题型选择、设计原则、写作规范 | 设计题目时 |
| [screening.md](rules/screening.md) | 甄别题设计、意图伪装、陷阱选项 | 添加甄别板块时 |
| [follow-up.md](rules/follow-up.md) | 追问深度策略（none/light/heavy） | 设置追问级别时 |
| [instructions.md](rules/instructions.md) | 条件逻辑、追问引导 | 编写访谈指引时 |

## CLI 命令参考

> **重要**：使用命令前，先读取对应的 reference 文件了解参数和注意事项。

| 命令 | Reference | 说明 |
|------|-----------|------|
| `interview create/get/list/update/delete/publish/share/stats` | [interview.md](references/interview.md) | 访谈创建、查看、修改、发布、分享 |
| `outline show/section/question` | [outline.md](references/outline.md) | 大纲查看、板块管理、题目管理 |
| `conversation list/get/transcript/answers` | [conversation.md](references/conversation.md) | 对话列表、详情、逐字稿、结构化回答 |
| `insight get/generate` | [insight.md](references/insight.md) | 洞察报告获取与生成 |
| `auth/config` | [auth-config.md](references/auth-config.md) | API Key 管理、CLI 配置 |
