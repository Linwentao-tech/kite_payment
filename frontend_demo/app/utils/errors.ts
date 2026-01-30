import { decodeErrorResult, isHex, keccak256, stringToHex } from 'viem'

export function formatErrorMessage(message: string) {
  if (!message) return '请求失败。'
  if (
    message.includes('User rejected the request') ||
    message.includes('User denied transaction signature') ||
    message.includes('User rejected transaction')
  )
    return '用户拒绝了请求。'
  const signatureMatch = message.match(/signature:\s*(0x[0-9a-fA-F]{8})/)
  if (signatureMatch) {
    const friendly = mapErrorSignature(signatureMatch[1])
    return friendly ?? '交易回滚。'
  }
  return message
}

export function extractErrorDetails(error: unknown) {
  const err = error as {
    shortMessage?: string
    details?: string
    message?: string
    cause?: { shortMessage?: string; details?: string; message?: string }
  }
  const message =
    err?.cause?.shortMessage ||
    err?.shortMessage ||
    err?.cause?.details ||
    err?.details ||
    err?.cause?.message ||
    err?.message ||
    null
  return message ? normalizeErrorText(message) : null
}

export function decodeCustomError(error: unknown) {
  const data = extractRevertData(error)
  if (!data || !isHex(data)) return null
  try {
    const result = decodeErrorResult({
      abi: [
        { type: 'error', name: 'InvalidFromAddress', inputs: [] },
        { type: 'error', name: 'AuthorizationNotYetValid', inputs: [] },
        { type: 'error', name: 'AuthorizationExpired', inputs: [] },
        { type: 'error', name: 'InvalidSignature', inputs: [] },
        { type: 'error', name: 'MasterBudgetExceeded', inputs: [] },
        { type: 'error', name: 'SpendingRuleNotPassed', inputs: [] },
        { type: 'error', name: 'InsufficientBalance', inputs: [] },
        {
          type: 'error',
          name: 'NotAuthorized',
          inputs: [{ name: 'caller', type: 'address' }],
        },
        { type: 'error', name: 'ArrayLengthMismatch', inputs: [] },
        { type: 'error', name: 'InvalidOwner', inputs: [] },
      ],
      data,
    })
    if (result?.errorName === 'NotAuthorized') {
      const caller = result.args?.[0] as string | undefined
      return caller ? `NotAuthorized(${caller})` : 'NotAuthorized()'
    }
    return `${result.errorName}()`
  } catch {
    return null
  }
}

function mapErrorSignature(signature: string) {
  const signatures = [
    'InvalidFromAddress()',
    'AuthorizationNotYetValid()',
    'AuthorizationExpired()',
    'InvalidSignature()',
    'MasterBudgetExceeded()',
    'SpendingRuleNotPassed()',
    'InsufficientBalance()',
    'NotAuthorized(address)',
    'ArrayLengthMismatch()',
    'InvalidOwner()',
  ]
  const normalized = signature.toLowerCase()
  for (const sig of signatures) {
    const selector = keccak256(stringToHex(sig)).slice(0, 10)
    if (selector.toLowerCase() === normalized)
      return sig.includes('NotAuthorized')
        ? 'NotAuthorized()'
        : sig.replace(/\(.*\)/, '()')
  }
  return null
}

function normalizeErrorText(text: string) {
  const signatureMatch = text.match(/signature:\s*(0x[0-9a-fA-F]{8})/)
  if (signatureMatch) {
    return mapErrorSignature(signatureMatch[1]) ?? text
  }
  return text
}

function extractRevertData(error: unknown) {
  const err = error as {
    data?: string
    error?: { data?: string; error?: { data?: string } }
    info?: { data?: string; error?: { data?: string } }
    cause?: { data?: string }
  }
  return (
    err?.data ||
    err?.error?.data ||
    err?.error?.error?.data ||
    err?.info?.error?.data ||
    err?.info?.data ||
    err?.cause?.data ||
    null
  )
}
