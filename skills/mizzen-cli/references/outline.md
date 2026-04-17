# outline 大纲管理

查看大纲、管理板块、管理题目。

## outline show — 查看大纲

```bash
mizzen-cli outline show <slug>
```

- **创建完题目后必须用这个命令验证**（工作流第七步）
- **修改前先用这个命令了解当前状态**，不要凭记忆操作
- 返回的数据包含每个 section 的 `id` 和每个 question 的 `id`，后续修改/删除需要用这些 ID
- 返回的选择题选项会显示 approve/reject 状态（`+` / `-` 标记）

---

## outline section — 板块管理

### Recommended Commands

```bash
# 添加普通板块
mizzen-cli outline section add <slug> -t "核心探索" --type flat

# 添加甄别板块
mizzen-cli outline section add <slug> -t "基本信息" --type screening

# 添加概念测试板块
mizzen-cli outline section add <slug> -t "概念测试" --type concept

# 修改板块标题
mizzen-cli outline section update <slug> <section-id> -t "新标题"

# 删除板块（连同所有题目）
mizzen-cli outline section delete <slug> <section-id>

# 重新排序板块（按期望顺序传入所有板块 ID）
mizzen-cli outline section reorder <slug> <uuid1> <uuid2> <uuid3>
```

### Parameters

#### section add

| 参数 | 必填 | 说明 |
|------|------|------|
| `-t, --title <text>` | 是 | 板块标题 |
| `--type <type>` | 否 | 板块类型：`flat`（普通，默认）/ `screening`（甄别）/ `concept`（概念测试） |

#### section update

| 参数 | 说明 |
|------|------|
| `-t, --title <text>` | 新标题 |

#### section reorder

按期望顺序传入**所有**板块的 UUID。

### AI Usage Guidance

- **按方法论顺序添加板块**：甄别（如需要）→ 暖场 → 核心探索（可拆多个）→ 收尾
- **甄别板块只能有一个**，且必须放在最前面
- **每个板块 3-5 道题**，核心探索可拆成多个板块
- **删除板块会连同删除所有题目**，操作前确认
- **`section_id` 从 `outline show` 或 `section add` 返回值获取**，不要猜测

---

## outline question — 题目管理

这是 CLI 中最复杂的命令组，支持多种题型。

### Recommended Commands

```bash
# 添加开放题（深度追问）
mizzen-cli outline question add <slug> <section-id> \
  --text "你上次使用这款产品是什么时候？当时在做什么？" \
  --type open_ended \
  --follow-up heavy \
  --instructions "追问具体的使用场景和遇到的问题"

# 添加选择题（单选）
mizzen-cli outline question add <slug> <section-id> \
  --text "你目前的工作状态是？" \
  --type multiple_choice \
  --options "全职上班,兼职,自由职业,学生,退休" \
  --follow-up none

# 添加甄别选择题（+approve / -reject）
mizzen-cli outline question add <slug> <section-id> \
  --text "你使用过以下哪款产品？" \
  --type multiple_choice \
  --options "+我们的产品,-竞品A,-竞品B,-都没用过" \
  --follow-up none

# 添加多选题
mizzen-cli outline question add <slug> <section-id> \
  --text "你喜欢的品类？（可多选）" \
  --type multiple_choice \
  --options "咖啡,奶茶,果汁,碳酸饮料,纯净水" \
  --multi-select

# 添加量表题
mizzen-cli outline question add <slug> <section-id> \
  --text "你对产品整体的满意程度？" \
  --type scale \
  --min-label "非常不满意" \
  --max-label "非常满意"

# 添加上传题
mizzen-cli outline question add <slug> <section-id> \
  --text "请上传你工位的照片" \
  --type submission \
  --no-allow-text \
  --accepted-types image \
  --max-files 3 \
  --follow-up none

# 添加陈述/过渡语
mizzen-cli outline question add <slug> <section-id> \
  --text "接下来我们聊聊另一个话题。" \
  --type statement

# 插入到特定位置（在某题之后）
mizzen-cli outline question add <slug> <section-id> \
  --text "补充问题" \
  --type open_ended \
  --after <question-uuid>

# 修改题目
mizzen-cli outline question update <slug> <question-id> \
  --text "新的题目文本" \
  --follow-up light

# 修改选项的甄别状态
mizzen-cli outline question update <slug> <question-id> \
  --options "+通过选项,-拒绝选项,中性选项"

# 直接传 JSON body（复杂场景）
mizzen-cli outline question add <slug> <section-id> \
  --payload '{"text":"...","questionType":"multiple_choice","options":[{"text":"选项","status":"approve"}]}'

# 删除题目
mizzen-cli outline question delete <slug> <question-id>

# 重新排序题目
mizzen-cli outline question reorder <slug> <section-id> <uuid1> <uuid2> <uuid3>
```

### Parameters

#### question add

| 参数 | 必填 | 说明 |
|------|------|------|
| `--text <text>` | 是 | 题目内容 |
| `--type <type>` | 否 | 题型：`open_ended`（默认）/ `multiple_choice` / `scale` / `submission` / `statement` |
| `--follow-up <level>` | 否 | 追问深度：`none` / `light` / `heavy` |
| `--instructions <text>` | 否 | AI 主持人的追问引导（见 [instructions.md](../rules/instructions.md)） |
| `--options <list>` | 选择题必填 | 逗号分隔的选项。`+` 前缀=approve，`-` 前缀=reject，无前缀=neutral |
| `--multi-select` | 否 | 选择题改为多选（默认单选） |
| `--min-label <text>` | 量表题 | 量表最小值标签 |
| `--max-label <text>` | 量表题 | 量表最大值标签 |
| `--no-allow-text` | 否 | 上传题禁止文字回复 |
| `--accepted-types <type>` | 否 | 上传题接受的文件类型：`image` / `video` / `audio` / `file` |
| `--max-files <n>` | 否 | 上传题最大文件数 |
| `--after <uuid>` | 否 | 插入到指定题目之后 |
| `--payload <json>` | 否 | 直接传 JSON body（覆盖其他参数） |

#### question update

与 `add` 相同的参数，只传需要修改的字段。`question-id` 从 `outline show` 获取。

#### question reorder

按期望顺序传入该板块内**所有**题目的 UUID。

### AI Usage Guidance

- **甄别题的 `+/-` 前缀是核心功能**。甄别选项必须在创建时通过 `--options "+通过,-拒绝"` 设置，不需要去网页操作
- **追问深度选择**：甄别题用 `none`，事实性问题用 `light`，深度探索用 `heavy`。详见 [follow-up.md](../rules/follow-up.md)
- **`--instructions` 用于引导 AI 主持人的追问方向**。不是给受访者看的，是给 AI 的指令。详见 [instructions.md](../rules/instructions.md)
- **选择题默认单选**，需要多选时加 `--multi-select`
- **题目设计必须遵循方法论**。详见 [question-design.md](../rules/question-design.md) 和 [screening.md](../rules/screening.md)
- **`question-id` 从 `outline show` 获取**，不要猜测或编造 UUID
- **`--payload` 是兜底方案**，只在常规参数无法满足需求时使用
- **修改已发布访谈的大纲后，必须重新发布**。完成修改后提醒用户执行 `interview publish <slug>`

---

## Common Errors

| 错误 | 原因 | 解决 |
|------|------|------|
| `Section not found` | section-id 不正确 | 用 `outline show <slug>` 查看正确的 ID |
| `Question not found` | question-id 不正确 | 用 `outline show <slug>` 查看正确的 ID |
| `options is required for multiple_choice` | 选择题没传 `--options` | 选择题必须提供选项 |
| `reorder` 缺少项目 | 没有传入所有 ID | reorder 必须包含所有 UUID |

## References

- [question-design.md](../rules/question-design.md) — 题型选择与写作规范
- [screening.md](../rules/screening.md) — 甄别题设计
- [follow-up.md](../rules/follow-up.md) — 追问深度策略
- [instructions.md](../rules/instructions.md) — 访谈指引（条件逻辑、追问引导）
