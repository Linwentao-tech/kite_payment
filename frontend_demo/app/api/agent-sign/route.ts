import { isAddress, parseUnits, type Hex } from 'viem'
import { privateKeyToAccount } from 'viem/accounts'

const CHAIN_ID = 2368
const TOKEN_ADDRESS = '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63'

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

  const { aaWallet, recipient, amount, validBefore, nonce } = body
  const token = body.token ?? TOKEN_ADDRESS

  if (!isAddress(aaWallet) || !isAddress(recipient) || !isAddress(token)) {
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

    return Response.json({
      signature,
      message: {
        ...message,
        value: message.value.toString(),
        validAfter: message.validAfter.toString(),
        validBefore: message.validBefore.toString(),
      },
    })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Signing failed.' },
      { status: 500 },
    )
  }
}
