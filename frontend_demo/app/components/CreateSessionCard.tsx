'use client'

import { formatErrorMessage } from '../utils/errors'

type Props = {
  isConnected: boolean
  aaWalletAddress: string
  agentAddress: string
  sessionDailyBudget: string
  sessionPerTxBudget: string
  setAgentAddress: (value: string) => void
  setSessionDailyBudget: (value: string) => void
  setSessionPerTxBudget: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
  error?: { message?: string } | null
  validationError?: string | null
  txHash: string | null
  lastSessionId: string | null
}

export default function CreateSessionCard({
  isConnected,
  aaWalletAddress,
  agentAddress,
  sessionDailyBudget,
  sessionPerTxBudget,
  setAgentAddress,
  setSessionDailyBudget,
  setSessionPerTxBudget,
  onSubmit,
  isPending,
  error,
  validationError,
  txHash,
  lastSessionId,
}: Props) {
  return (
    <section className="rounded-2xl border border-amber-100/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(120,83,42,0.08)] backdrop-blur">
      <h2 className="text-lg font-semibold text-amber-900">创建会话（授权 Agent）</h2>
      <p className="mt-1 text-sm text-gray-600">owner 授权 agent 的日/单笔消费规则。</p>
      <form className="mt-4 grid gap-3 w-full" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          Agent 地址
          <input
            value={agentAddress}
            onChange={(event) => setAgentAddress(event.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-gray-200 px-3 py-2"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            每日预算（USDT）
            <input
              value={sessionDailyBudget}
              onChange={(event) => setSessionDailyBudget(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            单笔预算（USDT）
            <input
              value={sessionPerTxBudget}
              onChange={(event) => setSessionPerTxBudget(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={!isConnected || isPending || !aaWalletAddress}
          className={`w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 ${
            !isConnected || isPending || !aaWalletAddress
              ? 'cursor-not-allowed'
              : 'cursor-pointer'
          }`}
        >
          {isPending ? '提交中...' : '创建会话'}
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
        {isConnected && lastSessionId ? (
          <div className="text-sm text-gray-700 break-all">会话 ID：{lastSessionId}</div>
        ) : null}
      </form>
    </section>
  )
}
