import { defineTool } from '@deepseek-ai/dsh-tools'
import z from '@deepseek-ai/schemastery'

/** Cordis plugin name. */
export const name = 'hello-plugin'

/** Wait for the tool registry before mounting. */
export const inject = ['tools']

/**
 * Plugin config.
 *
 * The greeting prefix is deployment-varying, so it is a validated config
 * field instead of a constant baked into the tool body.
 */
export const Config = z.object({
  greeting: z.string().default('Hello'),
})

/**
 * Register a model-callable greeting tool.
 *
 * `ctx.tools.register()` returns a disposer that the plugin scope owns, so
 * unloading this plugin unregisters the tool.
 *
 * @param {import('@deepseek-ai/cordis').Context} ctx - the mounting context.
 * @param {{ greeting: string }} config - the validated plugin config.
 */
export function apply(ctx, config) {
  ctx.tools.register(defineTool({
    name: 'hello',
    description: 'Greet the named person.',
    parameters: {
      name: { type: 'string', required: true, description: 'Who to greet' },
    },
    output: {
      schema: { type: 'string' },
      render: (_args, value) => [{ type: 'text', text: value }],
    },
    async execute(args) {
      return `${config.greeting}, ${args.name}!`
    },
  }))
}
