'use client'

import { formatErrorMessage } from '../utils/errors'

type Props = {
  isConnected: boolean
  aaWalletAddress: string
  topupToken: string
  topupAmount: string
  setTopupAmount: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
  error?: { message?: string } | null
  txHash: string | null
}

export default function TopupCard({
  isConnected,
  aaWalletAddress,
  topupToken,
  topupAmount,
  setTopupAmount,
  onSubmit,
  isPending,
  error,
  txHash,
}: Props) {
  return (
    <section className="rounded-2xl border border-amber-100/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(120,83,42,0.08)] backdrop-blur">
      <h2 className="text-lg font-semibold text-amber-900">AA 钱包充值</h2>
      <p className="mt-1 text-sm text-gray-600">从 owner 向 AA 钱包转入 ERC20。</p>
      <div className="mt-2 text-sm text-gray-700">
        代币：{topupToken}（Test USD / USDT）
      </div>
      <form className="mt-4 grid gap-3 w-full" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          金额
          <input
            value={topupAmount}
            onChange={(event) => setTopupAmount(event.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={!isConnected || isPending || !aaWalletAddress}
          className={`w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 ${
            !isConnected || isPending || !aaWalletAddress
              ? 'cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          {isPending ? '提交中...' : '充值'}
        </button>
        {isConnected && error?.message ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formatErrorMessage(error.message)}
          </div>
        ) : null}
        {isConnected && txHash ? (
          <a
            href={`https://testnet.kitescan.ai/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-green-700 break-all underline decoration-amber-400 underline-offset-4"
          >
            已提交：{txHash}
          </a>
        ) : null}
      </form>
    </section>
  )
}
