type AuthAction = 'signup' | 'login' | 'logout' | 'password_reset'
type AuthResult = 'success' | 'failure'

export function logAuthAction(action: AuthAction, result: AuthResult, error?: unknown) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    result,
    errorMessage: error ? errorMessage(error) : null,
  }

  if (result === 'failure') {
    console.error('auth_action', entry)
    return
  }

  console.info('auth_action', entry)
}

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'Unknown authentication error'
}
