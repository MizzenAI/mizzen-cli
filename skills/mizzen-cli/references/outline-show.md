# outline show

查看访谈的完整大纲（板块和题目结构）。

## Recommended Commands

```bash
# 查看大纲
mizzen outline show <slug>
```

## Workflow

1. 执行 `mizzen outline show <slug>`
2. 检查返回的板块和题目结构是否符合设计

## AI Usage Guidance

- **创建完题目后必须用这个命令验证**。这是工作流第七步
- **修改前先用这个命令了解当前状态**。不要凭记忆操作，先看当前大纲
- 返回的数据包含每个 section 的 `id` 和每个 question 的 `id`，后续修改/删除需要用这些 ID
- 返回的选择题选项会显示 approve/reject 状态（`+` / `-` 标记）
