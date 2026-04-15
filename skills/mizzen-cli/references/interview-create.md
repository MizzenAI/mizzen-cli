# interview create

创建一个新的访谈项目。

## Recommended Commands

```bash
# 创建完整访谈
mizzen interview create \
  -t "竞品用户流失分析" \
  --external-title "产品使用体验调研" \
  --background "近3个月用户流失率上升15%，需要了解原因" \
  --goal "挖掘用户放弃使用产品的核心原因和决策过程" \
  --welcome "你好！感谢参与本次调研。我们想了解你使用产品的真实体验，大概需要15分钟。" \
  --closing "感谢你的分享！你的反馈对我们非常有价值。" \
  --language zh-CN \
  --mode audio \
  --talk-mode manual

# 最简创建（仅标题）
mizzen interview create -t "饮料偏好调研"
```

## Parameters

| 参数 | 必填 | 说明 |
|------|------|------|
| `-t, --title <text>` | 是 | 内部标题（研究者管理用，受访者看不到） |
| `--external-title <text>` | 否 | 对外标题（受访者看到的）。不传则等于内部标题 |
| `--background <text>` | 否 | 研究背景 |
| `--goal <text>` | 否 | 研究目标 |
| `--welcome <text>` | 否 | 欢迎语（受访者进入时看到） |
| `--closing <text>` | 否 | 结束语（访谈结束时显示） |
| `--language <code>` | 否 | 语言代码（默认 `zh-CN`） |
| `--mode <mode>` | 否 | 访谈模式：`audio`（默认）/ `video` / `video_screen` / `text` |
| `--talk-mode <mode>` | 否 | 对话模式：`manual`（按键说话，默认）/ `auto`（自动语音检测） |
| `--tts` | 否 | 启用 AI 语音播报 |

## Workflow

1. 先完成方法论设计（见 [workflow.md](../rules/workflow.md) 第一到四步），大纲和配置都确认后再创建
2. 执行 `mizzen interview create ...`，记下返回的 **slug**
3. 用 slug 继续添加板块和题目（见 [outline-section.md](outline-section.md)、[outline-question.md](outline-question.md)）

## AI Usage Guidance

- **不要跳过方法论设计直接创建**。必须先理解研究目标、设计大纲、向用户展示确认后再执行创建命令
- **内部标题 vs 对外标题**：内部标题可以直接表达研究意图（如"竞品流失分析"），对外标题应中性、不暴露研究目的（如"产品使用体验调研"）
- **欢迎语不能泄露甄别标准**。比如研究"流失用户"，欢迎语不能说"我们想了解你为什么不用了"
- **结束语不能再提新问题**
- **访谈模式必须问用户**，不要自己决定

## Common Errors

| 错误 | 原因 | 解决 |
|------|------|------|
| `401 Unauthorized` | API Key 未配置或无效 | 运行 `mizzen auth set-key <key>` |
| `title is required` | 缺少 `-t` 参数 | 必须传标题 |

## References

- [workflow.md](../rules/workflow.md) — 完整创建工作流
- [question-design.md](../rules/question-design.md) — 题目设计方法论
