# outline section 板块管理

添加、修改、删除、重排板块。

## Recommended Commands

```bash
# 添加普通板块
mizzen outline section add <slug> -t "核心探索" --type flat

# 添加甄别板块
mizzen outline section add <slug> -t "基本信息" --type screening

# 添加概念测试板块
mizzen outline section add <slug> -t "概念测试" --type concept

# 修改板块标题
mizzen outline section update <slug> <section-id> -t "新标题"

# 删除板块（连同所有题目）
mizzen outline section delete <slug> <section-id>

# 重新排序板块（按期望顺序传入所有板块 ID）
mizzen outline section reorder <slug> <uuid1> <uuid2> <uuid3>
```

## Parameters

### section add

| 参数 | 必填 | 说明 |
|------|------|------|
| `-t, --title <text>` | 是 | 板块标题 |
| `--type <type>` | 否 | 板块类型：`flat`（普通，默认）/ `screening`（甄别）/ `concept`（概念测试） |

### section update

| 参数 | 说明 |
|------|------|
| `-t, --title <text>` | 新标题 |

### section reorder

按期望顺序传入**所有**板块的 UUID。

## Workflow

1. 按大纲设计顺序添加板块：甄别（如需要）→ 暖场 → 核心探索（可拆多个）→ 收尾
2. 每次添加后记下返回的 `section_id`，后续添加题目需要
3. 添加完所有板块后，开始逐板块添加题目（见 [outline-question.md](outline-question.md)）

## AI Usage Guidance

- **按方法论顺序添加板块**，不要乱序
- **甄别板块只能有一个**，且必须放在最前面
- **每个板块 3-5 道题**，核心探索可拆成多个板块
- **删除板块会连同删除所有题目**，操作前确认
- **`section_id` 从 `outline show` 或 `section add` 返回值获取**，不要猜测

## Common Errors

| 错误 | 原因 | 解决 |
|------|------|------|
| `Section not found` | section-id 不正确 | 用 `outline show <slug>` 查看正确的 ID |
| `reorder` 缺少板块 | 没有传入所有板块 ID | reorder 必须包含所有板块的 UUID |
