# 协作说明（只保留关键信息）

## 当前已完成

- 支付闭环：two-step（pending→confirm→execute）+ one-shot（自动确认）
- 身份/签名：`KiteIdentityProvider` 接口位 + demo EVM 签名实现
- Agent 接入：`AgentA.create_signed_request()` + `AgentB(require_signature=True)`（可选 allowlist）
- 测试：覆盖支付流程与签名校验

## 验证方式（已跑过的测试）

在 Windows + 工作区 `.venv` 下运行：

```powershell
cd python\kite-payment-loop
..\..\.venv\Scripts\python.exe -m pytest -q
```

当前结果：`7 passed`。

## 团队分工与对接点

### Agent / Workflow

- 负责 `src/agents/*` 与 `src/core/payment_loop.py` 的编排，扩展场景与工作流

### Payment

实现 `PaymentGateway` 三个接口（建议新建 `src/core/real_gateway.py`）：

- `request_payment(payer_id, payee_id, amount, metadata) -> PaymentRequest`
- `get_status(payment_id) -> PaymentStatus`
- `confirm_payment(payment_id) -> bool`

接入点：在 `src/main.py`（或新增 CLI）中，将 `InMemoryPaymentGateway` 替换为你们的实现。

### Identity（可选）

- 在 `src/identity/*` 中实现/桥接 `KiteIdentityProvider` 到真实 Kite Agent 身份体系
- 接入点：`AgentA(identity_provider=...)` 与 `AgentB(require_signature=True)`
