import { GokiteAASDK } from 'gokite-aa-sdk'
import { createPublicClient, http, isAddress } from 'viem'

const NETWORK = 'kite_testnet'
const RPC_URL = 'https://rpc-testnet.gokite.ai'
const BUNDLER_URL = 'https://bundler-service.staging.gokite.ai/rpc/'

const client = createPublicClient({
  transport: http(RPC_URL),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner')

  if (!owner || !isAddress(owner)) {
    return Response.json({ error: 'Invalid owner address.' }, { status: 400 })
  }

  try {
    const sdk = new GokiteAASDK(NETWORK, RPC_URL, BUNDLER_URL)
    const address = sdk.getAccountAddress(owner) as `0x${string}`
    const bytecode = await client.getBytecode({ address })
    return Response.json({ address, deployed: !!bytecode })
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : 'Server error.' },
      { status: 500 },
    )
  }
}
