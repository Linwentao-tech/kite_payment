Kite AI 审计 Demo（前端）

这是一个基于 Next.js 的 AA 审计流程演示界面（KiteAI Testnet）。
主要展示：

- AA 钱包生成与状态查询
- 主预算规则设置
- Session 创建与 agent 规则
- 由服务端 agent 发起的链上执行
- 多 Agent 审计模拟（console 风格输出）
- 支付面板 + 返利面板

环境要求

- Node.js 18+
- npm（或 pnpm/yarn/bun）

环境变量
在 `frontend_demo/.env.local` 中配置：

```
AGENT_PRIVATE_KEY=0x...

```

说明：

- `AGENT_PRIVATE_KEY` 用于服务端接口签名/执行。

说明（Kite 生态）

- 在 Kite 生态中，agent 地址通常由 owner 地址通过 BIP32 派生。
- 本 Demo 为简化流程，使用普通 EOA 地址代替派生的 agent 地址，所以需要提供一个`AGENT_PRIVATE_KEY`。

启动

```
npm install
npm run dev
```

访问 http://localhost:3000

核心接口

服务端：

- `POST /api/agent-execute`：agent 发起链上执行（按 Session 规则校验）。
- `POST /api/agent-sign`：生成 EIP-712 授权签名。
- `GET /api/aa-wallet?owner=0x...`：获取 AA 地址与部署状态。

前端流程

1. 连接 owner 钱包
2. 生成 AA 地址
3. 设置主预算规则
4. 创建 Session
5. 充值 AA
6. 自动执行 agent 转账
7. 体验多 Agent 审计模拟与支付面板

安全提示

- 不要提交真实私钥。
- 仅使用测试网资产和测试地址。

主要文件

- `app/page.tsx`：主 UI 与流程
- `app/components/ExecuteTransferCard.tsx`：自动执行转账 UI
- `app/api/agent-execute/route.ts`：服务端 agent 执行
- `app/api/agent-sign/route.ts`：服务端 agent 签名
