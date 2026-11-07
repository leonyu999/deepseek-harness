/**
 * A second plugin in the same bundle: it observes tool results without
 * knowing which plugin produced the tool.
 */

/** Cordis plugin name. */
export const name = 'hello-observer'

/** Wait for the tool registry before mounting. */
export const inject = ['tools']

/**
 * Log every tool result.
 *
 * `ctx.on()` returns a disposer the plugin scope owns, so unloading this
 * plugin removes the listener.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - the mounting context.
 */
export function apply(ctx) {
  ctx.on('tools/result', (exec, result) => {
    const text = result.content
      .map(block => (block.type === 'text' ? block.text : ''))
      .join('')
    console.log(`[hello-observer] ${exec.name} -> ${text}`)
  })
}
