/**
 * Detect transient Nuxt test-server port allocation failures.
 *
 * Vitest may inject ANSI color sequences between error-label fragments, so
 * detection intentionally relies on stable tokens instead of one exact line.
 *
 * @param {string} output Combined stdout and stderr from one Vitest process.
 * @returns {boolean} Whether the failed test file may be retried safely.
 */
export function isRetryablePortCollision(output) {
  const hasAddressInUse = output.includes('EADDRINUSE')
  const hasNuxtPortTimeout
    = output.includes('GetPortError') && output.includes('Timeout waiting for port')

  return hasAddressInUse || hasNuxtPortTimeout
}
