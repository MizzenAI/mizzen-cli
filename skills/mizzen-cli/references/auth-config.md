# auth & config 认证与配置

API Key 认证和 CLI 配置管理。

## 认证

```bash
# 保存 API Key
mizzen auth set-key <api-key>

# 查看认证状态
mizzen auth status

# 清除 API Key
mizzen auth clear
```

也可通过环境变量：`export MIZZEN_API_KEY=mk_xxx`

API Key 在 [Mizzen 工作区设置](https://mizzen.chat) 中创建。

## 配置

```bash
# 查看配置
mizzen config show

# 修改 API 地址
mizzen config set api.base_url https://...

# 修改前端站点地址（影响分享链接展示）
mizzen config set api.site_url https://...

# 修改超时时间（秒）
mizzen config set api.timeout 60

# 默认输出格式
mizzen config set output.format json    # table / json / csv

# 禁用颜色输出
mizzen config set output.color false

# 重置为默认
mizzen config reset
```

## 输出格式

所有命令支持全局格式切换：

```bash
mizzen --json interview list     # JSON 输出（适合程序处理）
mizzen --csv interview list      # CSV 输出（适合导出）
mizzen interview list            # 表格输出（默认，人类可读）
```

## AI Usage Guidance

- **首次使用前必须确认认证状态**：运行 `mizzen auth status` 检查
- **环境变量优先级高于配置文件**。如果设置了 `MIZZEN_API_KEY`，会覆盖 `auth set-key` 保存的值
- **不要在对话中明文展示 API Key**。设置后只需确认 `auth status` 显示已认证即可
