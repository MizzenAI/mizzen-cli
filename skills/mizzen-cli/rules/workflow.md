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
- **核心探索（flat，可拆为多个板块）**：6-10 道深入研究主题的题目。以开放题为主（heavy 追问），穿插选择题和量表题。按维度拆分成 2-3 个板块，每个板块 3-5 道题。
- **收尾（flat）**：1-2 道收束性问题。追问设为 light。

### 约束
- 每个板块 3-5 道题，核心探索可拆成多个板块
- 总共 10-15 道题，目标时长约 20-30 分钟
- 先简单后复杂，循序渐进
- 相关话题放在同一板块

## 第三步：向用户展示大纲

用清晰的中文格式展示设计好的大纲。**展示给用户时必须用中文术语**：

| 英文术语 | 用户看到的中文 |
|----------|---------------|
| screening | 甄别 |
| flat | 普通 |
| concept | 概念测试 |
| open_ended | 开放题 |
| multiple_choice | 选择题 |
| scale | 量表题 |
| submission | 上传题 |
| statement | 陈述/过渡语 |
| none | 不追问 |
| light | 轻度追问 |
| heavy | 深度追问 |

展示格式示例：
```
S1 [甄别]
  Q1 [选择题, 不追问] 你平时……的频率是？

S2 [普通] 核心探索
  Q2 [开放题, 深度追问] 你最近一次……是什么体验？
  Q3 [选择题, 多选] 以下哪些……你经常使用？
  Q4 [量表题] 你对……的满意程度？（1=非常不满意，5=非常满意）

S3 [普通] 总结
  Q5 [开放题, 轻度追问] 如果推荐给朋友，你会推荐哪个？为什么？
```

**等待用户确认大纲后再继续。**

## 第四步：确认访谈配置

大纲确认后，向用户展示完整的访谈配置清单，**必须逐项确认**：

```
┌────────────────────────────────────────────┐
│ 访谈配置确认                                │
├──────────┬─────────────────────────────────┤
│ 内部标题 │ 竞品用户流失分析                  │
│ 对外标题 │ 产品使用体验调研                  │
│ 研究背景 │ ……                               │
│ 研究目标 │ ……                               │
│ 欢迎语   │ ……                               │
│ 结束语   │ ……                               │
│ 访谈模式 │ 语音（audio）                     │
│ 对话模式 │ 手动按键（manual）                │
│ AI 语音  │ 关闭                              │
│ 语言     │ 中文（zh-CN）                     │
│ 题目数   │ 12 题（含 2 甄别 + 10 正式题）    │
└──────────┴─────────────────────────────────┘
```

访谈模式选项：
| 模式 | 说明 | 适用场景 |
|------|------|----------|
| `audio` | 纯语音（默认） | 大多数访谈 |
| `video` | 开摄像头 | 需要观察表情反应 |
| `video_screen` | 视频 + 屏幕共享 | 可用性测试、产品演示 |
| `text` | 纯文字 | 敏感话题、用户不方便语音 |

对话模式：`manual`（按键说话，默认） / `auto`（自动语音检测）

**等待用户逐项确认或修改后再继续创建。**

## 第五步：通过 CLI 创建访谈

```bash
# 创建访谈
mizzen-cli interview create \
  -t "内部标题" \
  --external-title "对外标题" \
  --background "研究背景" \
  --goal "研究目标" \
  --welcome "欢迎语" \
  --closing "结束语" \
  --mode audio \
  --talk-mode manual

# 记下返回的 slug，后续命令需要用
```

### 标题
- **标题（-t）**：研究者内部管理用的名称，受访者看不到。例如"竞品用户流失原因挖掘"。
- **对外标题（--external-title）**：受访者在参与页面看到的标题。应避免暴露研究意图。例如"产品使用体验调研"。不传则默认等于标题。

### 欢迎语和结束语
- **欢迎语**：简短友好，说明访谈目的和预计时长。**绝不能泄露甄别标准。**
- **结束语**：感谢受访者。**不能再提新问题。**

## 第六步：添加板块和题目

```bash
# 按顺序添加板块
mizzen-cli outline section add <slug> -t "甄别" --type screening
mizzen-cli outline section add <slug> -t "核心探索" --type flat

# 添加甄别题（+approve / -reject，直接在 --options 中标记）
mizzen-cli outline question add <slug> <screening-section-id> \
  --text "你的年龄段是？" \
  --type multiple_choice \
  --options "+18-24,+25-30,+31-35,-36-45,-46以上" \
  --follow-up none

# 添加开放题
mizzen-cli outline question add <slug> <section-id> \
  --text "题目内容" \
  --type open_ended \
  --follow-up heavy \
  --instructions "AI 主持人的追问引导"
```

**重要：甄别题的 approve/reject 状态必须在创建时通过 `+/-` 前缀设置，不需要去网页操作。**

## 第七步：验证大纲

```bash
# 检查最终大纲
mizzen-cli outline show <slug>
```

---

**⚠️ 第八步到第十一步必须严格按顺序执行，不可跳步、不可合并：**

**check → test → publish → share**

1. 先 `check`，有问题先修
2. 再让用户 `test`，确认体验没问题
3. 用户确认后才 `publish`（禁止自作主张发布）
4. 发布成功后才 `share` 生成分享链接（draft 状态不能 share）

---

## 第八步：质量检查（检查 → 修复 → 再检查循环）

```bash
mizzen-cli interview check <slug>
```

检查完成后，**必须向用户完整展示所有 issue**（error、warning、recommendation），不要省略或折叠。

**处理流程：**
1. **有 error**：必须修复。向用户说明问题并建议修改方案，修改后重新运行 `check`
2. **有 warning / recommendation**：向用户展示并建议修改，由用户决定是否修复。如果用户选择修改，修改后重新运行 `check`
3. **全部处理完或用户确认跳过**：进入第九步

这是一个循环：check → 展示问题 → 建议修改 → 用户确认修改 → 执行修改 → 再次 check → 直到用户满意。

## 第九步：测试访谈

质量检查通过后，强烈建议用户先去页面测试访谈效果。展示测试链接：

```
{site_url}/interview/{slug}/create/edit#questions
```

对用户说："建议先点击上方链接，在页面上预览并测试访谈流程。确认没问题后告诉我，我来发布。如果不需要测试，也可以直接告诉我发布。"

**如果用户明确表示不需要测试（如"直接发布"、"跳过测试"），可以直接进入第十步。否则应等待用户测试确认后再继续。**

## 第十步：发布

```bash
# publish 内部会再次运行 check，有 error 会拒绝
mizzen-cli interview publish <slug>
```

## 第十一步：生成分享链接

发布后必须立即执行 `share` 生成受访者参与链接：

```bash
mizzen-cli interview share <slug>
```

将返回的**分享链接**展示给用户，用户把链接发给受访者即可开始访谈。

## 修改工作流

```bash
# 获取当前状态
mizzen-cli outline show <slug>

# 修改题目
mizzen-cli outline question update <slug> <question-id> --text "新文本"

# 增删题目
mizzen-cli outline question add <slug> <section-id> --text "..." --after <uuid>
mizzen-cli outline question delete <slug> <question-id>

# 排序
mizzen-cli outline section reorder <slug> <uuid1> <uuid2> <uuid3>
mizzen-cli outline question reorder <slug> <section-id> <uuid1> <uuid2>
```

## 决策指引：什么时候问用户，什么时候自己决定

| 环节 | 自己决定 | 问用户 |
|------|----------|--------|
| 大纲结构（几个板块、每板块几题） | ✅ 按方法论设计 | 展示后等确认 |
| 题目文本 | ✅ 按方法论撰写 | 展示后等确认 |
| 追问级别 | ✅ 按题型自动选 | 不需要问 |
| 访谈模式（audio/video/text） | ❌ | ✅ 必须问 |
| 对外标题 | ✅ 可以建议 | 展示后等确认 |
| 欢迎语/结束语 | ✅ 按方法论撰写 | 展示后等确认 |
| 甄别题选项的 approve/reject | ✅ 按目标人群判断 | 不需要问 |
| 发布 | ❌ | ✅ 必须问 |

## 完整示例：从零创建一个产品体验访谈

以下是一个完整的端到端流程，展示 agent 应该怎么执行：

```bash
# 第一步：创建访谈
mizzen-cli interview create \
  -t "竞品用户流失分析" \
  --external-title "产品使用体验调研" \
  --background "近3个月用户流失率上升15%，需要了解原因" \
  --goal "挖掘用户放弃使用产品的核心原因和决策过程" \
  --welcome "你好！感谢参与本次调研。我们想了解你使用产品的真实体验，大概需要15分钟。" \
  --closing "感谢你的分享！你的反馈对我们非常有价值。" \
  --mode audio
# → 返回 slug: abc123

# 第二步：添加甄别板块
mizzen-cli outline section add abc123 -t "基本信息" --type screening
# → 返回 section_id: s1-uuid

# 添加甄别题
mizzen-cli outline question add abc123 s1-uuid \
  --text "你使用过以下哪款产品？" \
  --type multiple_choice \
  --options "+我们的产品,-竞品A,-竞品B,-都没用过" \
  --follow-up none

# 第三步：添加暖场板块
mizzen-cli outline section add abc123 -t "使用背景" --type flat
# → 返回 section_id: s2-uuid

mizzen-cli outline question add abc123 s2-uuid \
  --text "你最早是怎么知道这款产品的？大概用了多久？" \
  --type open_ended \
  --follow-up light

# 第四步：添加核心探索板块
mizzen-cli outline section add abc123 -t "使用体验" --type flat
# → 返回 section_id: s3-uuid

mizzen-cli outline question add abc123 s3-uuid \
  --text "你上次使用这款产品是什么时候？当时在做什么？" \
  --type open_ended \
  --follow-up heavy

mizzen-cli outline question add abc123 s3-uuid \
  --text "有没有哪个功能或体验让你觉得不满意？能具体说说吗？" \
  --type open_ended \
  --follow-up heavy

mizzen-cli outline question add abc123 s3-uuid \
  --text "你对产品整体的满意程度？" \
  --type scale \
  --min-label "非常不满意" \
  --max-label "非常满意"

# 第五步：添加收尾板块
mizzen-cli outline section add abc123 -t "总结" --type flat
# → 返回 section_id: s4-uuid

mizzen-cli outline question add abc123 s4-uuid \
  --text "如果能改变这款产品的一个地方，你最希望改什么？" \
  --type open_ended \
  --follow-up light

# 第六步：确认大纲
mizzen-cli outline show abc123

# 第七步：质量检查
mizzen-cli interview check abc123

# 第八步：建议用户测试（展示测试链接）

# 第九步：发布
mizzen-cli interview publish abc123

# 第十步：生成分享链接
mizzen-cli interview share abc123
# → 返回分享链接给用户
```
