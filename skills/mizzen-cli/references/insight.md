# insight 洞察报告

获取和生成访谈的洞察分析报告。

## Recommended Commands

```bash
# 获取最新报告
mizzen-cli insight get <slug>

# 触发生成新报告
mizzen-cli insight generate <slug>

# 包含未完成对话的报告
mizzen-cli insight generate <slug> --include-incomplete
```

## Parameters

### insight get

| 参数 | 说明 |
|------|------|
| `<slug>` | 访谈的 slug |

### insight generate

| 参数 | 说明 |
|------|------|
| `<slug>` | 访谈的 slug |
| `--include-incomplete` | 包含未完成的对话（默认只分析已完成对话） |

## Workflow

1. 先检查是否已有报告：`mizzen-cli insight get <slug>`
2. 如果没有报告或需要更新：`mizzen-cli insight generate <slug>`
3. 生成是异步的，可能需要等待几分钟
4. 生成完成后用 `insight get <slug>` 查看结果

## AI Usage Guidance

- **报告生成是异步的**。`generate` 触发生成任务，不会立即返回报告内容。需要等待后再用 `get` 查看
- **需要足够的对话数据**才能生成有意义的报告（默认最少 3 个已完成对话）
- **`--include-incomplete` 会降低报告质量**，因为未完成对话的数据不完整。仅在对话量不足时使用
- **用户问"分析结果"或"报告"时**，先尝试 `get` 查看是否已有报告，没有再 `generate`

## Common Errors

| 错误 | 原因 | 解决 |
|------|------|------|
| `No insight report found` | 尚未生成过报告 | 运行 `insight generate <slug>` |
| `Not enough conversations` | 已完成对话数不足 | 等待更多对话完成，或使用 `--include-incomplete` |
| `Report is still generating` | 报告正在生成中 | 等待几分钟后重试 `insight get` |
