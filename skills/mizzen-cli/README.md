<p align="center">
  <img src="https://mizzen.top/logo.svg" alt="Mizzen" width="100" />
</p>

<h1 align="center">Mizzen CLI Skill</h1>

<p align="center">
  <a href="https://github.com/MizzenAI/mizzen-cli">Mizzen CLI</a> 的 AI Agent 技能包 — 让你的 Agent 掌握用户访谈设计方法论。
</p>

<p align="center">
  <a href="#安装">安装</a> · <a href="#技能内容">技能内容</a> · <a href="#自定义-agent-接入">自定义 Agent</a>
</p>

<p align="center">
  支持 Claude Code、Cursor、Windsurf 及所有兼容 <a href="https://www.npmjs.com/package/skills">open skills</a> 的 AI Agent。
</p>

---

## 安装

**1. 安装 Skill + CLI：**

```bash
# 安装 CLI + 技能包
npm install -g @mizzenai/mizzen-cli
npx skills add MizzenAI/mizzen-cli -g
```

<details>
<summary>指定 Agent</summary>

```bash
npx skills add MizzenAI/mizzen-cli -a claude-code -g
npx skills add MizzenAI/mizzen-cli -a cursor -g
```

</details>

**2. 配置：**

```bash
mizzen-cli auth set-key <your-api-key>
```

API Key 在 [Mizzen 工作区设置](https://mizzen.top) 中创建。

**3. 让 Agent 开始工作：**

```
"帮我设计一个关于夏季饮料偏好的用户访谈"
"我想了解用户为什么流失，帮我设计访谈"
"创建一个新功能可用性测试的访谈大纲"
```

Agent 会分步引导你完成整个过程 — 理解目标、设计大纲、确认后创建、发布。你始终掌控全局。

---

## 技能内容

这个技能包教会你的 AI Agent **访谈设计方法论** — 不只是怎么调命令，而是怎么设计出专业的用户研究访谈。

| 技能 | 内容 |
|------|------|
| **工作流** | 分步创建流程：研究目标 → 大纲设计 → 用户确认 → 创建 → 发布 |
| **题目设计** | 开放题 / 选择题 / 量表题的使用场景、写作原则、常见错误 |
| **甄别设计** | 意图伪装、选项分散、陷阱选项，防止受访者作弊 |
| **追问策略** | 三级追问深度（none / light / heavy），每级有明确规则 |
| **访谈指引** | 条件跳转逻辑、分支路由、AI 主持人的追问方向引导 |
| **CLI 参考** | 完整命令参考，覆盖访谈、题目、对话、洞察报告 |

### CLI 命令概览

| 类别 | 命令 |
|------|------|
| 📋 访谈管理 | `create`, `update`, `delete`, `publish`, `share`, `get`, `list`, `stats` |
| 📝 大纲管理 | `show`, `section add/update/delete/reorder`, `question add/update/delete/reorder` |
| 💬 对话数据 | `list`, `get`, `transcript`, `answers` |
| 📊 洞察报告 | `get`, `generate` |
| 🔑 认证 | `set-key`, `status`, `clear` |
| ⚙️ 配置 | `show`, `set`, `reset` |

---

## 自定义 Agent 接入

如果你在开发自己的 Agent，可以直接 clone 本仓库。整个技能包是纯 Markdown 文件，不依赖任何框架。

```
SKILL.md                      # 入口：核心原则 + 规则索引
rules/workflow.md             # 分步创建工作流
rules/question-design.md      # 题型选择与写作规范
rules/screening.md            # 甄别题设计与意图伪装
rules/follow-up.md            # 追问深度策略
rules/instructions.md         # 条件逻辑与追问引导
references/                   # CLI 命令参考 (interview/outline/conversation/insight/auth-config)
```

---

## 相关项目

- [Mizzen](https://mizzen.top) — AI 用户访谈平台

---

<p align="center">
  <a href="https://mizzen.top">mizzen.top</a> · MIT License
</p>
