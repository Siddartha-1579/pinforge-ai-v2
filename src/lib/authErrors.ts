export function authErrorMessage(error: unknown) {
  if (error instanceof TypeError && error.message === 'Failed to fetch') {
    return 'Could not reach Supabase Auth. Check Vercel environment variables, Supabase project status, and browser network access.'
  }

  if (error instanceof Error) return error.message

  return 'Authentication failed. Please try again.'
}
