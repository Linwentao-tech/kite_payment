'use client'

import { formatErrorMessage } from '../utils/errors'

type Props = {
  isConnected: boolean
  aaWalletAddress: string
  lastSessionId: string | null
  transferRecipient: string
  transferAmount: string
  validForSec: string
  setTransferRecipient: (value: string) => void
  setTransferAmount: (value: string) => void
  setValidForSec: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  isPending: boolean
  autoExecute?: boolean
  error?: { message?: string } | null
  errorDetails: string | null
  status: 'idle' | 'pending' | 'success' | 'failed'
  txHash: string | null
}

export default function ExecuteTransferCard({
  isConnected,
  aaWalletAddress,
  lastSessionId,
  transferRecipient,
  transferAmount,
  validForSec,
  setTransferRecipient,
  setTransferAmount,
  setValidForSec,
  onSubmit,
  isPending,
  autoExecute = false,
  error,
  errorDetails,
  status,
  txHash,
}: Props) {
  const normalizedError =
    error?.message && errorDetails && error.message === errorDetails
      ? errorDetails
      : errorDetails ?? error?.message ?? null

  return (
    <section className="rounded-2xl border border-amber-100/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(120,83,42,0.08)] backdrop-blur">
      <h2 className="text-lg font-semibold text-amber-900">
        测试 Agent 支付功能（遵循日/单笔消费规则与 AA 全局预算）
      </h2>
      <p className="mt-1 text-sm text-gray-600">服务器使用 agent 私钥签名，agent自动发起执行。</p>
      <form className="mt-4 grid gap-3 w-full" onSubmit={onSubmit}>
        <label className="grid gap-1 text-sm">
          接收地址
          <input
            value={transferRecipient}
            onChange={(event) => setTransferRecipient(event.target.value)}
            placeholder="0x..."
            className="w-full rounded-md border border-gray-200 px-3 py-2"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="grid gap-1 text-sm">
            金额（USDT）
            <input
              value={transferAmount}
              onChange={(event) => setTransferAmount(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
          </label>
          <label className="grid gap-1 text-sm">
            有效期（秒）
            <input
              value={validForSec}
              onChange={(event) => setValidForSec(event.target.value)}
              className="w-full rounded-md border border-gray-200 px-3 py-2"
            />
          </label>
        </div>
        {!autoExecute ? (
          <button
            type="submit"
            disabled={!isConnected || isPending || !aaWalletAddress || !lastSessionId}
            className={`w-full rounded-md border border-gray-200 bg-white px-3.5 py-2.5 ${
              !isConnected || isPending || !aaWalletAddress || !lastSessionId
                ? 'cursor-not-allowed'
                : 'cursor-pointer'
            }`}
          >
            {isPending ? '提交中...' : '执行转账'}
          </button>
        ) : (
          <div className="rounded-md border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-600">
            Agent自动执行
          </div>
        )}
        {isConnected && normalizedError ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {formatErrorMessage(normalizedError)}
          </div>
        ) : null}
        {isConnected && status !== 'idle' ? (
          <div
            className={`rounded-md border px-3 py-2 text-sm ${
              status === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : status === 'failed'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-amber-200 bg-amber-50 text-amber-800'
            }`}
          >
            {status === 'pending'
              ? '交易处理中...'
              : status === 'success'
              ? '交易成功。'
              : '交易失败。'}
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
