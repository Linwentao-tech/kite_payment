# KiteAI Testnet Agent-to-Agent 最小支付 Demo (Node.js)

## Testnet 信息
- Chain name: KiteAI Testnet
- RPC: https://rpc-testnet.gokite.ai/
- Chain ID: 2368
- Token: KITE
- Explorer: https://testnet.kitescan.ai/

## 你需要准备
- A 钱包私钥（`A_PRIVATE_KEY`）
- B 收款地址（`B_ADDRESS`，例如 `0x822AaaD85E6d922fDD25Fa3Ca59F96fc01332F51`）
- A 钱包里需要有测试网 KITE

---

# Node.js 版（直接转账）

## 安装依赖
```bash
cd js
npm install
```

## 启动 B
```bash
cd js
export B_ADDRESS=0x822AaaD85E6d922fDD25Fa3Ca59F96fc01332F51
export RPC_URL=https://rpc-testnet.gokite.ai/
export PORT=8001
npm run start:b
```

## 启动 A
```bash
cd js
export A_PRIVATE_KEY=0xYourAPrivateKey
export B_ADDRESS=0x822AaaD85E6d922fDD25Fa3Ca59F96fc01332F51
export RPC_URL=https://rpc-testnet.gokite.ai/
export AGENT_B_URL=http://127.0.0.1:8001/buy_data
npm run start:a
```

---

# Node.js 版（AA SDK / UserOperation）

## 启动 B
```bash
cd js
export B_ADDRESS=0x822AaaD85E6d922fDD25Fa3Ca59F96fc01332F51
export RPC_URL=https://rpc-testnet.gokite.ai/
export PORT=8001
npm run start:b
```

## 启动 A（AA SDK）
```bash
cd js
export A_PRIVATE_KEY=0xYourAPrivateKey
export B_ADDRESS=0x822AaaD85E6d922fDD25Fa3Ca59F96fc01332F51
export RPC_URL=https://rpc-testnet.gokite.ai/
export AGENT_B_URL=http://127.0.0.1:8001/buy_data
export BUNDLER_URL=https://bundler-service.staging.gokite.ai/rpc/
export AA_NETWORK=kite_testnet
npm run start:a:aa
```

## DID/身份体系说明（Kite Identity）
- A 使用地址生成 DID：`did:kite:<address>`
- A 对消息签名（包含 tx_hash / amount / to / timestamp）
- B 侧验签，确认 DID 对应的地址确实发起付款
- AA 版本会额外携带 `aa_sender`（智能账户地址），B 端会验证链上 `from` 是否为该 AA 地址
