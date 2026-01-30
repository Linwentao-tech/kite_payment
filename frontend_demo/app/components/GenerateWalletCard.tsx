'use client'

type Props = {
  isConnected: boolean
  status: 'idle' | 'loading' | 'deployed' | 'counterfactual'
  address: string
  onGenerate: () => void
}

export default function GenerateWalletCard({
  isConnected,
  status,
  address,
  onGenerate,
}: Props) {
  return (
    <section className="rounded-2xl border border-amber-100/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(120,83,42,0.08)] backdrop-blur">
      <h2 className="text-lg font-semibold text-amber-900">生成 AA 钱包</h2>
      <p className="mt-1 text-sm text-gray-600">
        使用 owner 钱包生成 AA 地址；如果已部署会显示状态。
      </p>
      <div className="mt-4 flex items-center gap-3">
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
    </section>
  )
}
