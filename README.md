<h1 align="center">Mizzen CLI</h1>

<p align="center">
  Mizzen 命令行工具 + AI Agent 技能包 — 通过命令行管理用户研究访谈，内置访谈设计方法论。
</p>

<p align="center">
  <a href="#安装">安装</a> · <a href="#快速开始">快速开始</a> · <a href="#ai-agent-技能">AI Agent 技能</a> · <a href="#命令参考">命令参考</a> · <a href="#自定义-agent-接入">自定义 Agent</a>
</p>

<p align="center">
  支持 Claude Code、Cursor、Windsurf 及所有兼容 <a href="https://www.npmjs.com/package/skills">open skills</a> 的 AI Agent。
</p>

---

## 安装

```bash
# 安装 CLI
npm install -g @mizzenai/cli

# 安装 AI Agent 技能包
npx skills add MizzenAI/mizzen-cli -g

# 配置 API Key（在 Mizzen 工作区设置中创建）
mizzen-cli auth set-key <your-api-key>
```

<details>
<summary>指定 Agent</summary>

```bash
npx skills add MizzenAI/mizzen-cli -a claude-code -g
npx skills add MizzenAI/mizzen-cli -a cursor -g
```

</details>

---

## 快速开始

### 让 AI Agent 创建访谈

安装完成后，直接告诉你的 AI Agent：

```
"帮我设计一个关于夏季饮料偏好的用户访谈"
"我想了解用户为什么流失，帮我设计访谈"
"创建一个新功能可用性测试的访谈大纲"
```

Agent 会按方法论分步引导：理解目标 → 设计大纲 → 确认 → 创建 → 发布 → 生成分享链接。

### 手动使用 CLI

```bash
# 查看访谈列表
mizzen-cli interview list

# 创建访谈
mizzen-cli interview create -t "产品体验调研" --mode audio

# 查看大纲
mizzen-cli outline show <slug>

# 添加题目
mizzen-cli outline question add <slug> <section-id> \
  --text "你上次使用这个产品是什么时候？" \
  --type open_ended --follow-up heavy

# 添加甄别题（+通过 / -筛除）
mizzen-cli outline question add <slug> <section-id> \
  --text "你的职业是？" \
  --type multiple_choice \
  --options "+软件工程师,-教师,-医生,-会计" \
  --follow-up none

# 发布并生成分享链接
mizzen-cli interview publish <slug>
mizzen-cli interview share <slug>

# 查看对话数据
mizzen-cli conversation list <slug>
mizzen-cli conversation transcript <slug> 1

# 生成洞察报告
mizzen-cli insight generate <slug>
```

---

## AI Agent 技能

技能包（`skills/mizzen-cli/`）教会你的 AI Agent **访谈设计方法论** — 不只是怎么调命令，而是怎么设计出专业的用户研究访谈。

| 技能 | 内容 |
|------|------|
| **工作流** | 分步创建流程：研究目标 → 大纲设计 → 用户确认 → 创建 → 发布 |
| **题目设计** | 开放题 / 选择题 / 量表题的使用场景、写作原则、常见错误 |
| **甄别设计** | 意图伪装、选项分散、陷阱选项，防止受访者作弊 |
| **追问策略** | 三级追问深度（none / light / heavy），每级有明确规则 |
| **访谈指引** | 条件跳转逻辑、分支路由、AI 主持人的追问方向引导 |
| **CLI 参考** | 完整命令参考，覆盖访谈、题目、对话、洞察报告 |

---

## 命令参考

| 类别 | 命令 |
|------|------|
| 📋 访谈管理 | `create`, `update`, `delete`, `publish`, `share`, `get`, `list`, `stats` |
| 📝 大纲管理 | `show`, `section add/update/delete/reorder`, `question add/update/delete/reorder` |
| 💬 对话数据 | `list`, `get`, `transcript`, `answers` |
| 📊 洞察报告 | `get`, `generate` |
| 🔑 认证 | `set-key`, `status`, `clear` |
| ⚙️ 配置 | `show`, `set`, `reset` |

所有命令支持 `--json` / `--csv` 输出。

```bash
# 查看帮助
mizzen-cli --help
mizzen-cli interview --help
mizzen-cli outline question add --help
```

---

## 自定义 Agent 接入

如果你在开发自己的 Agent，可以直接使用 `skills/mizzen-cli/` 目录下的内容。整个技能包是纯 Markdown 文件，不依赖任何框架。

```
skills/mizzen-cli/
  SKILL.md                      # 入口：核心原则 + 规则索引
  rules/workflow.md             # 分步创建工作流
  rules/question-design.md      # 题型选择与写作规范
  rules/screening.md            # 甄别题设计与意图伪装
  rules/follow-up.md            # 追问深度策略
  rules/instructions.md         # 条件逻辑与追问引导
  rules/cli-reference.md        # 完整 CLI 命令参考
```

---

## 相关

- [Mizzen](https://mizzen.chat) — AI 用户访谈平台

---

<p align="center">
  <a href="https://mizzen.chat">mizzen.chat</a> · MIT License
</p>
