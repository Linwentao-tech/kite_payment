// Agent B (seller) - Node.js demo
// Verifies payment on KiteAI Testnet and validates DID signature
const express = require("express");
const { ethers } = require("ethers");

const RPC_URL = process.env.RPC_URL || "https://rpc-testnet.gokite.ai/";
const CHAIN_ID = Number(process.env.CHAIN_ID || "2368");
const RECEIVER_ADDRESS = process.env.B_ADDRESS;
const PORT = Number(process.env.PORT || "8001");

if (!RECEIVER_ADDRESS) throw new Error("Missing B_ADDRESS");

const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
const app = express();
app.use(express.json());

app.post("/buy_data", async (req, res) => {
  try {
    const {
      sender_did,
      sender_address,
      aa_sender,
      to,
      amount_wei,
      tx_hash,
      signature,
      message
    } = req.body || {};

    if (!sender_did || !sender_address || !to || !amount_wei || !tx_hash || !signature || !message) {
      return res.status(400).send("Missing fields");
    }
    if (!sender_did.startsWith("did:kite:")) return res.status(400).send("Invalid DID");
    console.log("📥 Request:", { sender_did, sender_address, aa_sender, to, amount_wei, tx_hash });

    // 1) Verify signature
    const recovered = ethers.verifyMessage(message, signature);
    if (recovered.toLowerCase() !== sender_address.toLowerCase()) {
      return res.status(401).send("Invalid signature");
    }

    // 2) Verify tx on-chain
    const tx = await provider.getTransaction(tx_hash);
    const receipt = await provider.getTransactionReceipt(tx_hash);
    if (!tx || !receipt) return res.status(404).send("Tx not found");
    if (receipt.status !== 1) return res.status(402).send("Tx failed");
    if (!tx.to || tx.to.toLowerCase() !== RECEIVER_ADDRESS.toLowerCase()) {
      return res.status(402).send("Wrong recipient");
    }
    const expectedSender = (aa_sender || sender_address).toLowerCase();
    if (tx.from.toLowerCase() !== expectedSender) return res.status(402).send("Wrong sender");
    if (tx.value < BigInt(amount_wei)) {
      return res.status(402).send("Insufficient payment");
    }

    return res.json({
      status: "success",
      data: `已确认付款。这里是 ${sender_did} 请求的数据结果。`,
      tx_hash
    });
  } catch (err) {
    return res.status(500).send(String(err));
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Agent B listening on http://127.0.0.1:${PORT}`);
});
