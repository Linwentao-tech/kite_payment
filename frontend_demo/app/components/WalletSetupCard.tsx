'use client'

import { formatErrorMessage } from '../utils/errors'

type Props = {
  isConnected: boolean
  status: 'idle' | 'loading' | 'deployed' | 'counterfactual'
  address: string
  onGenerate: () => void
  balanceLabel: string
  balanceStatus: 'idle' | 'loading' | 'ready' | 'error'
  balanceError: string | null
  topupStatus: 'idle' | 'pending' | 'success' | 'failed'
  topupToken: string
  topupAmount: string
  setTopupAmount: (value: string) => void
  onTopup: (event: React.FormEvent<HTMLFormElement>) => void
  isTopupPending: boolean
  topupError?: { message?: string } | null
  topupTxHash: string | null
}

export default function WalletSetupCard({
  isConnected,
  status,
  address,
  onGenerate,
  balanceLabel,
  balanceStatus,
  balanceError,
  topupStatus,
  topupToken,
  topupAmount,
  setTopupAmount,
  onTopup,
  isTopupPending,
  topupError,
  topupTxHash,
}: Props) {
  return (
    <section className="rounded-2xl border border-amber-100/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(120,83,42,0.08)] backdrop-blur">
      <h2 className="text-lg font-semibold text-amber-900">AA 钱包准备</h2>
      <p className="mt-1 text-sm text-gray-600">
        生成 AA 地址并向 AA 钱包充值测试 USDT。
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!isConnected || status === 'loading'}
          onClick={onGenerate}
          className={`rounded-md border border-gray-200 bg-white px-3.5 py-2.5 ${
            !isConnected || status === 'loading'
              ? 'cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          {status === 'loading' ? '正在检查...' : '生成 AA 钱包'}
        </button>
        {isConnected && status === 'deployed' ? (
          <span className="text-sm text-green-700">已部署</span>
        ) : null}
        {isConnected && status === 'counterfactual' ? (
          <span className="text-sm text-yellow-700">未部署</span>
        ) : null}
      </div>

      {isConnected && address ? (
        <div className="mt-2 text-sm text-gray-800 break-all">
          AA 钱包：{address}
        </div>
      ) : null}

      <div className="mt-3 rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2 text-sm text-amber-900">
        余额（Test USD / USDT）：
        <span className="ml-2 font-semibold">
          {balanceStatus === 'loading'
            ? '加载中...'
            : balanceStatus === 'error'
            ? balanceError ?? '读取失败'
            : balanceLabel}
        </span>
      </div>

      <div className="mt-4 text-sm text-gray-700">
        代币：{topupToken}（Test USD / USDT）
      </div>
      <form className="mt-3 grid gap-3 w-full" onSubmit={onTopup}>
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
          disabled={!isConnected || isTopupPending || !address}
          className={`w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 ${
            !isConnected || isTopupPending || !address
              ? 'cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          {isTopupPending ? '提交中...' : '充值'}
        </button>
        {topupStatus !== 'idle' ? (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              topupStatus === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : topupStatus === 'failed'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {topupStatus === 'pending'
              ? '充值处理中...'
              : topupStatus === 'success'
              ? '充值成功。'
              : '充值失败。'}
          </div>
        ) : null}
        {isConnected && topupError?.message ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formatErrorMessage(topupError.message)}
          </div>
        ) : null}
        {isConnected && topupTxHash ? (
          <a
            href={`https://testnet.kitescan.ai/tx/${topupTxHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-green-700 break-all underline decoration-amber-400 underline-offset-4"
          >
            已提交：{topupTxHash}
          </a>
        ) : null}
      </form>
    </section>
  )
}
