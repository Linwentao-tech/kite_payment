'use client'

import { useEffect, useState } from 'react'
import {
  useConnect,
  useConnection,
  useConnectors,
  useDisconnect,
  useEnsAvatar,
  useEnsName,
} from 'wagmi'

function WalletOptions() {
  const { mutate: connect } = useConnect()
  const connectors = useConnectors()
  const metaMaskConnector = connectors.find(
    (connector) =>
      connector.id === 'metaMask' ||
      connector.id === 'metamask' ||
      connector.name.toLowerCase().includes('metamask'),
  )
  const injectedConnector = connectors.find(
    (connector) => connector.id === 'injected',
  )
  const [hasMetaMask, setHasMetaMask] = useState(false)

  useEffect(() => {
    const ethereum = (window as { ethereum?: { isMetaMask?: boolean } })
      .ethereum
    setHasMetaMask(!!ethereum?.isMetaMask)
  }, [])

  const activeConnector = metaMaskConnector ?? (hasMetaMask ? injectedConnector : undefined)

  return (
    <div className="grid gap-2">
      <button
        onClick={() => {
          if (activeConnector) connect({ connector: activeConnector })
        }}
        disabled={!activeConnector}
        className={`rounded-md border border-gray-200 bg-white px-3.5 py-2.5 ${
          activeConnector ? 'cursor-pointer' : 'cursor-not-allowed'
        }`}
      >
        连接钱包
      </button>
      {!activeConnector ? (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          未检测到钱包。
        </div>
      ) : null}
    </div>
  )
}

function Connection() {
  const connection = useConnection()
  const { mutate: disconnect } = useDisconnect()
  const { data: ensName } = useEnsName({ address: connection.address })
  const { data: ensAvatar } = useEnsAvatar({ name: ensName ?? undefined })

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2.5">
        {ensAvatar ? (
          <img
            alt="ENS 头像"
            src={ensAvatar}
            className="h-8 w-8 rounded-full"
          />
        ) : null}
        {connection.address ? (
          <div className="text-sm">
            {ensName ? `${ensName} (${connection.address})` : connection.address}
          </div>
        ) : null}
      </div>
      <button
        onClick={() => disconnect()}
        className="rounded-md border border-gray-200 bg-white px-3.5 py-2.5"
      >
        断开连接
      </button>
    </div>
  )
}

export default function WalletHeader() {
  const { isConnected } = useConnection()
  return isConnected ? <Connection /> : <WalletOptions />
}
