<div align="center">

# 🪁 AuditOps

### 基于 Kite AI 的智能合约审计与价值网络自构建 Agent 集群

![Status](https://img.shields.io/badge/Status-MVP_Demo-success?style=for-the-badge)
![Network](https://img.shields.io/badge/Network-KiteAI_Testnet-blue?style=for-the-badge&logo=ethereum)
![Tech](https://img.shields.io/badge/Stack-Next.js_16_%7C_Wagmi_3_%7C_AA_SDK-black?style=for-the-badge&logo=next.js)

[项目愿景](#-项目愿景) • [核心方案](#-核心方案) • [技术架构](#-技术架构) • [演示流程](#-演示流程) • [路线图](#-路线图)

---

<p align="center">
  <strong>"不止审计，更是全自动：一边是一键从需求到部署，一边是 Agent 价值链条构建。"</strong>
  <br>
  <strong>AuditOps</strong>：致敬 DevOps 精神，通过 Account Abstraction (AA) 与 Session Keys 实现功能性 Agent 与价值网络的深度耦合。
</p>

</div>

---

## 📖 项目愿景

罗马不是一天建成的，Agent经济这座城亦然。Kite AI 正建立 Agent 经济中的“罗马城”，而我们只是预见了这座城市日后之繁华的 Builder! Agent 经济这座城，上有“**功能性 Agent**”建筑，下有**稳定币原生 + 微支付**作为管网。我们分别称之为“**功能网络**”与“**价值网络**”。功能性 Agent 间的协同与交互带来价值的交换与流动，这正是功能网络与价值网络间的相互作用，也是即将爆发的 Agent 经济的运作模式。

我们认为，在这样一个蓬勃发展的生态中，值得人们去建设的部分主要有三：**功能性 Agent、支付场景、功能网络与价值网络**。功能性 Agent 是价值的基础，它们就像人类社会中受过教育的公民，可以出色完成特定任务；支付场景则像人类社会中的贸易，是价值流动的基础；而功能网络与价值网络则像是人类世界的“大数据”，分析它，你会发现诸多还未被发掘的价值。

因此，我们的产品围绕一个核心功能，也就是智能合约审计，并预留了“待到罗马灯火通明时”可以发挥大作用的子网构建与优化 Agent 模块。打磨核心功能固然重要，但我们不仅是一个孤立的、等待用户或其它Agent调用的功能性 Agent，子网构建与优化 Agent 模块使得我们可以**主动构建包含审计功能的功能链**，从而丰富功能网络与价值网络的连接。在增加合约审计 Agent 被调用次数与营收的同时，也为整个网络的构建做出贡献。

在Kite链，既“盖楼”，又“修管道”，这就是我们的愿景。

---

## 💡 核心方案

### 1. 🛡️ 模块化 Multi-Agent 审计矩阵 (The "Audit" Core)

我们摒弃了单体审计的模式，采用 **Map-Reduce** 架构将审计任务拆解为多个并行子任务：

- **漏洞扫描 Agent**：专注于重入攻击、整数溢出等常见漏洞。
- **经济模型 Agent**：分析代币经济学与 DeFi 交互风险。
- **权限分析 Agent**：检测中心化风险与权限后门。
- **依赖与集成 Agent**：检测外部合约、预言机、跨链桥风险。
- **汇总/裁决 Agent**：整合各方数据，输出结构化的高质量审计报告。

### 2. 💳 丝滑的 A2A 微支付 (The "Ops" Engine)

基于 **ERC-4337 账户抽象理念** 与 **Session Keys**，我们解决了“授权”与“安全”的矛盾，实现了支付侧的自动化：

- **主预算控制 (Master Budget)**：用户设定全局的每日限额与单笔限额，确保资金总池安全。
- **会话授权 (Session Authorization)**：通过 EIP-712 签名，授权特定 Agent 在**限定时间**和**限定预算**内自动执行交易。这使得 Agent 可以像人类一样“刷卡消费”，而无需用户对每一笔微支付进行签名确认。

### 3. 🔄 价值闭环与返利机制 (Rebate Loop)

我们设计了一个基于数据的商业闭环：

- **漏洞悬赏**：如果审计后的用户合约发往审计公司后发现审计遗漏的漏洞，可提交报告并获得USDT返利（20%-50% 支付成本）。
- **防注入攻击**：用户提交的数据需经过 Pending 审核期，确认为真后反哺给 Agent 网络进行训练，建立不断进化的安全数据库。

---

## 🏗 技术架构

**AuditOps** 是一个集成了真实链上交互与服务端代执行的完整全栈 Demo。

### 核心技术栈

- **前端框架**: Next.js 16.1.6 (App Router) + React 19 + Tailwind CSS v4
- **Web3 交互**: Wagmi 3.x + Viem 2.x + @tanstack/react-query
- **AA 基础设施**: gokite-aa-sdk (负责 AA 地址计算、UserOp 封装与部署)
- **服务端逻辑**: Next.js Route Handlers (API) 处理私钥管理与代执行
- **网络环境**: KiteAI Testnet (ChainID: 2368)

### 交互逻辑流程（Demo 实现）

1. **初始化**：用户连接钱包，系统根据 owner 地址计算 AA 地址并展示部署状态。
2. **设置规则**：用户上链设置 Master Budget（全局日/单笔预算）。
3. **创建 Session**：用户创建 Session，授权 agent 在限定预算/时间窗内执行。
4. **充值 AA**：用户向 AA 钱包转入测试 USDT 作为可用余额。
5. **审计与支付**：前端模拟多 Agent 工作流，结算时调用服务端 `/api/agent-execute`。
6. **链上执行**：服务端用 AGENT_PRIVATE_KEY 生成 EIP-712 授权签名并发送 `executeTransferWithAuthorization`。
7. **链上校验**：合约校验 Session 规则 + 签名有效性，通过则转账并解锁报告。



---

## 🎮 演示流程 (Demo Walkthrough)

本 Demo 旨在让用户体验未来 Agent 经济的流畅交互：

1.  **构建 AA 身份**：进入首页，连接 MetaMask。系统将自动为您生成专属的 **AuditOps** AA 智能钱包地址。
2.  **建立信任 (Trust Anchor)**：在“预算设置”卡片中，设定您的安全底线。随后创建 Session，授权我们的审计 Agent 为您服务。
3.  **沉浸式审计**：输入任意 GitHub 合约仓库地址。您将看到终端风格的日志滚动，展示漏洞扫描、逻辑分析等多个 Agent 的实时协作过程。
4.  **无感支付 (The Payoff)**：当审计摘要生成后，系统将自动发起链上微支付。得益于 Session Key，您**无需**再次唤起钱包签名。
5.  **参与共建**：体验“返利面板”，模拟提交一份漏洞报告，查看系统如何反馈代币激励。
6.  **从需求到部署**：提交需求并支付费用，即可拥有从需求到部署的丝滑体验。

---

## 🚀 快速开始

### 前置要求

- Node.js >= 18
- npm
- 持有 KiteAI Testnet 测试币的钱包

### 安装步骤

1. **克隆仓库**

   ```bash
   git clone https://github.com/Linwentao-tech/kite_payment.git
   cd frontend_demo
   ```

2. **安装依赖**

   ```bash
   # 确保当前在 frontend_demo 目录
   npm install
   ```
  说明（Kite 生态）

- 在 Kite 生态中，agent 地址通常由 owner 地址通过 BIP32 派生。
- 本 Demo 为简化流程，使用普通 EOA 地址代替派生的 agent 地址，所以需要提供一个 AGENT_PRIVATE_KEY。

3. **配置环境**
   在 `frontend_demo/.env.local` 中填入 Agent 私钥：

   ```env
   # Agent 私钥 (用于 Demo 演示代执行，无需 0x 前缀)
   AGENT_PRIVATE_KEY=your_private_key_here
   ```

4. **启动开发环境**
   ```bash
   # 确保当前在 frontend_demo 目录
   npm run dev
   ```

---

## 🗺️ 路线图 (Roadmap)

### Phase 1: MVP (当前阶段) ✅

- [x] 最小化 AA 钱包实现与界面展示
- [x] 基于 Session Key 的预算控制体系
- [x] 模块化审计流程的前端仿真与结构化输出
- [x] 核心支付链路跑通 (Agent-to-Agent Payment)

### Phase 2: 网络优化与图数据 (The Graph) 🚧

- [ ] **支付链路路由优化**：利用图算法在多个服务商中寻找性价比最高、速度最快的 Agent 组合链路。
- [ ] **审计子网权重提升计划**：分析Agent价值网络，并通过主动构建价值连接，与高中心性、高权重节点或具有强社区性节点建立价值链，增加本子网营收，并增加整个Kite AI价值网络的GDP。
- [ ] **真实 LLM 集成**：将前端模拟的审计逻辑替换为真实的 RAG + LLM 后端服务。

---

## 🤝 贡献与反馈

我们欢迎社区共同参与建设 KiteAI 上的基础设施！
如果您对“图数据优化”或“AA 支付场景”感兴趣，欢迎提交 Issue 或 Pull Request。

## 📄 License

MIT License © 2026 **AuditOps** Team
