# 题目设计原则

## 题型能力矩阵

以前端当前题型契约为准。只有开放题支持追问和 `addInstructions`；所有结构题提交后直接进入下一题。

| 题型 | 用途 | 核心配置 | CLI 入口 |
|------|------|----------|----------|
| `open_ended` | 动机、过程、体验 | `followUp`；`timed` 时加 `timeBudget` | 常规参数 |
| `multiple_choice` | 单选、多选、甄别 | 稳定 ID 的 `options`、`multiSelect` | 常规参数；高级配置用 `--payload` |
| `scale` | 数值评分 | 完整 `scaleConfig` | 常规参数 |
| `submission` | 文字或文件证据 | 完整 `submissionConfig` | 常规参数 |
| `cascading` | 省市区、品牌车型等层级选择 | `cascadingConfig` | `--payload` |
| `matrix` | 多对象 × 同一组选项 | `matrixConfig` | `--payload` |
| `ranking` | 对选项排出完整顺序 | 稳定 ID 的 `options` | `--payload` |
| `proportion` | 分配预算、时间或权重 | 稳定 ID 的 `options`、`proportionConfig` | `--payload` |
| `statement` | 说明或过渡，不收集回答 | `itemType: statement` | 常规参数 |

结构化选项必须用稳定 ID 聚合，不能靠选项文本匹配。CLI 会为顶层 `options` 自动补 UUID；矩阵行列 ID 和级联节点 ID 必须在 payload 中提供。

## open_ended（开放题）— 首选题型

适合探索动机、体验、感受和决策过程。

- 问具体事件，不问泛泛模式
- 聚焦“为什么”和“怎么做”
- 每题不超过 2-3 句话
- 避免引导性措辞

```bash
mizzen-cli outline question add <slug> <section-id> \
  --text "你上次换手机是什么时候？是什么让你决定换的？" \
  --type open_ended \
  --follow-up heavy
```

## multiple_choice（选择题）

适合甄别、分类和量化统计。至少提供两个选项。

- 单选是默认；多选加 `--multi-select`
- 甄别选项用 `+` 标通过、`-` 标筛除
- “其他”或互斥选项等高级属性通过 `--payload` 的 `isOtherOption` / `isExclusive` 设置
- 有序区间、年龄段和 Likert 选项不要随机排序

```bash
mizzen-cli outline question add <slug> <section-id> \
  --text "你目前的工作状态？" \
  --type multiple_choice \
  --options "+全职,+兼职,-学生,-退休"
```

想了解选择原因时，后接一题开放题；不要给选择题设置追问。

## scale（量表题）

适合满意度、推荐意愿和强度评分。

- `scaleConfig` 必须同时包含 `minLabel`、`maxLabel`、`minValue`、`maxValue`
- 最小值和最大值必须是 -100 到 100 的整数
- 含首尾在内必须为 2–11 个刻度点，例如 1–5、0–10、-5–5

```bash
mizzen-cli outline question add <slug> <section-id> \
  --text "你向朋友推荐这款产品的可能性有多大？" \
  --type scale \
  --min-label "完全不可能" \
  --max-label "非常可能" \
  --min-value 0 \
  --max-value 10
```

评分依据需要单独后接开放题，不能让量表题本身追问。

## submission（上传题）

适合收集文字、照片、截图、视频或文档。常规参数会生成前端同形的完整 `submissionConfig`。

- `allowText` 与 `allowMedia` 至少一个为 true
- `requireText` 只能在 `allowText=true` 时开启
- `requireMedia` 只能在 `allowMedia=true` 时开启
- `acceptedTypes` 仅支持 `image`、`video`、`document`
- 默认：允许文字和媒体、文字必填、媒体非必填、最多 5 个文件、单文件 50 MB、题目本身非必填

```bash
mizzen-cli outline question add <slug> <section-id> \
  --text "请上传你上次遇到该问题时的截图" \
  --type submission \
  --no-allow-text \
  --accepted-types image \
  --max-files 3
```

需要修改 `requireText`、`requireMedia`、`maxFileSizeMb` 或 `required` 时，使用包含全部八个字段的 `submissionConfig` payload，不能只传局部对象。

## cascading（级联题）

适合必须沿一条路径逐级选择的层级数据。使用 `--payload` 传完整 `cascadingConfig`。

- `dataset_version` 从 1 开始
- `levels` 为 2–10 层，key 严格使用 `level_0`、`level_1`……
- `tree` 节点包含稳定 `id`、`label`、`level`；节点 ID 格式为 `n_` 加 6 位小写十六进制，可带 `_2` 等冲突后缀
- 非叶节点必须有 children，叶节点不能有 children
- 每次回答只选一条根到叶路径；不支持多选、追问或顶层 `options`

大型级联数据优先在前端上传 CSV/XLSX，由前端生成稳定节点 ID；CLI raw JSON 只适合已经拥有合法完整树的数据。

## matrix（矩阵题）

适合让多个对象使用同一组列选项作答。`matrixConfig` 必须包含：

- `selectionMode`: `single_per_row` 或 `multiple_per_row`
- `required`: 是否每行必答
- `randomizeRowOrder`: 是否随机行顺序
- 至少 2 行 `rows` 和 2 列 `columns`
- 每个行列对象都有非空且各自唯一的 `id` 和 `text`

矩阵的行列 ID 不会由 CLI 自动生成。

## ranking（排序题）

适合比较完整优先级。至少两个 `options`，受访者需要排出完整顺序。CLI 会为 payload 中缺少 ID 的顶层选项生成 UUID；编辑文案时保留原 ID。

不要用排序题表达权重差距；需要相对量级时用比重题。

## proportion（比重题）

适合预算、时间和权重分配。至少两个稳定 ID 选项。

- `step`: 1–50
- `totalValue`: 2–10000，且必须是 `step` 的整数倍
- `totalLabel`: 可选的总额标签
- `unitSuffix`: 默认 `%`
- `minOptionsWithValue`: 至少多少项必须大于 0，不能超过选项数
- `allowZero`: 是否允许某项为 0
- 选项数不能超过 `totalValue / step`

## statement（陈述 / 过渡语）

只展示内容，不收集回答。用于板块过渡或必要说明；不要放在甄别板块，也不要代替欢迎语和结束语。

```bash
mizzen-cli outline question add <slug> <section-id> \
  --text "接下来我们聊聊你的消费习惯。" \
  --type statement
```

## 题目写作规范

每道探索题都要有具体时间或事件锚点，让受访者回忆真实经历。

| 避免 | 改为 |
|------|------|
| 你怎么看社交媒体？ | 你昨天刷手机最长的一次是什么时候？当时在看什么？ |
| 你喜欢什么类型的内容？ | 你最近印象最深的一条内容是什么？为什么记住了？ |
| 你对推荐算法满意吗？ | 你最近一次觉得推荐完全不对是什么情况？ |
| 请详细描述各方面体验和建议 | 拆成围绕具体事件的多道单一问题 |
