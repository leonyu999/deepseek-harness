/**
 * Development-only plugin: it prints the tools registered in the running
 * harness. It is not part of the bundle layer; `dev/harness.overlay.yml`
 * mounts it explicitly.
 */

export const name = 'hello-list-tools'

export const inject = ['tools']

export function apply(ctx) {
  void (async () => {
    // Plugins that inject the same service activate in registration order,
    // but a sibling may still be applying when this one runs. Wait for the
    // tool to appear instead of reporting a snapshot taken too early.
    const deadline = Date.now() + 5000
    while (ctx.tools.get('hello') === undefined && Date.now() < deadline) {
      await new Promise(resolve => setTimeout(resolve, 20))
    }
    const names = ctx.tools.schemas().map(schema => schema.name).sort()
    console.log(`[hello-list-tools] registered tools: ${names.join(', ') || '(none)'}`)
  })()
}
