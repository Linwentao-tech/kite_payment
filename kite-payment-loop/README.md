# Kite Payment Loop

## 当前已完成（What we have now）

最小闭环：Agent A 发起请求 → 创建支付 →（确认后）→ Agent B 执行 → 回传结果。

- 支付流程（可对接真实支付）
  - 抽象 `PaymentGateway`：`request_payment/get_status/confirm_payment`
  - 支持 one-shot（自动确认）与 two-step（pending→confirm→execute）两种跑法
- Agent 身份/签名（可对接真实 Kite 身份体系）
  - `KiteIdentityProvider` 接口位
  - demo 实现：EVM 地址签名（`EvmLocalIdentityProvider`）
  - `AgentA.create_signed_request(...)` 生成带签名请求
  - `AgentB(require_signature=True)` 强制验签（可选 allowlist）

## 验证方式（已跑过的测试）

在 Windows + 工作区 `.venv` 下运行：

```powershell
cd python\kite-payment-loop
..\..\.venv\Scripts\python.exe -m pytest -q
```

当前结果：`7 passed`。

覆盖点：

- 基础 Agent 行为（创建请求 / 执行服务）
- 支付闭环 one-shot 与 two-step
- 身份签名：验签通过 / 篡改失败 / allowlist 拦截

## 团队分工与对接点

### （Agent / Workflow）

- 维护 `src/agents/*` 与编排逻辑，扩展场景与工作流

### 同伴（Payment）

- 实现真实 `PaymentGateway`（对齐上述三个方法）
- 接入点：在 `src/main.py` 将 `InMemoryPaymentGateway()` 替换为你们的实现

### 可选（Identity）

- 实现/桥接 `KiteIdentityProvider` 到真实 Kite Agent 身份体系
- 接入点：`AgentA(identity_provider=...)` + `AgentB(require_signature=True)`

协作细节见 `CONTRIBUTING.md`。
