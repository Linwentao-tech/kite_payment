import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  isAddress,
  parseUnits,
  type Hex,
} from 'viem'
import { defineChain } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const RPC_URL = 'https://rpc-testnet.gokite.ai'
const CHAIN_ID = 2368
const kiteTestnet = defineChain({
  id: CHAIN_ID,
  name: 'KiteAI Testnet',
  nativeCurrency: { name: 'KITE', symbol: 'KITE', decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
})
const TOKEN_ADDRESS = '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63'

const executeAbi = [
  {
    type: 'function',
    name: 'executeTransferWithAuthorization',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'sessionId', type: 'bytes32' },
      {
        name: 'auth',
        type: 'tuple',
        components: [
          { name: 'from', type: 'address' },
          { name: 'to', type: 'address' },
          { name: 'token', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'validAfter', type: 'uint256' },
          { name: 'validBefore', type: 'uint256' },
          { name: 'nonce', type: 'bytes32' },
        ],
      },
      { name: 'signature', type: 'bytes' },
      { name: 'metadata', type: 'bytes' },
    ],
    outputs: [],
  },
] as const

const TYPES = {
  TransferWithAuthorization: [
    { name: 'from', type: 'address' },
    { name: 'to', type: 'address' },
    { name: 'token', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'validAfter', type: 'uint256' },
    { name: 'validBefore', type: 'uint256' },
    { name: 'nonce', type: 'bytes32' },
  ],
} as const

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        aaWallet: string
        sessionId: Hex
        recipient: string
        amount: string
        validBefore: number
        nonce: Hex
        token?: string
      }
    | null

  if (!body) {
    return Response.json({ error: 'Invalid payload.' }, { status: 400 })
  }

  const { aaWallet, sessionId, recipient, amount, validBefore, nonce } = body
  const token = body.token ?? TOKEN_ADDRESS

  if (
    !isAddress(aaWallet) ||
    !isAddress(recipient) ||
    !isAddress(token) ||
    !sessionId
  ) {
    return Response.json({ error: 'Invalid address.' }, { status: 400 })
  }

  let agentKey = process.env.AGENT_PRIVATE_KEY?.trim()
  if (!agentKey) {
    return Response.json({ error: 'Missing AGENT_PRIVATE_KEY.' }, { status: 500 })
  }
  if (!agentKey.startsWith('0x')) agentKey = `0x${agentKey}`

  try {
    const account = privateKeyToAccount(agentKey as Hex)
    const value = parseUnits(amount || '0', 18)
    const domain = {
      name: 'GokiteAccount',
      version: '1',
      chainId: CHAIN_ID,
      verifyingContract: aaWallet as Hex,
    }

    const message = {
      from: aaWallet,
      to: recipient,
      token,
      value,
      validAfter: BigInt(0),
      validBefore: BigInt(validBefore || 0),
      nonce,
    }

    const signature = await account.signTypedData({
      domain,
      types: TYPES,
      primaryType: 'TransferWithAuthorization',
      message,
    })

    const walletClient = createWalletClient({
      account,
      transport: http(RPC_URL),
      chain: kiteTestnet,
    })
    const publicClient = createPublicClient({
      transport: http(RPC_URL),
      chain: kiteTestnet,
    })
    let simulationError: string | null = null
    try {
      await publicClient.simulateContract({
        address: aaWallet as Hex,
        abi: executeAbi,
        functionName: 'executeTransferWithAuthorization',
        args: [sessionId, message, signature, '0x'],
        account: account.address,
      })
    } catch (simErr) {
      simulationError =
        simErr instanceof Error ? simErr.message : 'Simulation failed.'
    }
    const data = encodeFunctionData({
      abi: executeAbi,
      functionName: 'executeTransferWithAuthorization',
      args: [sessionId, message, signature, '0x'],
    })
    const hash = await walletClient.sendTransaction({
      chain: kiteTestnet,
      to: aaWallet as Hex,
      data,
      gas: 600000n,
      value: 0n,
    })
    return Response.json({ hash, simulationError })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Execution failed.' },
      { status: 500 },
    )
  }
}
