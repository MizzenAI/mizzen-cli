# interview 访谈管理

创建、查看、修改、删除、发布、分享访谈项目。

## Recommended Commands

```bash
# 创建完整访谈
mizzen-cli interview create \
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
mizzen-cli interview create -t "饮料偏好调研"

# 列出所有访谈
mizzen-cli interview list

# 按状态筛选
mizzen-cli interview list --status draft
mizzen-cli interview list --status active

# 搜索访谈
mizzen-cli interview list --search "饮料"

# 查看访谈详情（含管理链接和分享链接）
mizzen-cli interview get <slug>

# 修改访谈
mizzen-cli interview update <slug> -t "新标题"
mizzen-cli interview update <slug> --mode video --talk-mode auto --tts
mizzen-cli interview update <slug> --external-title "新的对外标题"

# 删除访谈
mizzen-cli interview delete <slug>

# 运行质量检查
mizzen-cli interview check <slug>

# 发布（draft → active，内部会先自动运行 check）
mizzen-cli interview publish <slug>

# 创建分享链接（自动发布，返回受访者参与链接）
mizzen-cli interview share <slug>

# 查看统计数据
mizzen-cli interview stats <slug>
```

## Parameters

### interview create

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

### interview list

| 参数 | 说明 |
|------|------|
| `--status <status>` | 按状态筛选：`draft` / `active` |
| `--search <keyword>` | 按标题搜索 |

### interview update

与 `create` 相同的参数，只传需要修改的字段。

## Workflow

### 创建访谈

1. 先完成方法论设计（见 [workflow.md](../rules/workflow.md) 第一到四步），大纲和配置都确认后再创建
2. 执行 `mizzen-cli interview create ...`，记下返回的 **slug**
3. 用 slug 继续添加板块和题目（见 [outline.md](outline.md)）

### 发布并分享

1. 确认大纲无误：`mizzen-cli outline show <slug>`
2. 运行质量检查：`mizzen-cli interview check <slug>`（publish 也会自动运行）
3. 发布：`mizzen-cli interview publish <slug>`
4. 生成分享链接：`mizzen-cli interview share <slug>`
5. 将分享链接展示给用户

### 修改访谈

1. 查看当前状态：`mizzen-cli interview get <slug>`
2. 执行修改：`mizzen-cli interview update <slug> --field "新值"`
3. 确认修改结果：`mizzen-cli interview get <slug>`

## AI Usage Guidance

- **不要跳过方法论设计直接创建**。必须先理解研究目标、设计大纲、向用户展示确认后再执行创建命令
- **内部标题 vs 对外标题**：内部标题可以直接表达研究意图（如"竞品流失分析"），对外标题应中性、不暴露研究目的（如"产品使用体验调研"）
- **欢迎语不能泄露甄别标准**。比如研究"流失用户"，欢迎语不能说"我们想了解你为什么不用了"
- **结束语不能再提新问题**
- **访谈模式必须问用户**，不要自己决定
- **已发布的访谈修改后需要重新发布才生效**。修改题目、板块、访谈配置后，提醒用户需要重新发布，但不要主动执行发布
- **禁止自作主张发布**。发布是重操作，永远不要自动发布。只能询问用户"是否需要发布？"，等用户明确说"发布"才执行。即使修改完成、check 通过，也不要主动发布
- **`share` 会自动发布**。如果访谈是 draft 状态，`share` 会先发布再生成链接
- **修改后主动提醒用户重新发布**。完成修改操作后，告知用户需要执行 `interview publish` 使修改生效
- **`get` 返回管理链接和分享链接**。用户问"访谈链接"时用 `get` 查看
- **`stats` 查看访谈统计**。用户问"有多少人参与了"时用 `stats`
- **删除操作不可恢复**，必须向用户确认

## Common Errors

| 错误 | 原因 | 解决 |
|------|------|------|
| `401 Unauthorized` | API Key 未配置或无效 | 运行 `mizzen-cli auth set-key <key>` |
| `title is required` | 缺少 `-t` 参数 | 必须传标题 |
| `Interview not found` | slug 不正确 | 用 `interview list` 查找正确的 slug |
| `Interview is already active` | 访谈已是 active 状态 | 这不影响重新发布，修改内容后仍需 `publish` 使变更生效 |

## References

- [workflow.md](../rules/workflow.md) — 完整创建工作流
- [question-design.md](../rules/question-design.md) — 题目设计方法论
