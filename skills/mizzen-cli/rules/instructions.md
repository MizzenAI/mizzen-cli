# addInstructions 编写指南

`addInstructions` 是开放题的主持人追问指引，通过 `--instructions` 设置。它只控制当前开放题追问什么，不是题目正文，也不是结构题回答后的自动追问。

## 什么时候用

- 研究目标要求追到某个具体方向
- 回答出现特定内容时，需要进一步澄清
- 需要提醒主持人索取例子、过程、动机或对比

大多数开放题不需要该字段。选择题、量表题、上传题、级联题、矩阵题、排序题、比重题和陈述均省略 `--instructions`。

## 编写规范

- 写清触发条件和追问方向，不替主持人预写整段台词
- 一次只追一个方向，避免复合问题
- 不要求超过 `followUp` 档位允许的追问次数
- 不用它模拟结构题的追问，也不要把条件跳转写进新访谈的 `addInstructions`

## 示例

```bash
mizzen-cli outline question add <slug> <section-id> \
  --text "你上次放弃购买这类产品是什么情况？" \
  --type open_ended \
  --follow-up heavy \
  --instructions "如果提到价格，追问当时比较了哪些方案和最终放弃的临界点；如果提到功能，追问缺失功能影响了哪个具体任务。"
```

条件展示和跳转属于独立的结构化条件逻辑，不等同于 `addInstructions`。当前 CLI 没有专用条件逻辑命令；不要声称已通过 `--instructions` 配好可执行路由。
