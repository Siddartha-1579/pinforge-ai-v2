export function authErrorMessage(error: unknown) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Unable to reach authentication service.'
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (message.includes('failed to fetch') || message.includes('network')) {
      return 'Unable to reach authentication service.'
    }

    if (message.includes('supabase is not configured') || message.includes('missing vite_supabase')) {
      return 'Authentication is not configured yet. Please check the deployment settings.'
    }

    if (message.includes('email rate limit exceeded')) {
      return 'Too many signup attempts. Please wait a few minutes.'
    }

    if (message.includes('email not confirmed')) {
      return 'Please check your inbox and confirm your email before logging in.'
    }

    if (message.includes('invalid login credentials')) {
      return 'Incorrect email or password.'
    }

    if (message.includes('user already registered') || message.includes('already been registered')) {
      return 'An account already exists for this email. Try logging in instead.'
    }

    if (message.includes('password') && (message.includes('weak') || message.includes('short') || message.includes('6'))) {
      return 'Please use a stronger password.'
    }

    if (message.includes('invalid email')) {
      return 'Please enter a valid email address.'
    }

    if (message.includes('rate limit')) {
      return 'Too many attempts. Please wait a few minutes.'
    }

    return 'Authentication failed. Please try again.'
  }

  return 'Authentication failed. Please try again.'
}
