'use client'

import { formatErrorMessage } from '../utils/errors'

type Props = {
  isConnected: boolean
  aaWalletAddress: string
  aaWalletStatus: 'idle' | 'loading' | 'deployed' | 'counterfactual'
  dailyBudget: string
  perTxBudget: string
  timeWindowSec: string
  setDailyBudget: (value: string) => void
  setPerTxBudget: (value: string) => void
  setTimeWindowSec: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
  error?: { message?: string } | null
  validationError?: string | null
  txHash: string | null
}

export default function MasterBudgetCard({
  isConnected,
  aaWalletAddress,
  aaWalletStatus,
  dailyBudget,
  perTxBudget,
  timeWindowSec,
  setDailyBudget,
  setPerTxBudget,
  setTimeWindowSec,
  onSubmit,
  isPending,
  error,
  validationError,
  txHash,
}: Props) {
  return (
    <section className="rounded-2xl border border-amber-100/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(120,83,42,0.08)] backdrop-blur">
      <h2 className="text-lg font-semibold text-amber-900">设置主预算规则</h2>
      <p className="mt-1 text-sm text-gray-600">
        owner 连接钱包后设置 AA 钱包的全局预算规则。
      </p>
      <form className="mt-4 grid gap-3 w-full" onSubmit={onSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            每日预算（USDT）
            <input
              value={dailyBudget}
              onChange={(event) => setDailyBudget(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            单笔预算（USDT）
            <input
              value={perTxBudget}
              onChange={(event) => setPerTxBudget(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
          </label>
        </div>
        <label className="grid gap-1 text-sm">
          时间窗口（秒）
          <input
            value={timeWindowSec}
            onChange={(event) => setTimeWindowSec(event.target.value)}
            className="w-full rounded-md border border-gray-200 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={
            !isConnected ||
            isPending ||
            !aaWalletAddress ||
            aaWalletStatus === 'loading'
          }
          className={`w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 ${
            !isConnected ||
            isPending ||
            !aaWalletAddress ||
            aaWalletStatus === 'loading'
              ? 'cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          {isPending ? '提交中...' : '设置主预算规则'}
        </button>
        {isConnected && validationError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {validationError}
          </div>
        ) : null}
        {isConnected && !validationError && error?.message ? (
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
