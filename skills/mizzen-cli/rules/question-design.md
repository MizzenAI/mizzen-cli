# 题目设计原则

## 题型选择指南

### open_ended（开放题）— 首选题型

**适用场景**：探索动机、体验、感受、决策过程

**写作原则**：
- 问具体事件，不问泛泛的模式。✅ "你上次买饮料是什么时候？当时怎么选的？" ❌ "你一般怎么选饮料？"
- 聚焦"为什么"和"怎么做"，而非"是什么"和"什么时候"
- 每题不超过 2-3 句话
- 避免引导性措辞

**示例**：
```bash
mizzen outline question add <slug> <section-id> \
  --text "你上次换手机是什么时候？是什么让你决定换的？" \
  --type open_ended \
  --follow-up heavy
```

### multiple_choice（选择题）

**仅在以下场景使用**：
- 甄别筛选受访者
- 选项确实穷举的分类问题
- 需要量化统计的问题

**配置规范**：
- 默认开启选项随机排序（系统自动处理）
- 加入兜底选项（"其他"/"以上都不是"）置底
- Likert 量表、时间范围、年龄段等有序选项不要随机排序

**不要用选择题替代开放题**。如果想知道"为什么"，用开放题加 heavy 追问。

**示例**：
```bash
# 普通单选
mizzen outline question add <slug> <section-id> \
  --text "你每天大概花多少时间在手机上？" \
  --type multiple_choice \
  --options "不到1小时,1-3小时,3-5小时,5小时以上"

# 甄别题（+approve / -reject）
mizzen outline question add <slug> <section-id> \
  --text "你目前的工作状态？" \
  --type multiple_choice \
  --options "+全职上班,+兼职,-学生,-退休,-待业" \
  --follow-up none
```

### scale（量表题）

**适用场景**：测量态度、满意度、偏好程度

**示例**：
```bash
mizzen outline question add <slug> <section-id> \
  --text "你对目前使用的产品满意吗？" \
  --type scale \
  --min-label "非常不满意" \
  --max-label "非常满意"
```

### submission（上传题）

**适用场景**：需要受访者提交文件（照片、截图、文档等）或文字证据

**配置**：
- `--allow-text` / `--no-allow-text` — 是否允许文字输入（默认允许）
- `--allow-media` / `--no-allow-media` — 是否允许文件上传（默认允许）
- `--max-files <n>` — 最大上传文件数（默认 5）
- `--accepted-types <types>` — 接受的文件类型，逗号分隔：`image,video,document`（默认全部）

**示例**：
```bash
# 只上传图片（禁用文字，只接受图片）
mizzen outline question add <slug> <section-id> \
  --text "请上传你工位的照片" \
  --type submission \
  --no-allow-text \
  --accepted-types image \
  --max-files 3 \
  --follow-up none

# 文字 + 文件都允许（默认配置）
mizzen outline question add <slug> <section-id> \
  --text "请分享你最近一次不满意的购物体验（可附截图）" \
  --type submission \
  --follow-up light
```

### statement（陈述 / 过渡语）

**适用场景**：板块之间的过渡衔接，给受访者一个心理准备

**注意**：
- 放在独立的 flat 板块中，或作为新板块的开头
- 不要放在 screening 板块中（会对每个概念重复）
- 不要放在访谈开头或结尾（用 welcome/closing message）

**示例**：
```bash
mizzen outline question add <slug> <section-id> \
  --text "接下来我们聊聊你的消费习惯。" \
  --type statement
```

## 题目写作规范

### 核心原则：问具体事件，不问泛泛感受

每道题必须有**场景锚点**（具体时间、具体事件），让受访者回忆真实经历而不是编造概括。

### ✅ 好的题目（具体事件驱动）
- "你昨天一天里都在什么时候打开了社交媒体？当时分别是什么触发你去刷的？"
- "你上次出去吃饭是什么时候？当时是怎么选餐厅的？"
- "你有没有过本来只想刷几分钟、结果停不下来的经历？那次是什么内容把你粘住了？"
- "你有没有觉得平台推的东西完全不对的时候？那次是什么情况？"

### ❌ 避免的写法（泛泛而谈）
- "你平时怎么使用社交媒体？"（太泛，没有场景锚点）
- "你觉得XX好不好？"（引导性，且是 yes/no 问题）
- "你对社交媒体有什么看法？"（抽象概括，得不到真实故事）
- "你是否认为……？"（封闭式问题）
- "请详细描述你对XX产品各方面功能的使用体验和改进建议"（太长，一次问太多）
- 连续两道问类似内容的题（重复）

### 改写示例
| ❌ 泛泛 | ✅ 具体 |
|---------|---------|
| 你怎么看社交媒体？ | 你昨天刷手机最长的一次是什么时候？在看什么？ |
| 你喜欢什么类型的内容？ | 你最近看到的印象最深的一条内容是什么？为什么记住了？ |
| 你对推荐算法满意吗？ | 你有没有觉得平台"太懂你了"或者"推的完全不对"的时候？ |
| 社交媒体对你有影响吗？ | 你有没有刷完之后心情反而变差的经历？那次发生了什么？ |

## 不支持的题型

以下需要拆分为多道独立题目：
- 矩阵题（每行拆成一道独立的选择题或量表题）
- 排序题（改为"你最喜欢哪个？为什么？"的开放题）
