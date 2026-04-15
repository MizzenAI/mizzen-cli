# conversation 对话数据

查看访谈的对话列表、对话详情、逐字稿和结构化回答。

## Recommended Commands

```bash
# 列出访谈的所有对话
mizzen conversation list <slug>

# 按状态筛选（completed / in_progress / screened_out / failed）
mizzen conversation list <slug> --status completed

# 查看对话详情（含消息列表）
mizzen conversation get <slug> <id>

# 获取逐字稿（纯文本格式）
mizzen conversation transcript <slug> <id>

# 获取结构化回答（清洗后数据）
mizzen conversation answers <slug> <id>
```

## Parameters

### conversation list

| 参数 | 说明 |
|------|------|
| `<slug>` | 访谈的 slug |
| `-s, --status <status>` | 按状态筛选：`completed` / `in_progress` / `screened_out` / `failed` |
| `-p, --page <n>` | 页码（默认 1） |
| `--size <n>` | 每页数量（默认 20） |

### conversation get / transcript / answers

| 参数 | 说明 |
|------|------|
| `<slug>` | 访谈的 slug |
| `<id>` | 对话的 readable_id（数字编号，从 `list` 获取） |

## Workflow

### 查看访谈数据

1. 先列出对话：`mizzen conversation list <slug>`
2. 找到目标对话的 `readable_id`（#列的数字）
3. 根据需要选择查看方式：
   - 查看详情和消息：`mizzen conversation get <slug> <id>`
   - 获取纯文本逐字稿：`mizzen conversation transcript <slug> <id>`
   - 获取结构化数据：`mizzen conversation answers <slug> <id>`

### 批量分析

1. 列出已完成对话：`mizzen conversation list <slug> --status completed`
2. 逐个获取结构化回答：`mizzen conversation answers <slug> <id>`
3. 汇总分析

## AI Usage Guidance

- **先 `list` 再 `get`**。必须先用 `list` 获取对话的 `readable_id`，再用 `get`/`transcript`/`answers` 查看详情。不要猜测 ID
- **`transcript` vs `answers`**：`transcript` 返回原始对话逐字稿（纯文本），`answers` 返回经过 AI 清洗的结构化回答数据（按题目组织）
- **`get` 返回消息列表**，包含每条消息的 role、content、timestamp
- **对话状态含义**：
  - `completed`：正常完成的对话
  - `in_progress`：进行中的对话
  - `screened_out`：被甄别筛除的对话
  - `failed`：异常中断的对话
- **用户问"有多少人参与了"时**，用 `interview stats <slug>` 而不是 `conversation list`
- **用户问"访谈效果怎么样"时**，用 `insight get <slug>` 获取洞察报告

## Common Errors

| 错误 | 原因 | 解决 |
|------|------|------|
| `Interview not found` | slug 不正确 | 用 `interview list` 查找正确的 slug |
| `Conversation not found` | id 不正确 | 用 `conversation list <slug>` 查找正确的 readable_id |
| 返回空列表 | 该访谈还没有对话 | 确认访谈已发布且有受访者参与 |
