# 慢慢办

用 Node.js 24 安装依赖（`npm ci`），再用 `npm run dev` 启动网页。在 Windows PowerShell 中也可以用 `npm.cmd`。

## 防骗提醒

可疑消息快查只在当前页面匹配常见线索。请从原平台或本人已有联系方式核实。求助区可按转账、泄露验证码或屏幕共享查看处理步骤。

## 健康管理

- **小慢健康问答**内置用药和就诊常见解答。联网时，模型负责匹配固定的科普解答。具体药物、剂量和检查结果请向医生或药师咨询。
- **身体情况**可以更正已保存的读数、测量时间和血糖时机。曲线随记录更新，血糖按空腹、餐后和未注明筛选。旧记录无需迁移。
- **用药计划**可下载 30 天的日历提醒文件。需用支持 `.ics` 的日历导入并检查提醒设置，网页可以关闭。调整计划后应同步修改日历。
- **就诊准备**会汇总近期 7 天或 30 天的测量与当前用药计划，也可以在本机保存想问医生的问题。清单可复制或保存为文字文件。
- 点「AI 帮我整理」后，模型根据当前筛选的记录条数和数值摘要选择复诊提示。测量日期、备注和用药清单留在本机。曲线和数值摘要在没有模型时也可查看。

### 本机体验在线 AI

在启动服务前，将百炼 API Key 通过私密方式设置到服务端进程的 `HEALTH_AI_API_KEY`。也可设置 `HEALTH_AI_BASE_URL` 和 `HEALTH_AI_MODEL` 来接入其他 OpenAI 兼容模型。默认使用中国内地百炼的 `https://dashscope.aliyuncs.com/compatible-mode/v1` 和 `qwen-plus`。密钥请勿写入源代码、提交记录或 `VITE_` 开头的变量。修改后重启服务。

```powershell
$env:HEALTH_AI_API_KEY = Read-Host "输入百炼 API Key" -MaskInput
npm.cmd run dev
```

本例的 `-MaskInput` 适用于 PowerShell 7。使用 `npm run preview` 时，同样可以通过本机回环地址体验。当前网关只接受本机请求。将 `dist` 发布到 Qoder Sites 等静态托管后，曲线和常见解答仍可使用。若需公开提供在线 AI，需要另行部署同源服务端接口，并配置访问控制和用量限制。

[阿里云百炼的 OpenAI 兼容接口文档](https://help.aliyun.com/zh/model-studio/compatibility-of-openai-with-dashscope)
