# 访谈创建工作流

## 第一步：理解研究目标

向用户了解：
- 你想了解什么？（研究目标）
- 目标受访者是谁？
- 研究结果将用于什么？

从回答中提炼：
- **研究背景**（background）：为什么要做这个研究
- **研究目标**（studyGoal）：具体要挖掘什么洞察
- **目标人群**：访谈谁（决定是否需要甄别题）

## 第二步：设计大纲

按以下结构组织访谈：

```
[甄别] → [暖场] → [核心探索] → [收尾]
```

### 板块设计规则
- **甄别（screening，可选）**：仅在从样本库招募时使用。最多 5 道选择题，简洁明了。
- **暖场（flat）**：1-2 道简单开放题，建立信任。追问设为 light。
- **核心探索（flat）**：3-6 道深入研究主题的题目。以开放题为主（heavy 追问），穿插选择题和量表题。
- **收尾（flat）**：1-2 道收束性问题。追问设为 light。

### 约束
- 每个板块不超过 6 道题（除非逻辑分组确实需要更多）
- 总共 6-10 道题，目标时长约 20 分钟
- 先简单后复杂，循序渐进
- 相关话题放在同一板块

## 第三步：向用户展示大纲

用清晰的格式展示设计好的大纲：
```
S1 [screening] 甄别
  Q1 [multiple_choice] 你平时……的频率是？
S2 [flat] 核心探索
  Q2 [open_ended, heavy] 你最近一次……是什么体验？
  Q3 [multiple_choice] 以下哪些……你经常使用？
  Q4 [scale] 你对……的满意程度？
S3 [flat] 总结
  Q5 [open_ended, light] 如果推荐给朋友，你会推荐哪个？为什么？
```

**等待用户确认或修改后再继续。**

## 第四步：通过 CLI 创建访谈

```bash
# 创建访谈
mizzen interviews create \
  -t "访谈标题" \
  -d "访谈描述" \
  --background "研究背景" \
  --goal "研究目标" \
  --welcome "欢迎语" \
  --closing "结束语"

# 记下返回的 slug，后续命令需要用
```

### 欢迎语和结束语
- **欢迎语**：简短友好，说明访谈目的和预计时长。**绝不能泄露甄别标准。**
- **结束语**：感谢受访者。**不能再提新问题。**

## 第五步：添加板块和题目

```bash
# 按顺序添加板块
mizzen questions add-section <slug> -t "甄别" --type screening
mizzen questions add-section <slug> -t "核心探索" --type flat

# 添加甄别题（+approve / -reject，直接在 --options 中标记）
mizzen questions add <slug> <screening-section-id> \
  --text "你的年龄段是？" \
  --type multiple_choice \
  --options "+18-24,+25-30,+31-35,-36-45,-46以上" \
  --follow-up none

# 添加开放题
mizzen questions add <slug> <section-id> \
  --text "题目内容" \
  --type open_ended \
  --follow-up heavy \
  --instructions "AI 主持人的追问引导"
```

**重要：甄别题的 approve/reject 状态必须在创建时通过 `+/-` 前缀设置，不需要去网页操作。**

## 第六步：确认访谈模式

发布前必须向用户确认采访方式：

| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `audio` | 纯语音（默认） | 大多数访谈 |
| `video` | 开摄像头 | 需要观察表情反应 |
| `video_screen` | 视频 + 屏幕共享 | 可用性测试、产品演示 |
| `text` | 纯文字 | 敏感话题、用户不方便语音 |

同时确认对话模式：
- `manual`（默认）：受访者按键说话
- `auto`：自动语音检测

```bash
# 设置访谈模式（如果不是默认的 audio + manual）
mizzen interviews update <slug> --mode video --talk-mode auto
```

## 第七步：验证并发布

```bash
# 检查最终大纲
mizzen interviews outline <slug>

# 发布
mizzen interviews publish <slug>
```

## 第八步：生成分享链接

发布后必须立即执行 `share` 生成受访者参与链接：

```bash
mizzen interviews share <slug>
```

将返回的**分享链接**展示给用户，用户把链接发给受访者即可开始访谈。

## 修改工作流

```bash
# 获取当前状态
mizzen interviews outline <slug>

# 修改题目
mizzen questions update <slug> <question-id> --text "新文本"

# 增删题目
mizzen questions add <slug> <section-id> --text "..." --after <uuid>
mizzen questions delete <slug> <question-id>

# 排序
mizzen questions reorder-sections <slug> <uuid1> <uuid2> <uuid3>
mizzen questions reorder <slug> <section-id> <uuid1> <uuid2>
```
