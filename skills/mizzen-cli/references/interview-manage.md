# interview 管理命令

访谈的查看、修改、删除、发布、分享、统计。

## Recommended Commands

```bash
# 列出所有访谈
mizzen interview list

# 按状态筛选
mizzen interview list --status draft
mizzen interview list --status active

# 搜索访谈
mizzen interview list --search "饮料"

# 查看访谈详情（含管理链接和分享链接）
mizzen interview get <slug>

# 修改访谈
mizzen interview update <slug> -t "新标题"
mizzen interview update <slug> --mode video --talk-mode auto --tts
mizzen interview update <slug> --external-title "新的对外标题"

# 删除访谈
mizzen interview delete <slug>

# 发布（draft → active）
mizzen interview publish <slug>

# 创建分享链接（自动发布，返回受访者参与链接）
mizzen interview share <slug>

# 查看统计数据
mizzen interview stats <slug>
```

## Parameters

### interview list

| 参数 | 说明 |
|------|------|
| `--status <status>` | 按状态筛选：`draft` / `active` |
| `--search <keyword>` | 按标题搜索 |

### interview update

与 `create` 相同的参数（`-t`、`--external-title`、`--background`、`--goal`、`--welcome`、`--closing`、`--mode`、`--talk-mode`、`--tts`），只传需要修改的字段。

## Workflow

### 发布并分享

1. 确认大纲无误：`mizzen outline show <slug>`
2. 发布：`mizzen interview publish <slug>`
3. 生成分享链接：`mizzen interview share <slug>`
4. 将分享链接展示给用户

### 修改访谈

1. 查看当前状态：`mizzen interview get <slug>`
2. 执行修改：`mizzen interview update <slug> --field "新值"`
3. 确认修改结果：`mizzen interview get <slug>`

## AI Usage Guidance

- **发布前必须问用户确认**，不要自动发布
- **`share` 会自动发布**。如果访谈是 draft 状态，`share` 会先发布再生成链接
- **`get` 返回管理链接和分享链接**。用户问"访谈链接"时用 `get` 查看
- **`stats` 查看访谈统计**。用户问"有多少人参与了"时用 `stats`
- **删除操作不可恢复**，必须向用户确认

## Common Errors

| 错误 | 原因 | 解决 |
|------|------|------|
| `Interview not found` | slug 不正确 | 用 `interview list` 查找正确的 slug |
| `Interview is already active` | 重复发布 | 已发布的访谈无需再次发布 |
