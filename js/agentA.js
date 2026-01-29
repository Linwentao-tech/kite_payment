// Agent A (buyer) - Node.js demo
// Sends minimal payment then calls Agent B with DID + signature
const { ethers } = require("ethers");

const RPC_URL = process.env.RPC_URL || "https://rpc-testnet.gokite.ai/";
const CHAIN_ID = Number(process.env.CHAIN_ID || "2368");
const PRIVATE_KEY = process.env.A_PRIVATE_KEY;
const AGENT_B_URL = process.env.AGENT_B_URL || "http://127.0.0.1:8001/buy_data";
const TO_ADDRESS = process.env.B_ADDRESS;
const AMOUNT_KITE = process.env.AMOUNT_KITE || "0.001";

if (!PRIVATE_KEY) throw new Error("Missing A_PRIVATE_KEY");
if (!TO_ADDRESS) throw new Error("Missing B_ADDRESS");

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL, CHAIN_ID);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

  console.log("💸 Agent A: sending payment...");
  const tx = await wallet.sendTransaction({
    to: TO_ADDRESS,
    value: ethers.parseEther(AMOUNT_KITE)
  });
  console.log("⛓️  tx hash:", tx.hash);
  const receipt = await tx.wait();
  if (receipt.status !== 1) throw new Error("Transaction failed");

  const senderDid = `did:kite:${wallet.address.toLowerCase()}`;
  const issuedAt = Math.floor(Date.now() / 1000);
  const messageObj = {
    sender_did: senderDid,
    sender_address: wallet.address,
    to: TO_ADDRESS,
    amount_wei: tx.value.toString(),
    tx_hash: tx.hash,
    issued_at: issuedAt
  };
  const messageStr = JSON.stringify(messageObj);
  const signature = await wallet.signMessage(messageStr);

  const payload = { ...messageObj, signature, message: messageStr };
  console.log("📨 Agent A: sending request to Agent B...");

  const res = await fetch(AGENT_B_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  console.log("✅ Response:", res.status, await res.text());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
