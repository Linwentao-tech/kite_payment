'use client'

import { useEffect, useState } from 'react'
import { isAddress, parseUnits } from 'viem'
import { useConnection, usePublicClient, useWriteContract } from 'wagmi'
import WalletHeader from './components/WalletHeader'
import GenerateWalletCard from './components/GenerateWalletCard'
import MasterBudgetCard from './components/MasterBudgetCard'
import CreateSessionCard from './components/CreateSessionCard'
import TopupCard from './components/TopupCard'
import ExecuteTransferCard from './components/ExecuteTransferCard'
import { decodeCustomError, extractErrorDetails } from './utils/errors'

export default function Home() {
  const connection = useConnection()
  const { isConnected } = connection
  const [mounted, setMounted] = useState(false)
  const {
    mutateAsync: writeContractAsync,
    isPending: isMasterPending,
    error: masterError,
  } = useWriteContract()
  const {
    mutateAsync: createSessionAsync,
    isPending: isSessionPending,
    error: sessionError,
  } = useWriteContract()
  const publicClient = usePublicClient()
  const [aaWalletAddress, setAaWalletAddress] = useState('')
  const [aaWalletStatus, setAaWalletStatus] = useState<
    'idle' | 'loading' | 'deployed' | 'counterfactual'
  >('idle')
  const [aaWalletError, setAaWalletError] = useState<string | null>(null)
  const [dailyBudget, setDailyBudget] = useState('1000')
  const [perTxBudget, setPerTxBudget] = useState('100')
  const [timeWindowSec, setTimeWindowSec] = useState('86400')
  const [txHash, setTxHash] = useState<string | null>(null)
  const [masterValidationError, setMasterValidationError] = useState<
    string | null
  >(null)
  const [agentAddress, setAgentAddress] = useState('')
  const [sessionDailyBudget, setSessionDailyBudget] = useState('100')
  const [sessionPerTxBudget, setSessionPerTxBudget] = useState('10')
  const [sessionTxHash, setSessionTxHash] = useState<string | null>(null)
  const [sessionValidationError, setSessionValidationError] = useState<
    string | null
  >(null)
  const [lastSessionId, setLastSessionId] = useState<string | null>(null)
  const [transferRecipient, setTransferRecipient] = useState('')
  const [transferAmount, setTransferAmount] = useState('0.01')
  const [validForSec, setValidForSec] = useState('3600')
  const [executeTxHash, setExecuteTxHash] = useState<string | null>(null)
  const [executeErrorDetails, setExecuteErrorDetails] = useState<string | null>(
    null,
  )
  const [executeStatus, setExecuteStatus] = useState<
    'idle' | 'pending' | 'success' | 'failed'
  >('idle')
  const topupToken = '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63'
  const [topupAmount, setTopupAmount] = useState('0.1')
  const [topupTxHash, setTopupTxHash] = useState<string | null>(null)
  const {
    mutateAsync: topupAsync,
    isPending: isTopupPending,
    error: topupError,
  } = useWriteContract()
  const {
    mutateAsync: executeTransferAsync,
    isPending: isExecutePending,
    error: executeError,
  } = useWriteContract()

  const fetchAaWallet = async () => {
    setAaWalletError(null)
    setAaWalletStatus('loading')
    try {
      if (!connection.address) {
        throw new Error('请先连接 owner 钱包。')
      }
      const response = await fetch(
        `/api/aa-wallet?owner=${connection.address}`,
      )
      if (!response.ok) {
        const errorBody = await response.json().catch(() => null)
        throw new Error(errorBody?.error ?? '获取 AA 钱包失败。')
      }
      const data = (await response.json()) as {
        address: `0x${string}`
        deployed: boolean
      }
      setAaWalletAddress(data.address)
      setAaWalletStatus(data.deployed ? 'deployed' : 'counterfactual')
    } catch (err) {
      setAaWalletStatus('idle')
      setAaWalletError(
        err instanceof Error ? err.message : '获取状态失败。',
      )
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (!isConnected) return
    if (aaWalletAddress) return
    if (aaWalletStatus !== 'idle') return
    fetchAaWallet()
  }, [mounted, isConnected, aaWalletAddress, aaWalletStatus])

  useEffect(() => {
    if (!mounted || isConnected) return
    setAaWalletAddress('')
    setAaWalletStatus('idle')
    setAaWalletError(null)
    setTxHash(null)
    setMasterValidationError(null)
    setAgentAddress('')
    setSessionTxHash(null)
    setLastSessionId(null)
    setSessionValidationError(null)
    setTopupAmount('0.1')
    setTopupTxHash(null)
    setTransferRecipient('')
    setTransferAmount('0.01')
    setValidForSec('3600')
    setExecuteTxHash(null)
    setExecuteErrorDetails(null)
    setExecuteStatus('idle')
  }, [isConnected, mounted])

  if (!mounted) return null

  const budgetAbi = [
    {
      type: 'function',
      name: 'setMasterBudgetRules',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'timeWindows', type: 'uint256[]' },
        { name: 'budgets', type: 'uint160[]' },
      ],
      outputs: [],
    },
  ] as const
  const sessionAbi = [
    {
      type: 'function',
      name: 'createSession',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'sessionId', type: 'bytes32' },
        { name: 'agent', type: 'address' },
        {
          name: 'rules',
          type: 'tuple[]',
          components: [
            { name: 'timeWindow', type: 'uint256' },
            { name: 'budget', type: 'uint160' },
            { name: 'initialWindowStartTime', type: 'uint96' },
            { name: 'targetProviders', type: 'bytes32[]' },
          ],
        },
      ],
      outputs: [],
    },
  ] as const
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
  const erc20Abi = [
    {
      type: 'function',
      name: 'transfer',
      stateMutability: 'nonpayable',
      inputs: [
        { name: 'to', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ name: '', type: 'bool' }],
    },
  ] as const

  return (
    <main className="min-h-screen bg-[#f6efe7] px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-center justify-end gap-4">
          <WalletHeader />
        </header>

        {isConnected && aaWalletError ? (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {aaWalletError}
          </div>
        ) : null}

        <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <GenerateWalletCard
            isConnected={isConnected}
            status={aaWalletStatus}
            address={aaWalletAddress}
            onGenerate={fetchAaWallet}
          />
          <MasterBudgetCard
            isConnected={isConnected}
            aaWalletAddress={aaWalletAddress}
            aaWalletStatus={aaWalletStatus}
            dailyBudget={dailyBudget}
            perTxBudget={perTxBudget}
            timeWindowSec={timeWindowSec}
            setDailyBudget={(value) => {
              setDailyBudget(value)
              setMasterValidationError(null)
            }}
            setPerTxBudget={(value) => {
              setPerTxBudget(value)
              setMasterValidationError(null)
            }}
            setTimeWindowSec={(value) => {
              setTimeWindowSec(value)
              setMasterValidationError(null)
            }}
            onSubmit={async (event) => {
              event.preventDefault()
              if (!isConnected) return
              setTxHash(null)
              setMasterValidationError(null)
              const timeWindow = BigInt(Number(timeWindowSec || '0'))
              const zero = BigInt(0)
              const daily = parseUnits(dailyBudget || '0', 18)
              const perTx = parseUnits(perTxBudget || '0', 18)
              if (daily < perTx) {
                setMasterValidationError('每日预算不能小于单笔预算。')
                return
              }
              try {
                const hash = await writeContractAsync({
                  address: aaWalletAddress as `0x${string}`,
                  abi: budgetAbi,
                  functionName: 'setMasterBudgetRules',
                  args: [[timeWindow, zero], [daily, perTx]],
                })
                setTxHash(hash)
              } catch {
                // handled by error UI
              }
            }}
            isPending={isMasterPending}
            error={masterError}
            validationError={masterValidationError}
            txHash={txHash}
          />
          <CreateSessionCard
            isConnected={isConnected}
            aaWalletAddress={aaWalletAddress}
            agentAddress={agentAddress}
            sessionDailyBudget={sessionDailyBudget}
            sessionPerTxBudget={sessionPerTxBudget}
            setAgentAddress={(value) => {
              setAgentAddress(value)
              setSessionValidationError(null)
            }}
            setSessionDailyBudget={(value) => {
              setSessionDailyBudget(value)
              setSessionValidationError(null)
            }}
            setSessionPerTxBudget={(value) => {
              setSessionPerTxBudget(value)
              setSessionValidationError(null)
            }}
            onSubmit={async (event) => {
              event.preventDefault()
              if (!isConnected) return
              if (!aaWalletAddress || !isAddress(aaWalletAddress)) return
              if (!isAddress(agentAddress)) return
              setSessionTxHash(null)
              setSessionValidationError(null)
              const nowSec = Math.floor(Date.now() / 1000)
              const dayStart = Math.floor(nowSec / 86400) * 86400
              const dayWindow = BigInt(86400)
              const perTxWindow = BigInt(0)
              const daily = parseUnits(sessionDailyBudget || '0', 18)
              const perTx = parseUnits(sessionPerTxBudget || '0', 18)
              if (daily < perTx) {
                setSessionValidationError('每日预算不能小于单笔预算。')
                return
              }
              const sessionId = `0x${crypto
                .getRandomValues(new Uint8Array(32))
                .reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '')}` as `0x${string}`
              const rules = [
                {
                  timeWindow: dayWindow,
                  budget: daily,
                  initialWindowStartTime: BigInt(dayStart),
                  targetProviders: [],
                },
                {
                  timeWindow: perTxWindow,
                  budget: perTx,
                  initialWindowStartTime: BigInt(0),
                  targetProviders: [],
                },
              ]
              try {
                const hash = await createSessionAsync({
                  address: aaWalletAddress as `0x${string}`,
                  abi: sessionAbi,
                  functionName: 'createSession',
                  args: [sessionId, agentAddress as `0x${string}`, rules],
                })
                setSessionTxHash(hash)
                setLastSessionId(sessionId)
              } catch {
                // handled by error UI
              }
            }}
            isPending={isSessionPending}
            error={sessionError}
            validationError={sessionValidationError}
            txHash={sessionTxHash}
            lastSessionId={lastSessionId}
          />
          <TopupCard
            isConnected={isConnected}
            aaWalletAddress={aaWalletAddress}
            topupToken={topupToken}
            topupAmount={topupAmount}
            setTopupAmount={setTopupAmount}
            onSubmit={async (event) => {
              event.preventDefault()
              if (!isConnected) return
              if (!aaWalletAddress || !isAddress(aaWalletAddress)) return
              if (!isAddress(topupToken)) return
              setTopupTxHash(null)
              try {
                const amount = parseUnits(topupAmount || '0', 18)
                const hash = await topupAsync({
                  address: topupToken as `0x${string}`,
                  abi: erc20Abi,
                  functionName: 'transfer',
                  args: [aaWalletAddress as `0x${string}`, amount],
                })
                setTopupTxHash(hash)
              } catch {
                // handled by error UI
              }
            }}
            isPending={isTopupPending}
            error={topupError}
            txHash={topupTxHash}
          />
          <ExecuteTransferCard
            isConnected={isConnected}
            aaWalletAddress={aaWalletAddress}
            lastSessionId={lastSessionId}
            transferRecipient={transferRecipient}
            transferAmount={transferAmount}
            validForSec={validForSec}
            setTransferRecipient={setTransferRecipient}
            setTransferAmount={setTransferAmount}
            setValidForSec={setValidForSec}
            onSubmit={async (event) => {
              event.preventDefault()
              if (!isConnected) return
              if (!aaWalletAddress || !isAddress(aaWalletAddress)) return
              if (!lastSessionId) return
              if (!isAddress(transferRecipient)) return
              setExecuteTxHash(null)
              setExecuteErrorDetails(null)
              setExecuteStatus('pending')
              try {
                const nonce = `0x${crypto
                  .getRandomValues(new Uint8Array(32))
                  .reduce(
                    (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
                    '',
                  )}` as `0x${string}`
                const validBefore =
                  Math.floor(Date.now() / 1000) +
                  Math.max(0, Number(validForSec || '0'))
                const signResponse = await fetch('/api/agent-sign', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(
                    {
                      aaWallet: aaWalletAddress,
                      recipient: transferRecipient,
                      amount: transferAmount,
                      validBefore,
                      nonce,
                    },
                    (_, value) =>
                      typeof value === 'bigint' ? value.toString() : value,
                  ),
                })
                if (!signResponse.ok) {
                  const errorBody = await signResponse.json().catch(() => null)
                  throw new Error(errorBody?.error ?? '授权签名失败。')
                }
                const { signature, message } = (await signResponse.json()) as {
                  signature: `0x${string}`
                  message: {
                    from: `0x${string}`
                    to: `0x${string}`
                    token: `0x${string}`
                    value: string
                    validAfter: string
                    validBefore: string
                    nonce: `0x${string}`
                  }
                }
                const auth = {
                  from: message.from,
                  to: message.to,
                  token: message.token,
                  value: BigInt(message.value),
                  validAfter: BigInt(message.validAfter),
                  validBefore: BigInt(message.validBefore),
                  nonce: message.nonce,
                }
                const hash = await executeTransferAsync({
                  address: aaWalletAddress as `0x${string}`,
                  abi: executeAbi,
                  functionName: 'executeTransferWithAuthorization',
                  args: [lastSessionId as `0x${string}`, auth, signature, '0x'],
                })
                setExecuteTxHash(hash)
                if (publicClient) {
                  const receipt = await publicClient.waitForTransactionReceipt({
                    hash,
                  })
                  if (receipt.status === 'success') {
                    setExecuteStatus('success')
                  } else {
                    setExecuteStatus('failed')
                    try {
                      await publicClient.simulateContract({
                        address: aaWalletAddress as `0x${string}`,
                        abi: executeAbi,
                        functionName: 'executeTransferWithAuthorization',
                        args: [
                          lastSessionId as `0x${string}`,
                          auth,
                          signature,
                          '0x',
                        ],
                        account: connection.address as `0x${string}`,
                      })
                    } catch (simErr) {
                      const decoded = decodeCustomError(simErr)
                      const details = extractErrorDetails(simErr)
                      setExecuteErrorDetails(
                        decoded ?? details ?? null,
                      )
                    }
                  }
                } else {
                  setExecuteStatus('success')
                }
              } catch (err) {
                const decoded = decodeCustomError(err)
                const details = extractErrorDetails(err)
                setExecuteErrorDetails(decoded ?? details ?? null)
                setExecuteStatus('failed')
              }
            }}
            isPending={isExecutePending}
            error={executeError}
            errorDetails={executeErrorDetails}
            status={executeStatus}
            txHash={executeTxHash}
          />
        </div>
      </div>
    </main>
  )
}
