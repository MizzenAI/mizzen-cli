# Mizzen CLI 命令参考

**注意：命令组都是复数形式** — `interviews`（不是 interview）、`conversations`（不是 conversation）、`insights`（不是 insight）。

## 认证

```bash
mizzen auth set-key <api-key>   # 保存 API Key
mizzen auth status              # 查看认证状态
mizzen auth clear               # 清除 API Key
```

也可通过环境变量：`export MIZZEN_API_KEY=mk_xxx`

## 访谈管理

```bash
# 列表
mizzen interviews list                          # 所有访谈
mizzen interviews list --status draft           # 按状态筛选
mizzen interviews list --search "关键词"         # 按标题搜索

# 详情
mizzen interviews get <slug>

# 创建
mizzen interviews create \
  -t "内部标题（研究者管理用）" \
  --external-title "对外标题（受访者看到的，不传则等于 -t）" \
  --background "研究背景" \
  --goal "研究目标" \
  --welcome "欢迎语" \
  --closing "结束语" \
  --language zh-CN \
  --mode audio \
  --talk-mode manual

# 访谈模式（--mode）：
#   audio        — 纯语音（默认，受访者用麦克风）
#   video        — 视频（开摄像头）
#   video_screen — 视频+屏幕共享
#   text         — 纯文字聊天
#
# 对话模式（--talk-mode）：
#   manual — 手动按键说话（默认）
#   auto   — 自动语音检测
#
# AI 语音播报：加 --tts 启用

# 修改
mizzen interviews update <slug> -t "新标题" --goal "新目标"
mizzen interviews update <slug> --mode video --talk-mode auto --tts
mizzen interviews update <slug> --external-title "新的对外标题"

# 删除
mizzen interviews delete <slug>

# 发布（draft → active）
mizzen interviews publish <slug>

# 创建分享链接（自动发布，返回受访者参与链接）
mizzen interviews share <slug>

# 获取详情（包含管理链接和分享链接）
mizzen interviews get <slug>

# 统计
mizzen interviews stats <slug>

# 查看大纲
mizzen outline show <slug>
```

## 板块管理

```bash
# 添加板块
mizzen outline add-section <slug> -t "板块标题" --type flat
mizzen outline add-section <slug> -t "甄别" --type screening

# 板块类型：flat（普通）、screening（甄别）、concept（概念测试）

# 修改板块
mizzen outline update-section <slug> <section-id> -t "新标题"

# 删除板块（连同所有题目）
mizzen outline delete-section <slug> <section-id>

# 重新排序板块
mizzen outline reorder-sections <slug> <uuid1> <uuid2> <uuid3>
```

## 题目管理

```bash
# 添加开放题
mizzen outline add <slug> <section-id> \
  --text "题目内容" \
  --type open_ended \
  --follow-up heavy \
  --instructions "追问引导"

# 添加选择题
mizzen outline add <slug> <section-id> \
  --text "题目内容" \
  --type multiple_choice \
  --options "选项1,选项2,选项3,选项4" \
  --follow-up none

# 添加甄别选择题（+approve / -reject / 无前缀neutral）
mizzen outline add <slug> <section-id> \
  --text "你目前的工作状态是？" \
  --type multiple_choice \
  --options "+全职上班,+兼职,-学生,-退休,-待业" \
  --follow-up none

# 添加多选题（默认单选，加 --multi-select 变多选）
mizzen outline add <slug> <section-id> \
  --text "你喜欢的品类？（可多选）" \
  --type multiple_choice \
  --options "选项1,选项2,选项3" \
  --multi-select

# 添加量表题
mizzen outline add <slug> <section-id> \
  --text "题目内容" \
  --type scale \
  --min-label "非常不满意" \
  --max-label "非常满意"

# 添加上传题（受访者提交文件/图片）
mizzen outline add <slug> <section-id> \
  --text "请上传你工位的照片" \
  --type submission \
  --no-allow-text \
  --accepted-types image \
  --max-files 3 \
  --follow-up none

# 添加陈述/过渡语
mizzen outline add <slug> <section-id> \
  --text "接下来我们聊聊另一个话题。" \
  --type statement

# 插入到特定位置（在某题之后）
mizzen outline add <slug> <section-id> --text "..." --after <question-uuid>

# 修改题目
mizzen outline update <slug> <question-id> --text "新文本" --follow-up light

# 修改选项的甄别状态
mizzen outline update <slug> <question-id> --options "+通过选项,-拒绝选项,中性选项"

# 直接传 JSON body（复杂场景）
mizzen outline add <slug> <section-id> --payload '{"text":"...","questionType":"multiple_choice","options":[{"text":"选项","status":"approve"}]}'
mizzen outline update <slug> <question-id> --payload '{"options":[{"text":"选项","status":"reject"}]}'

# 删除题目
mizzen outline delete <slug> <question-id>

# 重新排序题目
mizzen outline reorder <slug> <section-id> <uuid1> <uuid2> <uuid3>
```

## 对话数据

```bash
# 列出访谈的所有对话
mizzen conversations list <slug>
mizzen conversations list <slug> --status completed

# 查看对话详情（含消息）
mizzen conversations get <slug> <id>

# 获取逐字稿（纯文本）
mizzen conversations transcript <slug> <id>

# 获取结构化回答（清洗后数据）
mizzen conversations answers <slug> <id>
```

## 洞察报告

```bash
# 获取最新报告
mizzen insights get <slug>

# 触发生成新报告
mizzen insights generate <slug>
mizzen insights generate <slug> --include-incomplete
```

## 配置

```bash
mizzen config show                              # 查看配置
mizzen config set api.base_url https://...      # 修改 API 地址
mizzen config set api.site_url https://...      # 修改前端站点地址（影响分享链接）
mizzen config set api.timeout 60                # 修改超时时间（秒）
mizzen config set output.format json            # 默认输出格式（table/json/csv）
mizzen config set output.color false            # 禁用颜色输出
mizzen config reset                             # 重置为默认
```

## 输出格式

所有命令支持全局格式切换：

```bash
mizzen --json interviews list     # JSON 输出（适合程序处理）
mizzen --csv interviews list      # CSV 输出（适合导出）
mizzen interviews list            # 表格输出（默认，人类可读）
```
