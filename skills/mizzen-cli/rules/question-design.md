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
mizzen questions add <slug> <section-id> \
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
mizzen questions add <slug> <section-id> \
  --text "你每天大概花多少时间在手机上？" \
  --type multiple_choice \
  --options "不到1小时,1-3小时,3-5小时,5小时以上"

# 甄别题（+approve / -reject）
mizzen questions add <slug> <section-id> \
  --text "你目前的工作状态？" \
  --type multiple_choice \
  --options "+全职上班,+兼职,-学生,-退休,-待业" \
  --follow-up none
```

### scale（量表题）

**适用场景**：测量态度、满意度、偏好程度

**示例**：
```bash
mizzen questions add <slug> <section-id> \
  --text "你对目前使用的产品满意吗？" \
  --type scale \
  --min-label "非常不满意" \
  --max-label "非常满意"
```

### submission（上传题）

**适用场景**：需要受访者提交文件（照片、截图、文档等）或文字证据

**配置**：
- 默认同时允许文字输入和媒体上传
- `--no-allow-text` 禁用文字输入（只能上传文件）
- `--no-allow-media` 禁用文件上传（只能输入文字）

**示例**：
```bash
# 只上传图片
mizzen questions add <slug> <section-id> \
  --text "请上传你工位的照片" \
  --type submission \
  --no-allow-text \
  --follow-up none

# 文字 + 文件都允许
mizzen questions add <slug> <section-id> \
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
mizzen questions add <slug> <section-id> \
  --text "接下来我们聊聊你的消费习惯。" \
  --type statement
```

## 题目写作规范

### ✅ 好的题目
- "你上次出去吃饭是什么时候？当时是怎么选餐厅的？"（具体、开放）
- "以下哪些社交平台你每周至少用一次？"（明确、可量化）
- "你对这款产品的易用性打几分？"（量表，清晰维度）

### ❌ 避免的写法
- "你觉得XX好不好？"（引导性，且是 yes/no 问题）
- "你是否认为……？"（封闭式问题）
- "请详细描述你对XX产品各方面功能的使用体验和改进建议"（太长，一次问太多）
- 连续两道问类似内容的题（重复）

## 不支持的题型

以下需要拆分为多道独立题目：
- 矩阵题（每行拆成一道独立的选择题或量表题）
- 排序题（改为"你最喜欢哪个？为什么？"的开放题）
