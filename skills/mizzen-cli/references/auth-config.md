# auth & config 认证与配置

API Key 认证和 CLI 配置管理。

## 认证

```bash
# 保存 API Key
mizzen-cli auth set-key <api-key>

# 查看认证状态
mizzen-cli auth status

# 清除 API Key
mizzen-cli auth clear
```

也可通过环境变量：`export MIZZEN_API_KEY=mk_xxx`

API Key 在 [Mizzen 工作区设置](https://mizzen.top) 中创建。

## 配置

```bash
# 查看配置
mizzen-cli config show

# 修改 API 地址
mizzen-cli config set api.base_url https://...

# 修改前端站点地址（影响分享链接展示）
mizzen-cli config set api.site_url https://...

# 修改超时时间（秒）
mizzen-cli config set api.timeout 60

# 重置为默认
mizzen-cli config reset
```

## AI Usage Guidance

- **首次使用前必须确认认证状态**：运行 `mizzen-cli auth status` 检查
- **环境变量优先级高于配置文件**。如果设置了 `MIZZEN_API_KEY`，会覆盖 `auth set-key` 保存的值
- **不要在对话中明文展示 API Key**。设置后只需确认 `auth status` 显示已认证即可
