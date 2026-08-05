# ModelSentry

一个轻量级的 AI 模型监控工具：定时拉取多个平台的模型列表，检测新增/下架变动，并通过 Webhook 推送告警；可选提供“价格抓取/展示”能力。

## 功能一览
- 🔍 定时轮询主流模型提供商的模型列表
- 📬 多渠道通知：企业微信、飞书（Lark）等（可扩展为通用 Webhook）
- ⚡ 基于 Bun 运行时，无需外部数据库依赖
- 🎨 可自定义前端主题、图标、提示词等
- 🛡️ 启动时自动校验缺失的凭证并优雅跳过（自动禁用对应 provider/通知）

## 快速开始
1. 复制环境变量模板并按需修改：
   ```bash
   cp .env.example .env
   ```
2. 编辑 `.env`，至少填入你要监控的 provider 的 API Key，以及你要接收通知的 Webhook：
   - `OPENAI_API_KEY`, `CLAUDE_API_KEY`, `GEMINI_API_KEY` 等（模型提供商凭证）
   - `WEWORK_BOT_KEY_CHANGES`, `LARK_BOT_WEBHOOK_URL` 等（通知地址）
   - `MODEL_SENTRY_DETAIL_URL`（可选，用于通知卡片里的“查看详情”按钮）
3. 安装依赖并启动：
   ```bash
   bun install
   bun run start
   ```
4. 使用 Docker 运行（读取本地 `.env`）：
   ```bash
   docker build -t modelsentry .
   docker run -d --name modelsentry \
     -p 3000:3000 \
     --env-file .env \
     -v "$PWD/config:/app/config" \
     -v "$PWD/data:/data" \
     modelsentry
   ```

   容器内的持久化数据目录是 `/data`，镜像内同时保留 `/app/data -> /data` 的兼容路径。因此 `cacheSettings.filePath` 写成 `data/modelsentry-cache.json` 或 `/data/modelsentry-cache.json` 都会写入同一个持久化目录。启动入口会先尝试修正 `/app/config`、`/data` 和 `/app/data` 的所有者，再以非 root 用户启动应用。

## 环境变量概览
- **运行与日志**：`PORT`, `LOG_LEVEL`
- **模型提供商**：`OPENAI_API_KEY`, `CLAUDE_API_KEY`, `GEMINI_API_KEY`, `GROQ_API_KEY`, `XAI_API_KEY`, `MISTRAL_API_KEY`, `AI21_API_KEY`, `PERPLEXITY_API_KEY` 等（不用的可以留空或删除）
- **价格抓取（可选）**：`LLM_API_KEY`, `LLM_BASE_URL`, `LLM_MODEL`（页面抓取走免费 Jina Reader + Firecrawl keyless，无需抓取 Key）
- **通知**：`WEWORK_BOT_KEY_CHANGES`, `LARK_BOT_WEBHOOK_URL`, `MODEL_SENTRY_DETAIL_URL`
- `.env.example` 覆盖了项目支持的变量，按需填充即可。

## 配置文件结构
- `config/config.json`：全局配置（轮询频率、前端显示、缓存等）
- `config/providers.json`：各模型提供商的模型列表 API 配置
- `config/notifications.json`：通知通道配置（Webhook 模板、触发条件等）
- `config/pricing.json`：价格抓取配置（启用时需要 LLM API Key；页面抓取使用免费通道）
- `resources/prompts/pricing_system_prompt.txt`：价格解析用的系统提示词
- `resources/icons/svg-name.txt`：已知图标列表（用于模糊匹配）

> 容器部署时建议把 `config/` 挂载出来以便自定义；`resources/` 下的默认文件也可以按需覆盖或拷贝到你自己的存储。

## 缓存设置（内存 / 本地文件）
`config/config.json` 支持 `cacheSettings`，用于控制 ModelSentry 把“最新模型列表”和“价格抓取结果”缓存在内存里，还是落到本地文件里（可跨重启恢复）。

- `cacheSettings.backend`：`"memory"`（默认）或 `"file"`
- `cacheSettings.filePath`：使用 `"file"` 时的缓存文件路径（默认：`data/modelsentry-cache.json`）

示例：
```json
{
  "cacheSettings": {
    "backend": "file",
    "filePath": "data/modelsentry-cache.json"
  }
}
```

Docker 部署想要缓存跨“容器重建”保留，需要把 `filePath` 的父目录挂载成 volume。默认 Compose 示例已经挂载 `./data:/data`。

## 用 AI 生成 Provider 配置
拿到某个提供商的 `list models` 响应后，可以把下面这段提示词丢给任意 LLM，让它生成可直接放进 `config/providers.json` 的 `providers` 数组中的 JSON 片段：

```text
You are ModelSentry's configuration assistant. Please read the model list API response I provide and output a JSON snippet to be inserted into the `providers` array in `config/providers.json`. Field descriptions:
- id: Unique identifier for the provider in the API, using lowercase English letters and numbers
- name: Display name
- enabled: Defaults to true
- url: The URL for the list models API endpoint
- method: HTTP method
- auth: Maintain ModelSentry's default header authentication format
- parsing.modelListPath: JSON path to the model array
- parsing.modelNamePath: JSON path to the model name field

API call example:
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer $OPENAI_API_KEY"
Response example:
{
  "object": "list",
  "data": [
    {
      "id": "model-id-0",
      "object": "model",
      "created": 1686935002,
      "owned_by": "organization-owner"
    },
    {
      "id": "model-id-1",
      "object": "model",
      "created": 1686935002,
      "owned_by": "organization-owner"
    },
    {
      "id": "model-id-2",
      "object": "model",
      "created": 1686935002,
      "owned_by": "openai"
    }
  ],
  "object": "list"
}
Please only return JSON, no explanations. Output example:
{
  "id": "openai",
  "name": "Openai",
  "enabled": true,
  "url": "https://api.openai.com/v1/models",
  "method": "GET",
  "auth": {
    "type": "header",
    "headerName": "Authorization",
    "valuePrefix": "Bearer ",
    "apiKeyEnvVar": "OPENAI_API_KEY"
  },
  "parsing": {
    "modelListPath": "data",
    "modelNamePath": "id"
  }
}
```

## 自定义通知通道
通知系统配置在 `config/notifications.json`。每个通知通道支持自定义模板与触发条件。

### 配置结构
```json
{
  "notifications": [
    {
      "id": "your-channel-id",
      "enabled": true,
      "type": "generic_webhook",
      "webhookUrlEnvVar": "YOUR_WEBHOOK_ENV_VAR",
      "triggerOn": ["added", "removed", "error"],
      "templateEnvVars": {
        "detailPageUrl": "MODEL_SENTRY_DETAIL_URL"
      },
      "requestBodyTemplate": {
        "your": "custom payload"
      }
    }
  ]
}
```

### 字段说明
- `id`：通道唯一标识
- `enabled`：`true` 启用，`false` 禁用
- `type`：目前支持 `generic_webhook`（HTTP POST）
- `webhookUrlEnvVar`：Webhook URL 所在的环境变量名
- `triggerOn`：触发条件数组，可选值：
  - `"added"`：有新增模型
  - `"removed"`：有下架模型
  - `"error"`：API 发生错误
- `templateEnvVars`（可选）：把环境变量注入到模板变量
- `requestBodyTemplate`：要发送的 JSON 负载（支持模板变量）

### 可用模板变量
- `{{providerName}}`：提供商显示名（如 "OpenAI"）
- `{{providerId}}`：提供商 ID（如 "openai"）
- `{{errorDetails}}`：错误信息（无错误时为空）
- `{{addedMarkdownList}}`：新增模型的 Markdown 列表
- `{{removedMarkdownList}}`：下架模型的 Markdown 列表
- 以及 `templateEnvVars` 中自定义的变量（如 `{{detailPageUrl}}`）

### 示例
企业微信机器人（Markdown）：
```json
{
  "id": "wechat",
  "enabled": true,
  "type": "generic_webhook",
  "webhookUrlEnvVar": "WEWORK_BOT_KEY_CHANGES",
  "triggerOn": ["added", "removed"],
  "requestBodyTemplate": {
    "msgtype": "markdown",
    "markdown": {
      "content": "**Model Update**\\n> Provider: {{providerName}}\\n\\n**Added:**\\n{{addedMarkdownList}}\\n\\n**Removed:**\\n{{removedMarkdownList}}"
    }
  }
}
```

飞书/企业应用卡片（交互式卡片）：
请参考默认的 `config/notifications.json`（里面包含完整示例：卡片、图片、按钮等）。

自定义 Webhook：
```json
{
  "id": "custom",
  "enabled": true,
  "type": "generic_webhook",
  "webhookUrlEnvVar": "CUSTOM_WEBHOOK_URL",
  "triggerOn": ["added", "removed", "error"],
  "requestBodyTemplate": {
    "provider": "{{providerId}}",
    "added": "{{addedMarkdownList}}",
    "removed": "{{removedMarkdownList}}",
    "error": "{{errorDetails}}"
  }
}
```

### 说明
- 未配置的模板变量会渲染为空字符串，并在启动时提示 warning log
- 可同时启用多个通知通道
- 缺少 webhook 环境变量的通道会被自动禁用

## 可选：价格抓取/展示
- 在 `config/pricing.json` 中将 `pricingSettings.enabled` 设为 `true`
- 配置 `LLM_API_KEY`（以及可选的 `LLM_BASE_URL` / `LLM_MODEL`）。页面抓取默认轮询使用免费的公共 Jina Reader（`r.jina.ai`）与 Firecrawl keyless scrape；某一侧 429 时自动切到另一侧，都失败再直连目标页。抓取后调用 OpenAI 兼容 LLM 转成结构化 JSON（提示词在 `resources/prompts/pricing_system_prompt.txt`）。
- 刷新行为：
  - 手动：访问 `/pricing`，点击 **刷新价格**（调用 `POST /api/pricing/refresh`）
  - 自动（无定时）：当某 provider 的模型列表发生变动时，会刷新“同 provider id”的价格数据
- 重要：`config/pricing.json` → `pricingSettings.providers[].id` 必须与 `config/providers.json` → `providers[].id` 一致（例如 Claude 使用 `claude`，不是 `anthropic`）
- `LLM_BASE_URL` 需要指向能接收 Chat Completions JSON 的接口（OpenAI 通常是 `https://api.openai.com/v1/chat/completions`）

## License
MIT License
