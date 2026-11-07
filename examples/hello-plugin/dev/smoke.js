/**
 * Development-only driver: it executes the bundle's tool through the real
 * tool pipeline and prints the outcome.
 *
 * It is not part of the bundle layer; `cordis.dev.yml` mounts it explicitly.
 */

export const name = 'hello-smoke'

export const inject = ['tools']

export function apply(ctx) {
  void (async () => {
    const deadline = Date.now() + 5000
    while (ctx.tools.get('hello') === undefined && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    if (ctx.tools.get('hello') === undefined) {
      console.error('[hello-smoke] the hello tool was never registered')
      return
    }
    const result = await ctx.tools.execute({
      calls: [{
        type: 'tool-call',
        id: 'smoke-1',
        name: 'hello',
        arguments: JSON.stringify({ name: 'Cordis' }),
      }],
      signal: new AbortController().signal,
    })
    console.log('[hello-smoke] tool replied:', JSON.stringify(result.results[0]?.result.content))
  })()
}
