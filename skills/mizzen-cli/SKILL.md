---
name: mizzen-cli
description: |
  AI 访谈设计与管理技能。通过 Mizzen CLI 创建和管理用户研究访谈。
  触发词: create interview, design study guide, user research, user interview, 用户访谈, 访谈设计,
  study guide, 调研, 创建访谈, 设计大纲, research interview, screener design.
  核心能力: 访谈创建、大纲设计、题目设计、甄别筛选、对话数据获取。
---

# Mizzen CLI Skill

通过 Mizzen CLI 设计和管理用户研究访谈。本 skill 包含访谈设计方法论和 CLI 使用指南，帮助你创建专业的用户研究访谈。

## 前置条件

```bash
mizzen auth status    # 确认 CLI 已配置
```

如未配置：
```bash
npm install -g @mizzen/cli
mizzen auth set-key <your-api-key>
```

## 工作流程

**⚠️ 重要：这是一个分步交互式工作流。每一步请先阅读引用的规则文件，完成后向用户展示结果，等用户确认后再进入下一步。**

### 创建访谈

```
理解研究目标 → 设计大纲 → 用户确认 → 通过 CLI 创建访谈 → 添加板块和题目 → 用户确认 → 发布
```

### 修改访谈

```
获取当前大纲 (mizzen interviews outline <slug>) → 理解修改需求 → 通过 CLI 最小化修改
```

详见 [rules/workflow.md](rules/workflow.md)。

## 核心原则

| 原则 | 规则 |
|------|------|
| 开放题优先 | 优先使用开放题探索"为什么"；选择题仅用于甄别或量化 |
| 问"为什么"和"怎么" | 关注动机和过程，而非只问"是什么"和"什么时候" |
| 具体化提问 | 问具体经历（"上次你……"），而非泛泛的行为模式 |
| 追问深度 | 甄别题用 `none`，事实性问题用 `light`，深度探索用 `heavy` |
| 访谈时长 | 目标约 20 分钟（6-10 题），最长不超过 45 分钟 |
| 避免重复 | 每道题应探索明确不同的方面 |
| 简洁提问 | 每题不超过 2-3 句话 |
| 甄别选项 | 甄别题的选项用 `+` 标记通过、`-` 标记筛除，直接在 CLI 的 `--options` 参数中设置 |

## 规则索引

### 方法论

| 文件 | 内容 | 何时参考 |
|------|------|----------|
| [workflow.md](rules/workflow.md) | 分步创建工作流 | 开始任务前 |
| [question-design.md](rules/question-design.md) | 题型选择、设计原则、写作规范 | 设计题目时 |
| [screening.md](rules/screening.md) | 甄别题设计、意图伪装、陷阱选项 | 添加甄别板块时 |
| [follow-up.md](rules/follow-up.md) | 追问深度策略（none/light/heavy） | 设置追问级别时 |
| [instructions.md](rules/instructions.md) | addInstructions：条件逻辑、追问引导 | 编写访谈指引时 |

### CLI 参考

| 文件 | 内容 | 何时参考 |
|------|------|----------|
| [cli-reference.md](rules/cli-reference.md) | 完整 CLI 命令参考与示例 | 执行 CLI 命令时 |
