'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { formatUnits, isAddress, parseUnits } from 'viem'
import { useConnection, usePublicClient, useWriteContract } from 'wagmi'
import WalletHeader from './components/WalletHeader'
import WalletSetupCard from './components/WalletSetupCard'
import MasterBudgetCard from './components/MasterBudgetCard'
import CreateSessionCard from './components/CreateSessionCard'
import ExecuteTransferCard from './components/ExecuteTransferCard'
import { decodeCustomError, extractErrorDetails } from './utils/errors'

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
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const
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
  const [sessionTimeWindowSec, setSessionTimeWindowSec] = useState('86400')
  const [sessionTxHash, setSessionTxHash] = useState<string | null>(null)
  const [sessionValidationError, setSessionValidationError] = useState<
    string | null
  >(null)
  const [lastSessionId, setLastSessionId] = useState<string | null>(null)
  const [transferRecipient, setTransferRecipient] = useState('')
  const [transferAmount, setTransferAmount] = useState('0.01')
  const [validForSec, setValidForSec] = useState('3600')
  const [executeTxHash, setExecuteTxHash] = useState<string | null>(null)
  const [executeErrorMessage, setExecuteErrorMessage] = useState<string | null>(
    null,
  )
  const [executeErrorDetails, setExecuteErrorDetails] = useState<string | null>(
    null,
  )
  const [executeStatus, setExecuteStatus] = useState<
    'idle' | 'pending' | 'success' | 'failed'
  >('idle')
  const executeAutoKeyRef = useRef<string | null>(null)
  const [demoRepoUrl, setDemoRepoUrl] = useState('')
  const [demoRepoStatus, setDemoRepoStatus] = useState<
    'idle' | 'invalid' | 'checking' | 'connected'
  >('idle')
  const [demoAgentProgress, setDemoAgentProgress] = useState<number[]>([
    0, 0, 0, 0,
  ])
  const [demoAgentDurations, setDemoAgentDurations] = useState<number[]>([
    0, 0, 0, 0,
  ])
  const [demoAgentDelays, setDemoAgentDelays] = useState<number[]>([
    0, 0, 0, 0,
  ])
  const [demoAgentElapsed, setDemoAgentElapsed] = useState<number[]>([
    0, 0, 0, 0,
  ])
  const [demoSummaryStatus, setDemoSummaryStatus] = useState<
    'idle' | 'running' | 'done'
  >('idle')
  const [demoSummaryElapsed, setDemoSummaryElapsed] = useState(0)
  const [demoSummaryDuration, setDemoSummaryDuration] = useState(0)
  const [demoDeepAuditStatus, setDemoDeepAuditStatus] = useState<
    'idle' | 'running' | 'done'
  >('idle')
  const [demoDeepAuditElapsed, setDemoDeepAuditElapsed] = useState(0)
  const [demoDeepAuditDuration, setDemoDeepAuditDuration] = useState(0)
  const [demoFinalSummaryStatus, setDemoFinalSummaryStatus] = useState<
    'idle' | 'running' | 'done'
  >('idle')
  const [demoFinalSummaryElapsed, setDemoFinalSummaryElapsed] = useState(0)
  const [demoFinalSummaryDuration, setDemoFinalSummaryDuration] = useState(0)
  const [valuePrompt, setValuePrompt] = useState('')
  const [valueFeedback, setValueFeedback] = useState('')
  const [valueStatus, setValueStatus] = useState<
    'idle' | 'thinking' | 'proposal' | 'feedback' | 'approved' | 'paid'
  >('idle')
  const [valueNextStatus, setValueNextStatus] = useState<
    'proposal' | 'feedback'
  >('proposal')
  const [valueNextIndex, setValueNextIndex] = useState(0)
  const [valueProgress, setValueProgress] = useState(0)
  const [valueElapsed, setValueElapsed] = useState(0)
  const [valueDuration, setValueDuration] = useState(0)
  const [valuePlan, setValuePlan] = useState<string[]>([])
  const [valueBudget, setValueBudget] = useState<string | null>(null)
  const [valueOption, setValueOption] = useState<string | null>(null)
  const [valueLogText, setValueLogText] = useState('')
  const [valuePayStatus, setValuePayStatus] = useState<
    'idle' | 'pending' | 'success'
  >('idle')
  const [valueAuditTier, setValueAuditTier] = useState<
    'simple' | 'balanced' | 'strict'
  >('balanced')
  const [valueBudgetInput, setValueBudgetInput] = useState('200')
  const [demoPaymentStatus, setDemoPaymentStatus] = useState<
    'idle' | 'pending' | 'success' | 'failed'
  >('idle')
  const [demoPaymentTxHash, setDemoPaymentTxHash] = useState<string | null>(null)
  const [demoPaymentError, setDemoPaymentError] = useState<string | null>(null)
  const demoPaymentAutoStartedRef = useRef(false)
  const [auditTier, setAuditTier] = useState<'simple' | 'balanced' | 'strict'>(
    'balanced',
  )
  const [auditModules, setAuditModules] = useState<string[]>([
    'static',
    'economic',
    'governance',
    'integration',
  ])
  const [auditIterations, setAuditIterations] = useState('3')
  const [auditPrompt, setAuditPrompt] = useState('')
  const [auditConfirmed, setAuditConfirmed] = useState(false)
  const [rebateFile, setRebateFile] = useState<File | null>(null)
  const [rebateStatus, setRebateStatus] = useState<
    'idle' | 'pending' | 'success' | 'failed'
  >('idle')
  const demoAgentLogs = useMemo(
    () => [
      [
        '[init] loading repo graph...',
        '[scan] reentrancy/authorization/overflow checks...',
        '[thinking] i need to map call paths, then correlate risky opcodes with state-changing writes...',
        '[scan] unsafe delegatecall & unchecked calls...',
        '[thinking] i need to expand taint sources & sinks, then verify they do not reach privileged functions...',
        '[scan] storage write hazards & invariant breaks...',
        '[scan] unchecked external returns & silent failures...',
        '[thinking] i need to correlate findings across modules and confirm the exploit preconditions...',
        '[report] aggregating high-risk findings...',
        '[report] drafting remediation suggestions...',
        '[report] prioritizing fixes by severity...',
      ],
      [
        '[init] parsing value flow & state transitions...',
        '[thinking] i need to model mint/redeem/liquidation bounds to locate the break-even region...',
        '[scan] MEV/price manipulation vectors...',
        '[thinking] i need to stress-test edge cases and caps to observe liquidation tipping points...',
        '[scan] oracle latency & sandwich exposure...',
        '[scan] slippage bounds & price impact checks...',
        '[thinking] i need to simulate adverse price paths to quantify worst-case solvency...',
        '[scan] liquidation cascading risk review...',
        '[scan] incentive misalignment & griefing vectors...',
        '[report] outputting economic risk scenarios...',
        '[report] recommending guardrails & circuit breakers...',
        '[report] summarizing parameter sensitivity...',
        '[report] flagging critical parameter thresholds...',
        '[report] cross-checking with historical incidents...',
      ],
      [
        '[init] enumerating owner/role/proxy entrypoints...',
        '[scan] privileged pause/blacklist impact...',
        '[thinking] i need to trace timelock/upgrade authority to confirm time delay guarantees...',
        '[scan] single-admin & emergency paths...',
        '[thinking] i need to verify access control coverage across modules and admin boundaries...',
        '[scan] initializer access & upgrade rollback risks...',
        '[thinking] i need to check governance delay guarantees against emergency bypasses...',
        '[scan] role renounce/transfer edge cases...',
        '[report] governance risk summary...',
        '[report] required multisig/threshold guidance...',
        '[report] escalation & recovery playbook...',
      ],
      [
        '[init] resolving external deps & trust boundaries...',
        '[thinking] i need to assess dependency pinning and upgrade risks to avoid silent behavior changes...',
        '[scan] external call failure handling...',
        '[thinking] i need to validate oracle/bridge input reliability and failure modes...',
        '[scan] third-party change impact...',
        '[thinking] i need to review fallback paths and degraded modes under partial outages...',
        '[scan] upstream dependency liveness checks...',
        '[scan] cross-domain message assumptions...',
        '[report] integration & availability risks...',
        '[report] recommending fallback strategies...',
        '[report] validating SLA & monitoring hooks...',
        '[report] documenting third-party assumptions...',
        '[report] export dependency risk matrix...',
      ],
    ],
    [],
  )
  const isDemoRepoUrlValid =
    demoRepoUrl === '' ||
    /^https?:\/\/(www\.)?(github\.com|gitlab\.com)\/.+/i.test(demoRepoUrl)
  const isDemoEnabled = isConnected && !!lastSessionId
  const allAgentsDone =
    demoRepoStatus === 'connected' &&
    demoAgentProgress.every((value) => value >= 100)
  const demoSummaryLogs = useMemo(
    () => [
      '[init] collecting agent outputs & evidence...',
      '[thinking] i need to normalize findings and de-duplicate overlaps...',
      '[thinking] i need to prioritize by impact + exploitability...',
      '[scan] validating cross-agent consistency...',
      '[thinking] i need to resolve conflicts and finalize severity bands...',
      '[report] composing structured audit summary...',
      '[report] generating remediation checklist...',
    ],
    [],
  )
  const demoServiceLogs = useMemo(
    () => [
      '[init] payment confirmed, contacting professional audit service...',
      '[fetch] retrieving service scope & SLA terms...',
      '[fetch] pulling preliminary findings package...',
      '[fetch] validating signatures & evidence bundle...',
      '[fetch] ingesting remediation notes & diffs...',
      '[fetch] normalizing severity taxonomy...',
    ],
    [],
  )
  const demoFinalSummaryLogs = useMemo(
    () => [
      '[init] merging in professional audit findings...',
      '[thinking] i need to reconcile deltas and confirm remediation status...',
      '[thinking] i need to recompute overall risk score post-fixes...',
      '[scan] validating final severity distribution...',
      '[thinking] i need to compile final structured report sections...',
      '[report] publishing final audit summary...',
    ],
    [],
  )
  const valueChainTemplates = useMemo(
    () => [
      {
        label: 'Fastest',
        budget: '189 USDT',
        steps: [
          'Requirement Parsing Agent',
          'Risk Classification Agent',
          'Rapid Audit Agent',
          'Summary & Recommendation Agent',
        ],
      },
      {
        label: 'Lowest Cost',
        budget: '128 USDT',
        steps: [
          'Requirement Parsing Agent',
          'Coverage Agent',
          'Lightweight Audit Agent',
        ],
      },
      {
        label: 'Highest Score',
        budget: '238 USDT',
        steps: [
          'Requirement Parsing Agent',
          'Static Analysis Agent',
          'Economic Model Agent',
          'Governance Agent',
          'Integration Review Agent',
        ],
      },
    ],
    [],
  )
  const valueStageLogs = useMemo(
    () => [
      '[init] parsing user requirements and scope constraints...',
      '[think] decomposing into executable agent capabilities...',
      '[scan] searching available agents and resource pools...',
      '[compose] assembling candidate agent chains...',
      '[calc] estimating budget and time...',
      '[rank] ranking by cost, speed, and overall score...',
      '[report] generating recommended plan and budget...',
    ],
    [],
  )
  const demoPaymentRecipient = '0xa35DF472950D7A9A568D7Ac67310f365efd9C816'
  const demoPaymentAmount = '0.01'

  useEffect(() => {
    if (!isDemoEnabled || !auditConfirmed) {
      setDemoRepoStatus('idle')
      return
    }
    if (!demoRepoUrl) {
      setDemoRepoStatus('idle')
      return
    }
    if (!isDemoRepoUrlValid) {
      setDemoRepoStatus('invalid')
      return
    }
    setDemoRepoStatus('checking')
    const timer = setTimeout(() => {
      setDemoRepoStatus('connected')
    }, 3000)
    return () => clearTimeout(timer)
  }, [demoRepoUrl, isDemoRepoUrlValid, isDemoEnabled, auditConfirmed])

  useEffect(() => {
    if (demoRepoStatus !== 'connected') {
    setDemoAgentProgress([0, 0, 0, 0])
    setDemoAgentElapsed([0, 0, 0, 0])
    setDemoSummaryStatus('idle')
    setDemoSummaryElapsed(0)
    setDemoSummaryDuration(0)
    setDemoDeepAuditStatus('idle')
    setDemoDeepAuditElapsed(0)
    setDemoDeepAuditDuration(0)
    setDemoFinalSummaryStatus('idle')
    setDemoFinalSummaryElapsed(0)
    setDemoFinalSummaryDuration(0)
    setDemoPaymentStatus('idle')
    setDemoPaymentTxHash(null)
    setDemoPaymentError(null)
    demoPaymentAutoStartedRef.current = false
    return
  }
    setDemoAgentProgress([0, 0, 0, 0])
    const charIntervalMs = 75
    const durations = demoAgentLogs.map((logs) => {
      const base = 5000 + Math.floor(Math.random() * 5000)
      const textDuration = logs.join('\n').length * charIntervalMs
      return Math.max(base, textDuration)
    })
    const delays = Array.from({ length: 4 }, () =>
      Math.floor(Math.random() * 2000),
    )
    setDemoAgentDurations(durations)
    setDemoAgentDelays(delays)
    const startAt = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startAt
      const elapsedByAgent = durations.map((duration, index) => {
        const offset = delays[index] ?? 0
        const localElapsed = Math.max(0, elapsed - offset)
        return Math.min(duration, localElapsed)
      })
      setDemoAgentElapsed(elapsedByAgent)
      const nextProgress = durations.map((duration, index) =>
        Math.min(
          100,
          Math.round((elapsedByAgent[index] / duration) * 100),
        ),
      )
      setDemoAgentProgress(nextProgress)
      if (nextProgress.every((value) => value >= 100)) {
        clearInterval(interval)
      }
    }, 120)
    return () => clearInterval(interval)
  }, [demoRepoStatus])

  useEffect(() => {
    if (!allAgentsDone) {
      setDemoSummaryStatus('idle')
      setDemoSummaryElapsed(0)
      setDemoSummaryDuration(0)
      return
    }
    const charIntervalMs = 75
    const base = 3000 + Math.floor(Math.random() * 2000)
    const textDuration = demoSummaryLogs.join('\n').length * charIntervalMs
    const duration = Math.max(base, textDuration)
    setDemoSummaryDuration(duration)
    setDemoSummaryStatus('running')
    const startAt = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startAt
      setDemoSummaryElapsed(Math.min(duration, elapsed))
      if (elapsed >= duration) {
        setDemoSummaryStatus('done')
        clearInterval(interval)
      }
    }, 120)
    return () => clearInterval(interval)
  }, [allAgentsDone, demoSummaryLogs])

  useEffect(() => {
    if (demoPaymentStatus !== 'success') {
      setDemoDeepAuditStatus('idle')
      setDemoDeepAuditElapsed(0)
      setDemoDeepAuditDuration(0)
      setDemoFinalSummaryStatus('idle')
      setDemoFinalSummaryElapsed(0)
      setDemoFinalSummaryDuration(0)
      return
    }
    const charIntervalMs = 75
    const base = 4000 + Math.floor(Math.random() * 2000)
    const textDuration = demoServiceLogs.join('\n').length * charIntervalMs
    const duration = Math.max(base, textDuration)
    setDemoDeepAuditDuration(duration)
    setDemoDeepAuditStatus('running')
    const startAt = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startAt
      setDemoDeepAuditElapsed(Math.min(duration, elapsed))
      if (elapsed >= duration) {
        setDemoDeepAuditStatus('done')
        clearInterval(interval)
      }
    }, 120)
    return () => clearInterval(interval)
  }, [demoPaymentStatus, demoServiceLogs])

  useEffect(() => {
    if (demoSummaryStatus !== 'done') {
      setDemoPaymentStatus('idle')
      setDemoPaymentTxHash(null)
      setDemoPaymentError(null)
      demoPaymentAutoStartedRef.current = false
      return
    }
    if (demoPaymentAutoStartedRef.current) return
    demoPaymentAutoStartedRef.current = true
    let cancelled = false
    setDemoPaymentStatus('pending')
    setDemoPaymentTxHash(null)
    setDemoPaymentError(null)
    ;(async () => {
      try {
        if (!aaWalletAddress || !isAddress(aaWalletAddress)) {
          throw new Error('AA 钱包地址无效。')
        }
        if (!lastSessionId) {
          throw new Error('缺少 Session。')
        }
        if (!isAddress(demoPaymentRecipient)) {
          throw new Error('收款地址无效。')
        }
        const nonce = `0x${crypto
          .getRandomValues(new Uint8Array(32))
          .reduce(
            (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
            '',
          )}` as `0x${string}`
        const validBefore = Math.floor(Date.now() / 1000) + 3600
        const executeResponse = await fetch('/api/agent-execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(
            {
              aaWallet: aaWalletAddress,
              sessionId: lastSessionId,
              recipient: demoPaymentRecipient,
              amount: demoPaymentAmount,
              validBefore,
              nonce,
            },
            (_, value) => (typeof value === 'bigint' ? value.toString() : value),
          ),
        })
        if (!executeResponse.ok) {
          const errorBody = await executeResponse.json().catch(() => null)
          throw new Error(errorBody?.error ?? '授权签名失败。')
        }
        const { hash, simulationError } = (await executeResponse.json()) as {
          hash: `0x${string}`
          simulationError?: string | null
        }
        if (cancelled) return
        setDemoPaymentTxHash(hash)
        if (publicClient) {
          const receipt = await publicClient.waitForTransactionReceipt({
            hash,
          })
          if (cancelled) return
          if (receipt.status === 'success') {
            setDemoPaymentStatus('success')
          } else {
            setDemoPaymentStatus('failed')
            setDemoPaymentError(simulationError ?? '交易失败。')
          }
        } else {
          setDemoPaymentStatus('success')
        }
      } catch (err) {
        if (cancelled) return
        setDemoPaymentStatus('failed')
        const decoded = decodeCustomError(err)
        const details = extractErrorDetails(err)
        setDemoPaymentError(decoded ?? details ?? '支付失败。')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [
    demoSummaryStatus,
    aaWalletAddress,
    lastSessionId,
    demoPaymentAmount,
    demoPaymentRecipient,
    publicClient,
  ])

  useEffect(() => {
    if (valueStatus !== 'thinking') return
    const charIntervalMs = 60
    const fullText = valueStageLogs.join('\n')
    const duration = Math.max(4000, fullText.length * charIntervalMs)
    setValueDuration(duration)
    setValueElapsed(0)
    setValueProgress(0)
    let cancelled = false
    const startAt = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startAt
      if (cancelled) return
      setValueElapsed(Math.min(duration, elapsed))
      setValueProgress(Math.min(100, Math.round((elapsed / duration) * 100)))
      if (elapsed >= duration) {
        clearInterval(interval)
        const option = valueChainTemplates[valueNextIndex] ?? null
        setValuePlan(option ? option.steps : [])
        setValueBudget(option ? option.budget : null)
        setValueOption(option ? option.label : null)
        setValueStatus(valueNextStatus)
      }
    }, 120)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [valueStatus, valueStageLogs, valueChainTemplates, valueNextIndex, valueNextStatus])

  useEffect(() => {
    if (valueStatus !== 'proposal' && valueStatus !== 'feedback') return
    const fullText =
      valueStatus === 'proposal'
        ? valueStageLogs.join('\n')
        : `${valueStageLogs.join('\n')}\n[feedback] ${
            valueFeedback || 'Received feedback, recalculating plan...'
          }`
    const visibleChars = Math.min(
      fullText.length,
      Math.floor(valueElapsed / 60),
    )
    setValueLogText(fullText.slice(0, visibleChars))
  }, [valueStatus, valueElapsed, valueStageLogs, valueFeedback])

  useEffect(() => {
    if (valueStatus !== 'approved') return
    setValuePayStatus('pending')
    const timer = setTimeout(() => {
      setValuePayStatus('success')
      setValueStatus('paid')
    }, 2400)
    return () => clearTimeout(timer)
  }, [valueStatus])

  useEffect(() => {
    if (demoDeepAuditStatus !== 'done') {
      setDemoFinalSummaryStatus('idle')
      setDemoFinalSummaryElapsed(0)
      setDemoFinalSummaryDuration(0)
      return
    }
    const charIntervalMs = 75
    const base = 3000 + Math.floor(Math.random() * 2000)
    const textDuration = demoFinalSummaryLogs.join('\n').length * charIntervalMs
    const duration = Math.max(base, textDuration)
    setDemoFinalSummaryDuration(duration)
    setDemoFinalSummaryStatus('running')
    const startAt = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startAt
      setDemoFinalSummaryElapsed(Math.min(duration, elapsed))
      if (elapsed >= duration) {
        setDemoFinalSummaryStatus('done')
        clearInterval(interval)
      }
    }, 120)
    return () => clearInterval(interval)
  }, [demoDeepAuditStatus, demoFinalSummaryLogs])
  const topupToken = '0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63'
  const [topupAmount, setTopupAmount] = useState('0.1')
  const [topupTxHash, setTopupTxHash] = useState<string | null>(null)
  const [topupStatus, setTopupStatus] = useState<
    'idle' | 'pending' | 'success' | 'failed'
  >('idle')
  const [topupErrorMessage, setTopupErrorMessage] = useState<string | null>(
    null,
  )
  const [aaBalance, setAaBalance] = useState<string>('0')
  const [aaBalanceStatus, setAaBalanceStatus] = useState<
    'idle' | 'loading' | 'ready' | 'error'
  >('idle')
  const [aaBalanceError, setAaBalanceError] = useState<string | null>(null)
  const {
    mutateAsync: topupAsync,
    isPending: isTopupPending,
  } = useWriteContract()
  const isExecutePending = executeStatus === 'pending'

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

  const fetchAaBalance = async () => {
    if (!publicClient) return
    if (!aaWalletAddress || !isAddress(aaWalletAddress)) return
    if (!isAddress(topupToken)) return
    setAaBalanceStatus('loading')
    setAaBalanceError(null)
    try {
      const balance = (await publicClient.readContract({
        address: topupToken as `0x${string}`,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [aaWalletAddress as `0x${string}`],
      })) as bigint
      setAaBalance(formatUnits(balance, 18))
      setAaBalanceStatus('ready')
    } catch (err) {
      setAaBalanceStatus('error')
      setAaBalanceError(
        err instanceof Error ? err.message : '读取余额失败。',
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
    if (!mounted || !isConnected) return
    if (!aaWalletAddress || !isAddress(aaWalletAddress)) return
    fetchAaBalance()
  }, [mounted, isConnected, aaWalletAddress, topupToken, publicClient])

  useEffect(() => {
    if (!publicClient || !topupTxHash) return
    let cancelled = false
    ;(async () => {
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash: topupTxHash as `0x${string}`,
        })
        if (cancelled) return
        setTopupStatus(receipt.status === 'success' ? 'success' : 'failed')
        fetchAaBalance()
      } catch {
        if (cancelled) return
        setTopupStatus('failed')
        fetchAaBalance()
      }
    })()
    return () => {
      cancelled = true
    }
  }, [publicClient, topupTxHash])

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
    setSessionTimeWindowSec('86400')
    setTopupAmount('0.1')
    setTopupTxHash(null)
    setTopupStatus('idle')
    setTopupErrorMessage(null)
    setAaBalance('0')
    setAaBalanceStatus('idle')
    setAaBalanceError(null)
    setTransferRecipient('')
    setTransferAmount('0.01')
    setValidForSec('3600')
    setExecuteTxHash(null)
    setExecuteErrorDetails(null)
    setExecuteStatus('idle')
    setExecuteErrorMessage(null)
    executeAutoKeyRef.current = null
  }, [isConnected, mounted])

  const runExecuteTransfer = async () => {
    if (!isConnected) return
    if (!aaWalletAddress || !isAddress(aaWalletAddress)) return
    if (!lastSessionId) return
    if (!isAddress(transferRecipient)) return
    setExecuteTxHash(null)
    setExecuteErrorDetails(null)
    setExecuteErrorMessage(null)
    setExecuteStatus('pending')
    try {
      const nonce = `0x${crypto
        .getRandomValues(new Uint8Array(32))
        .reduce(
          (acc, byte) => acc + byte.toString(16).padStart(2, '0'),
          '',
        )}` as `0x${string}`
      const validBefore =
        Math.floor(Date.now() / 1000) + Math.max(0, Number(validForSec || '0'))
      const executeResponse = await fetch('/api/agent-execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          {
            aaWallet: aaWalletAddress,
            sessionId: lastSessionId,
            recipient: transferRecipient,
            amount: transferAmount,
            validBefore,
            nonce,
          },
          (_, value) => (typeof value === 'bigint' ? value.toString() : value),
        ),
      })
      if (!executeResponse.ok) {
        const errorBody = await executeResponse.json().catch(() => null)
        throw new Error(errorBody?.error ?? '授权签名失败。')
      }
      const { hash, simulationError } = (await executeResponse.json()) as {
        hash: `0x${string}`
        simulationError?: string | null
      }
      setExecuteTxHash(hash)
      if (publicClient) {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
        })
        if (receipt.status === 'success') {
          setExecuteStatus('success')
        } else {
          setExecuteStatus('failed')
          setExecuteErrorDetails(
            simulationError ?? '交易失败，可能被链上拒绝。',
          )
        }
      } else {
        setExecuteStatus('success')
      }
    } catch (err) {
      const decoded = decodeCustomError(err)
      const details = extractErrorDetails(err)
      setExecuteErrorMessage(err instanceof Error ? err.message : '执行失败。')
      setExecuteErrorDetails(decoded ?? details ?? null)
      setExecuteStatus('failed')
    }
  }

  useEffect(() => {
    if (!isConnected) return
    if (!aaWalletAddress || !isAddress(aaWalletAddress)) return
    if (!lastSessionId) return
    if (!isAddress(transferRecipient)) return
    const key = [
      aaWalletAddress,
      lastSessionId,
      transferRecipient,
      transferAmount,
      validForSec,
    ].join('|')
    if (executeStatus === 'pending') return
    if (executeAutoKeyRef.current === key) return
    executeAutoKeyRef.current = key
    runExecuteTransfer()
  }, [
    isConnected,
    aaWalletAddress,
    lastSessionId,
    transferRecipient,
    transferAmount,
    validForSec,
    executeStatus,
  ])

  if (!mounted) return null

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
          <WalletSetupCard
            isConnected={isConnected}
            status={aaWalletStatus}
            address={aaWalletAddress}
            onGenerate={fetchAaWallet}
            balanceLabel={aaBalance}
            balanceStatus={aaBalanceStatus}
            balanceError={aaBalanceError}
            topupStatus={topupStatus}
            topupToken={topupToken}
            topupAmount={topupAmount}
            setTopupAmount={setTopupAmount}
            onTopup={async (event) => {
              event.preventDefault()
              if (!isConnected) return
              if (!aaWalletAddress || !isAddress(aaWalletAddress)) return
              if (!isAddress(topupToken)) return
              setTopupTxHash(null)
              setTopupStatus('pending')
              setTopupErrorMessage(null)
              try {
                const amount = parseUnits(topupAmount || '0', 18)
                const hash = await topupAsync({
                  address: topupToken as `0x${string}`,
                  abi: erc20Abi,
                  functionName: 'transfer',
                  args: [aaWalletAddress as `0x${string}`, amount],
                })
                setTopupTxHash(hash)
                if (!publicClient) setTopupStatus('success')
              } catch (err) {
                setTopupStatus('failed')
                const decoded = decodeCustomError(err)
                const details = extractErrorDetails(err)
                setTopupErrorMessage(
                  decoded ?? details ?? '用户拒绝了请求。',
                )
              }
            }}
            isTopupPending={isTopupPending}
            topupError={topupErrorMessage ? { message: topupErrorMessage } : null}
            topupTxHash={topupTxHash}
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
          <div className="lg:col-span-2">
            <CreateSessionCard
              isConnected={isConnected}
              aaWalletAddress={aaWalletAddress}
              agentAddress={agentAddress}
              sessionDailyBudget={sessionDailyBudget}
              sessionPerTxBudget={sessionPerTxBudget}
              sessionTimeWindowSec={sessionTimeWindowSec}
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
              setSessionTimeWindowSec={(value) => {
                setSessionTimeWindowSec(value)
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
                const rawWindow = Number(sessionTimeWindowSec || '86400')
                const windowSec =
                  Number.isFinite(rawWindow) && rawWindow > 0 ? rawWindow : 86400
                const dayStart =
                  Math.floor(nowSec / windowSec) * windowSec
                const dayWindow = BigInt(windowSec)
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
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              onSubmit={(event) => {
                event.preventDefault()
              }}
              isPending={isExecutePending}
              error={executeErrorMessage ? { message: executeErrorMessage } : null}
              errorDetails={executeErrorDetails}
              status={executeStatus}
              txHash={executeTxHash}
              autoExecute={true}
            />
            <section className="rounded-2xl border border-amber-100/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(120,83,42,0.08)] backdrop-blur text-sm text-gray-700">
              <div className="text-lg font-semibold text-amber-900">返利面板</div>
              <p className="mt-1 text-sm text-gray-600">
                若交给审计公司审计后仍有新漏洞，欢迎提交审计报告用于优化数据，
                我们提供 20%-50% 支付成本返利。
              </p>
              <div className="mt-4 grid gap-2 text-sm text-amber-900">
                <div>审计文件上传</div>
                <label className="flex items-center justify-between rounded-md border border-amber-100 bg-white px-3 py-2 text-sm">
                    <span className="text-amber-900">Choose file</span>
                    <span className="text-gray-500 text-sm">
                      {rebateFile ? rebateFile.name : 'No file chosen'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.zip,.doc,.docx"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null
                        setRebateFile(file)
                        if (file) {
                          setRebateStatus('pending')
                          setTimeout(() => {
                            setRebateStatus('success')
                          }, 10000)
                        } else {
                          setRebateStatus('idle')
                        }
                      }}
                      className="sr-only"
                    />
                  </label>
                </div>
              <div className="mt-3 text-sm text-gray-600">
                {rebateFile ? `已选择：${rebateFile.name}` : '未选择文件'}
              </div>
              <div className="mt-3 rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2 text-sm text-amber-900">
                {rebateStatus === 'pending'
                  ? 'Pending：审核阶段'
                  : rebateStatus === 'success'
                  ? '返利成功'
                  : rebateStatus === 'failed'
                  ? '返利失败'
                  : '等待提交'}
              </div>
            </section>
          </div>
          <section className="rounded-2xl border border-amber-100/80 bg-white/90 p-6 shadow-[0_20px_50px_rgba(120,83,42,0.08)] backdrop-blur lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-amber-900">Demo 展示区</h2>
            </div>
            {!isDemoEnabled ? (
              <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/30 p-6 text-sm text-amber-800">
                请先创建 Session，然后才能使用 Demo 展示区。
              </div>
            ) : null}
            <form className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/30 p-6">
              <label className="grid gap-2 text-sm text-amber-900">
                代码仓库导入（GitHub / GitLab）
                <input
                  type="url"
                  value={demoRepoUrl}
                  onChange={(event) =>
                    isDemoEnabled ? setDemoRepoUrl(event.target.value) : null
                  }
                  placeholder="https://github.com/your-org/your-contracts"
                  disabled={!isDemoEnabled}
                  className={`w-full rounded-md border border-amber-200 bg-white px-3 py-2 text-sm text-amber-900 ${
                    !isDemoEnabled ? 'cursor-not-allowed opacity-60' : ''
                  }`}
                />
              </label>
              {!isDemoEnabled ? (
                <div className="mt-3 text-xs text-amber-700">等待 Session 创建完成</div>
              ) : !auditConfirmed ? (
                <div className="mt-3 text-xs text-amber-700">请先确认配置</div>
              ) : demoRepoStatus === 'invalid' ? (
                <div className="mt-3 text-xs text-red-700">
                  仅支持 GitHub / GitLab 仓库地址。
                </div>
              ) : demoRepoStatus === 'checking' ? (
                <div className="mt-3 flex items-center gap-2 text-xs text-amber-700">
                  <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
                  地址格式校验通过，正在尝试连接仓库...
                </div>
              ) : demoRepoStatus === 'connected' ? (
                <div className="mt-3 text-xs text-emerald-700">连接成功。</div>
              ) : (
                <div className="mt-3 text-xs text-amber-700">未填写仓库地址</div>
              )}
            </form>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
              <div className="rounded-xl border border-amber-100 bg-white/80 p-5 lg:col-span-2">
                <div className="text-sm font-semibold text-amber-900">
                  支付面板
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  选择审查档位或启用高级设置自定义参数。
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  {[
                    { id: 'simple', label: '简单', desc: '快速检查 + 核心风险' },
                    { id: 'balanced', label: '平衡', desc: '标准审计 + 风控覆盖' },
                    { id: 'strict', label: '严格', desc: '深度审计 + 扩展验证' },
                  ].map((tier) => (
                    <button
                      key={tier.id}
                      type="button"
                      disabled={!isDemoEnabled}
                      onClick={() =>
                        setAuditTier(tier.id as 'simple' | 'balanced' | 'strict')
                      }
                      className={`rounded-lg border px-4 py-3 text-left ${
                        auditTier === tier.id
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-amber-100 bg-white'
                      } ${!isDemoEnabled ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <div className="text-sm font-semibold text-amber-900">
                        {tier.label}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {tier.desc}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-5 rounded-lg border border-amber-100 bg-amber-50/40 p-4">
                  <div className="text-xs font-semibold text-amber-900">
                    高级设置
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="grid gap-1 text-xs text-gray-700">
                      调用审计模块
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { id: 'static', label: '静态分析' },
                          { id: 'economic', label: '经济模型' },
                          { id: 'governance', label: '权限治理' },
                          { id: 'integration', label: '依赖集成' },
                          { id: 'fuzzing', label: 'Fuzzing' },
                          { id: 'formal', label: '形式化验证' },
                        ].map((module) => (
                          <label
                            key={module.id}
                            className={`flex items-center gap-2 rounded-md border border-amber-100 bg-white px-2 py-1 text-xs ${
                              !isDemoEnabled ? 'opacity-60' : ''
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={auditModules.includes(module.id)}
                              disabled={!isDemoEnabled}
                              onChange={() => {
                                setAuditModules((prev) =>
                                  prev.includes(module.id)
                                    ? prev.filter((item) => item !== module.id)
                                    : [...prev, module.id],
                                )
                              }}
                            />
                            {module.label}
                          </label>
                        ))}
                      </div>
                    </label>
                    <label className="grid gap-1 text-xs text-gray-700">
                      迭代次数
                      <input
                        value={auditIterations}
                        onChange={(event) =>
                          setAuditIterations(event.target.value)
                        }
                        disabled={!isDemoEnabled}
                        className={`w-full rounded-md border border-amber-100 bg-white px-3 py-2 text-xs ${
                          !isDemoEnabled ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                      />
                    </label>
                    <label className="grid gap-1 text-xs text-gray-700 md:col-span-2">
                      自主提示词
                      <textarea
                        value={auditPrompt}
                        onChange={(event) => setAuditPrompt(event.target.value)}
                        disabled={!isDemoEnabled}
                        placeholder="例如：重点关注清算逻辑与预言机风险..."
                        rows={3}
                        className={`w-full rounded-md border border-amber-100 bg-white px-3 py-2 text-xs ${
                          !isDemoEnabled ? 'cursor-not-allowed opacity-60' : ''
                        }`}
                      />
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!isDemoEnabled}
                    onClick={() => setAuditConfirmed(true)}
                    className={`rounded-md border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-900 ${
                      !isDemoEnabled
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer'
                    }`}
                  >
                    确认配置并继续
                  </button>
                  {auditConfirmed ? (
                    <span className="text-xs text-emerald-700">
                      已确认，进入下一步。
                    </span>
                  ) : (
                    <span className="text-xs text-amber-700">
                      请先确认配置。
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div
              className={`mt-4 grid gap-3 md:grid-cols-2 ${
                !isDemoEnabled || !auditConfirmed
                  ? 'opacity-60 pointer-events-none'
                  : ''
              }`}
            >
              {[
                {
                  title: '漏洞与编码规范 Agent',
                  detail: '重入/权限绕过/溢出 + 规范检查',
                },
                {
                  title: '经济模型与风控 Agent',
                  detail: '铸/赎/清算边界 + 价格操纵',
                },
                {
                  title: '权限与治理 Agent',
                  detail: 'Owner/Role/Proxy/Timelock 风险',
                },
                {
                  title: '依赖与集成 Agent',
                  detail: '外部合约/Oracle/跨链桥风险',
                },
              ].map((agent, index) => {
                const progress = demoAgentProgress[index] ?? 0
                const hasStarted =
                  demoRepoStatus === 'connected' && progress > 0
                const logs = demoAgentLogs[index] ?? []
                const fullText = logs.join('\n')
                const charIntervalMs = 75
                const visibleChars =
                  progress >= 100
                    ? fullText.length
                    : hasStarted
                    ? Math.min(
                        fullText.length,
                        Math.floor((demoAgentElapsed[index] ?? 0) / charIntervalMs),
                      )
                    : 0
                const visibleText = fullText.slice(0, visibleChars)
                return (
                  <div
                    key={agent.title}
                    className="rounded-xl border border-amber-100 bg-white/80 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-amber-900">
                          {agent.title}
                        </div>
                        <div className="mt-1 text-xs text-gray-600">
                          {agent.detail}
                        </div>
                      </div>
                      {hasStarted && progress < 100 ? (
                        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
                      ) : null}
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-amber-100">
                      <div
                        className="h-2 rounded-full bg-amber-600 transition-[width] duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      {demoRepoStatus === 'connected'
                        ? progress >= 100
                          ? '分析完成'
                          : hasStarted
                          ? `分析中 ${progress}%`
                          : '等待进入队列'
                        : '等待仓库连接'}
                    </div>
                    <div className="mt-3 rounded-md border border-amber-100 bg-amber-50/40 p-3 font-mono text-[11px] leading-relaxed text-amber-900">
                      {hasStarted ? (
                        <div className="whitespace-pre-wrap opacity-80">
                          {visibleText}
                          {progress >= 100 ? '\n[done] analysis complete.' : null}
                          {progress < 100 ? (
                            <span className="inline-block h-3 w-1 animate-pulse bg-amber-700 align-middle" />
                          ) : null}
                        </div>
                      ) : (
                        <div className="opacity-60">[waiting] queued for analysis...</div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
            {allAgentsDone ? (
              <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-emerald-900">
                    汇总 / 裁决 Agent
                  </div>
                  <span className="text-xs text-emerald-700">
                    {demoSummaryStatus === 'done'
                      ? '结构化审计结果已生成'
                      : '正在汇总中'}
                  </span>
                </div>
                <div className="mt-3 rounded-md border border-emerald-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-emerald-900">
                  {(() => {
                    const fullText = demoSummaryLogs.join('\n')
                    const charIntervalMs = 75
                    const visibleChars =
                      demoSummaryStatus === 'done'
                        ? fullText.length
                        : Math.min(
                            fullText.length,
                            Math.floor(demoSummaryElapsed / charIntervalMs),
                          )
                    const visibleText = fullText.slice(0, visibleChars)
                    return demoSummaryStatus === 'idle' ? (
                      <div className="opacity-60">[waiting] pending agent completion...</div>
                    ) : (
                      <div className="whitespace-pre-wrap opacity-80">
                        {visibleText}
                        {demoSummaryStatus === 'running' ? (
                          <span className="inline-block h-3 w-1 animate-pulse bg-emerald-700 align-middle" />
                        ) : (
                          '\n[done] summary completed.'
                        )}
                      </div>
                    )
                  })()}
                </div>
                {demoSummaryStatus === 'done' ? (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-emerald-900">
                    <div className="whitespace-pre-wrap">
{`{
  "summary": {
    "risk_level": "high",
    "quality_score": 29,
    "counts": {
      "critical": 0,
      "high": 2,
      "medium": 5,
      "low": 7,
      "informational": 6
    }
  },
  "top_findings": [
    {
      "id": "SR-001",
      "title": "Reentrancy: external call before state update",
      "severity": "high",
      "category": "security",
      "location": "Vault.withdraw()",
      "status": "unresolved"
    },
    {
      "id": "EC-004",
      "title": "Oracle staleness not enforced",
      "severity": "high",
      "category": "economic",
      "location": "PriceOracle.getPrice()",
      "status": "unresolved"
    },
    {
      "id": "GV-002",
      "title": "Single-admin pause without timelock",
      "severity": "medium",
      "category": "governance",
      "location": "Pausable.pause()",
      "status": "unresolved"
    }
  ],
  "governance": {
    "admin_type": "single-sig",
    "timelock": "none",
    "upgradeability": "proxy",
    "emergency_controls": ["pause", "blacklist"]
  },
  "recommendations": [
    {
      "action": "Add reentrancy guard and reorder state updates",
      "priority": "high",
      "target": "Vault.withdraw()"
    },
    {
      "action": "Enforce oracle freshness and circuit breakers",
      "priority": "high",
      "target": "PriceOracle.getPrice()"
    },
    {
      "action": "Introduce timelock + multisig for admin actions",
      "priority": "medium",
      "target": "Governance / Admin"
    }
  ]
}`}
                    </div>
                  </div>
                ) : null}
                {demoSummaryStatus === 'done' ? (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50/60 p-3 text-sm text-emerald-900">
                    Agent 已匹配到符合主预算与 Session 规则的专业审计服务，
                    将按策略执行链上支付以启动深度审计。
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                      <span className="rounded-full border border-emerald-200 bg-white px-2 py-1">
                        收款地址：{demoPaymentRecipient}
                      </span>
                      <span className="rounded-full border border-emerald-200 bg-white px-2 py-1">
                        金额：{demoPaymentAmount} USDT
                      </span>
                    </div>
                    {demoPaymentStatus === 'pending' ? (
                      <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
                        <span className="inline-flex h-4 w-4 animate-spin rounded-full border-2 border-emerald-300 border-t-emerald-700" />
                        Agent 正在执行链上支付...
                      </div>
                    ) : null}
                    {demoPaymentStatus === 'failed' && demoPaymentError ? (
                      <div className="mt-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                        {demoPaymentError}
                      </div>
                    ) : null}
                    {demoPaymentTxHash ? (
                      <a
                        href={`https://testnet.kitescan.ai/tx/${demoPaymentTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-block text-xs text-emerald-700 underline decoration-emerald-400 underline-offset-4"
                      >
                        已支付：{demoPaymentTxHash}
                      </a>
                    ) : null}
                  </div>
                ) : null}
            {demoPaymentStatus === 'success' ? (
              <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-sm font-semibold text-indigo-900">
                        专业审计服务（已购买）
                      </div>
                      <span className="text-xs text-indigo-700">
                        {demoDeepAuditStatus === 'done'
                          ? '服务结果已返回'
                          : '正在拉取服务结果'}
                      </span>
                    </div>
                    <div className="mt-3 rounded-md border border-indigo-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-indigo-900">
                      {(() => {
                        const fullText = demoServiceLogs.join('\n')
                        const charIntervalMs = 75
                        const visibleChars =
                          demoDeepAuditStatus === 'done'
                            ? fullText.length
                            : Math.min(
                                fullText.length,
                                Math.floor(demoDeepAuditElapsed / charIntervalMs),
                              )
                        const visibleText = fullText.slice(0, visibleChars)
                        return demoDeepAuditStatus === 'idle' ? (
                          <div className="opacity-60">[waiting] awaiting payment confirmation...</div>
                        ) : (
                          <div className="whitespace-pre-wrap opacity-80">
                            {visibleText}
                            {demoDeepAuditStatus === 'running' ? (
                              <span className="inline-block h-3 w-1 animate-pulse bg-indigo-700 align-middle" />
                            ) : (
                              '\n[done] service results fetched.'
                            )}
                          </div>
                        )
                      })()}
                    </div>
                    {demoDeepAuditStatus === 'done' ? (
                      <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="text-sm font-semibold text-emerald-900">
                            汇总 / 裁决 Agent（最终）
                          </div>
                          <span className="text-xs text-emerald-700">
                            {demoFinalSummaryStatus === 'done'
                              ? '最终结构化审计报告已生成'
                              : '正在综合专业审计结果'}
                          </span>
                        </div>
                        <div className="mt-3 rounded-md border border-emerald-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-emerald-900">
                          {(() => {
                            const fullText = demoFinalSummaryLogs.join('\n')
                            const charIntervalMs = 75
                            const visibleChars =
                              demoFinalSummaryStatus === 'done'
                                ? fullText.length
                                : Math.min(
                                    fullText.length,
                                    Math.floor(
                                      demoFinalSummaryElapsed / charIntervalMs,
                                    ),
                                  )
                            const visibleText = fullText.slice(0, visibleChars)
                            return demoFinalSummaryStatus === 'idle' ? (
                              <div className="opacity-60">
                                [waiting] awaiting service results...
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap opacity-80">
                                {visibleText}
                                {demoFinalSummaryStatus === 'running' ? (
                                  <span className="inline-block h-3 w-1 animate-pulse bg-emerald-700 align-middle" />
                                ) : (
                                  '\n[done] final summary completed.'
                                )}
                              </div>
                            )
                          })()}
                        </div>
                        {demoFinalSummaryStatus === 'done' ? (
                          <div className="mt-3 rounded-md border border-emerald-200 bg-white p-3 font-mono text-[11px] leading-relaxed text-emerald-900">
                            <div className="whitespace-pre-wrap">
{`{
  "final_assessment": {
    "risk_level": "low",
    "score": 86,
    "confidence": "high",
    "tested_commit": "demo-commit-sha",
    "methodology": [
      "manual_review",
      "symbolic_checks",
      "economic_simulation",
      "fuzzing",
      "invariant_testing"
    ]
  },
  "vulnerability_summary": {
    "critical": 0,
    "high": 0,
    "medium": 0,
    "low": 1,
    "informational": 2
  },
  "findings": [
    {
      "id": "LW-011",
      "severity": "low",
      "title": "Missing event emission for key parameter update",
      "cause": "State changes are not accompanied by events, reducing auditability.",
      "attack_path": "Observers cannot reliably detect updates, enabling delayed governance response.",
      "impact": "Reduced transparency and slower incident response.",
      "recommendation": "Emit events for all critical parameter changes."
    },
    {
      "id": "INF-003",
      "severity": "informational",
      "title": "Inconsistent revert reasons",
      "cause": "Mixed revert strings and custom errors across modules.",
      "attack_path": "No direct exploit path; affects monitoring and UX.",
      "impact": "Operational friction and degraded observability.",
      "recommendation": "Standardize revert reasons and custom errors."
    },
    {
      "id": "INF-007",
      "severity": "informational",
      "title": "Unbounded loop in admin-only view",
      "cause": "View method iterates over growing array without upper bound.",
      "attack_path": "No direct exploit; potential high gas usage for admins.",
      "impact": "Operational cost and limited usability for large datasets.",
      "recommendation": "Paginate or cap iteration length."
    }
  ],
  "resolved": [
    "SR-001 reentrancy guard added",
    "EC-004 oracle staleness checks implemented",
    "GV-002 timelock + multisig enforced"
  ],
  "remaining": [],
  "recommendations": [
    "document upgrade runbooks and emergency procedures",
    "add continuous monitoring for oracle health",
    "perform periodic re-audits after major releases"
  ],
  "scope": {
    "in_scope": ["core contracts", "proxy admin", "oracle adapter"],
    "out_of_scope": ["front-end", "off-chain services", "third-party bridges"],
    "assumptions": [
      "oracle feeds are available and correctly configured",
      "admin keys are stored in secure multisig",
      "deployment matches tested_commit"
    ]
  },
  "methods": {
    "manual": [
      "code review of critical paths",
      "privilege and governance analysis",
      "economic edge-case reasoning"
    ],
    "automated": [
      "static analysis",
      "symbolic checks",
      "fuzzing",
      "invariant testing"
    ]
  },
  "disclaimer": "This report is provided for informational purposes only and does not constitute a guarantee of security. The audit is limited to the stated scope and assumptions; undiscovered vulnerabilities may exist."
}`}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
          <section className="rounded-2xl border border-amber-100/80 bg-white/90 p-6 text-sm text-gray-700 shadow-[0_20px_50px_rgba(120,83,42,0.08)] backdrop-blur lg:col-span-2">
            <div className="text-lg font-semibold text-amber-900">
              网络价值发现
            </div>
            <p className="mt-1 text-sm text-gray-600">
              输入需求后拆解 Agent 功能链、预算核算与方案选择。
            </p>
            <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="rounded-xl border border-amber-100 bg-white/80 p-4">
                <label className="grid gap-2 text-sm text-amber-900">
                  需求输入
                  <textarea
                    value={valuePrompt}
                    onChange={(event) => setValuePrompt(event.target.value)}
                    rows={4}
                    placeholder="例如：对新协议做快速审计，预算有限但希望覆盖权限与资金流风险"
                    className="w-full rounded-md border border-amber-100 bg-white px-3 py-2 text-sm"
                  />
                </label>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    disabled={!valuePrompt || valueStatus === 'thinking'}
                    onClick={() => {
                      if (!valuePrompt) return
                      setValueNextIndex(0)
                      setValueNextStatus('proposal')
                      setValueStatus('thinking')
                      setValueFeedback('')
                      setValuePlan([])
                      setValueBudget(null)
                      setValueOption(null)
                      setValuePayStatus('idle')
                      setValueLogText('')
                    }}
                    className={`rounded-md border border-amber-200 bg-white px-4 py-2 text-xs font-semibold text-amber-900 ${
                      !valuePrompt || valueStatus === 'thinking'
                        ? 'cursor-not-allowed opacity-60'
                        : 'cursor-pointer'
                    }`}
                  >
                    开始思考
                  </button>
                  {valueStatus === 'proposal' || valueStatus === 'feedback' ? (
                    <button
                      type="button"
                      onClick={() => setValueStatus('approved')}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700"
                    >
                      同意并付款
                    </button>
                  ) : null}
                </div>
                <div className="mt-3 rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2 text-xs text-amber-900">
                  审计预算由上方审计 Agent 配置决定。
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-amber-900">
                    审计强度
                  </div>
                  <div className="mt-2 grid gap-2 md:grid-cols-3">
                    {[
                      { id: 'simple', label: '简单' },
                      { id: 'balanced', label: '平衡' },
                      { id: 'strict', label: '严格' },
                    ].map((tier) => (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() =>
                          setValueAuditTier(
                            tier.id as 'simple' | 'balanced' | 'strict',
                          )
                        }
                        className={`rounded-md border px-3 py-2 text-xs font-semibold ${
                          valueAuditTier === tier.id
                            ? 'border-amber-400 bg-amber-50 text-amber-900'
                            : 'border-amber-100 bg-white text-amber-900'
                        }`}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-xs font-semibold text-amber-900">
                    预算（USDT）
                  </div>
                  <input
                    value={valueBudgetInput}
                    onChange={(event) => setValueBudgetInput(event.target.value)}
                    placeholder="请输入预算，如 200"
                    className="mt-2 w-full rounded-md border border-amber-100 bg-white px-3 py-2 text-xs"
                  />
                </div>
                {valueStatus === 'proposal' ? (
                  <div className="mt-3 rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2 text-xs text-amber-900">
                    推荐方案：{valueOption ?? '-'}，预算估算：
                    {valueBudgetInput
                      ? valueBudgetInput
                      : valueBudget ?? '-'}
                  </div>
                ) : null}
                {valueStatus === 'proposal' || valueStatus === 'feedback' ? (
                  <div className="mt-3">
                    <label className="grid gap-2 text-xs text-gray-700">
                      如果不同意，请给出反馈
                      <input
                        value={valueFeedback}
                        onChange={(event) => setValueFeedback(event.target.value)}
                        placeholder="例如：希望更低预算/更快时间"
                        className="w-full rounded-md border border-amber-100 bg-white px-3 py-2 text-xs"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={!valueFeedback}
                      onClick={() => {
                        if (!valueFeedback) return
                        setValueNextIndex(1)
                        setValueNextStatus('feedback')
                        setValueStatus('thinking')
                        setValuePlan([])
                        setValueBudget(null)
                        setValueOption(null)
                        setValuePayStatus('idle')
                        setValueLogText('')
                      }}
                      className={`mt-2 rounded-md border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-900 ${
                        !valueFeedback ? 'cursor-not-allowed opacity-60' : ''
                      }`}
                    >
                      反馈并重新方案
                    </button>
                  </div>
                ) : null}
                {valueStatus === 'paid' ? (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    付款完成，已进入执行队列。
                  </div>
                ) : null}
              </div>
              <div className="rounded-xl border border-amber-100 bg-white/80 p-4">
                <div className="text-xs font-semibold text-amber-900">
                  Agent 功能链与预算
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {valuePlan.length > 0 ? '已生成最优功能链' : '等待生成方案'}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {valuePlan.length > 0
                    ? valuePlan.map((step) => (
                        <span
                          key={step}
                          className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-900"
                        >
                          {step}
                        </span>
                      ))
                    : null}
                </div>
                <div className="mt-3 rounded-md border border-amber-100 bg-amber-50/40 px-3 py-2 text-xs text-amber-900">
                  预算估算：{valueBudget ?? '-'}
                </div>
                <div className="mt-3 rounded-md border border-amber-100 bg-white p-3 font-mono text-[11px] leading-relaxed text-amber-900">
                  <div className="whitespace-pre-wrap opacity-80">
                    {valueStatus === 'idle'
                      ? '[waiting] awaiting user prompt...'
                      : valueStatus === 'thinking'
                      ? valueStageLogs.join('\n')
                          .slice(0, Math.floor(valueElapsed / 60))
                      : valueLogText}
                    {valueStatus === 'thinking' ? (
                      <span className="inline-block h-3 w-1 animate-pulse bg-amber-700 align-middle" />
                    ) : null}
                  </div>
                </div>
                <div className="mt-3 h-2 w-full rounded-full bg-amber-100">
                  <div
                    className="h-2 rounded-full bg-amber-600 transition-[width] duration-500"
                    style={{ width: `${valueProgress}%` }}
                  />
                </div>
                <div className="mt-2 text-xs text-gray-600">
                  {valueStatus === 'thinking'
                    ? `方案生成中 ${valueProgress}%`
                    : valueStatus === 'approved'
                    ? '等待支付确认'
                    : valueStatus === 'paid'
                    ? '已进入执行'
                    : '准备就绪'}
                </div>
                {valuePayStatus !== 'idle' ? (
                  <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                    {valuePayStatus === 'pending'
                      ? '付款处理中...'
                      : '付款成功。'}
                  </div>
                ) : null}
              </div>
            </div>
          </section>
          <section className="rounded-2xl border border-amber-100/80 bg-white/90 p-6 text-sm text-gray-700 shadow-[0_20px_50px_rgba(120,83,42,0.08)] backdrop-blur lg:col-span-2">
            <div className="text-lg font-semibold text-amber-900">
              其它 Agent 调用接口
            </div>
            <p className="mt-1 text-sm text-gray-600">
              外部 Agent 可通过该入口上传合约并接入本系统的审计流程。
            </p>
            <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50/40 p-4">
              <div className="text-xs font-semibold text-amber-900">接口</div>
              <div className="mt-1 font-mono text-[12px] text-amber-900">
                POST /api/contract/upload
              </div>
              <div className="mt-2 text-xs text-gray-600">
                上传合约与配置后触发多 Agent 审计流程（示例入口）。
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  )
}
