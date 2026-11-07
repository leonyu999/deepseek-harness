# dsh-hello-plugin

A minimal DeepSeek Harness **bundle**: one plugin that registers a model-callable tool, and a second plugin that observes every tool result.

It is the smallest useful shape for path A development — write Cordis plugins, mount them into a profile, and later publish them for other people to install.

## Files

| File | Role |
|---|---|
| `index.js` | The tool plugin: registers the `hello` tool through `ctx.tools.register(defineTool(...))`. |
| `observer.js` | The observer plugin: listens to `tools/result` and prints the outcome. |
| `cordis.patch.yml` | The bundle layer. Each row mounts one plugin file beside the patch. |
| `package.json` | The bundle manifest. The `dsh.bundle.patch` field names the layer file. |
| `dev/cordis.yml` | A standalone Cordis composition for the smoke test; not part of the bundle. |
| `dev/smoke.js` | A development driver that executes the tool through the real pipeline. |
| `dev/harness.overlay.yml` | An overlay that mounts the bundle into a running harness. |
| `dev/list-tools.js` | A development plugin that prints the registered tool names. |

## The Cordis ideas it demonstrates

- **A plugin is a function with `name`, `inject`, and `apply`.** `inject: ['tools']` holds the plugin until the tool registry exists, so load order never depends on configuration order.
- **A context is a repository of services.** The tool plugin reaches the registry as `ctx.tools`; the observer never imports the tool plugin.
- **Registrations are reversible effects.** `ctx.tools.register()` and `ctx.on()` return disposers the plugin scope owns, so unloading a plugin unregisters the tool and removes the listener.
- **Configuration is a validated field, not a constant.** `greeting` is a `Config` field with a default; the layer sets it to `Hi`.
- **Typed events connect plugins.** The observer learns about the tool only through the `tools/result` event.

## How a layer names a plugin

A row's `name` decides how the loader finds the module:

| Row `name` | Resolved against | Needs the package installed in the profile? |
|---|---|---|
| `dsh-hello-plugin` | the profile's `node_modules` | yes |
| `./index.js`, `../index.js`, an absolute path | the directory beside the patch file | no |

The boot layer rewrites a relative or absolute row name into a file URL anchored beside the patch file, and leaves a bare package name literal. This bundle therefore names its plugins by relative path: the same `cordis.patch.yml` works as an installed bundle and as a `--patch` overlay from a checkout. A bundle that mounts plugins from *other* packages has to name them, because those packages are resolved from the profile.

## Run it from this checkout

The plugin imports `@deepseek-ai/dsh-tools` and `@deepseek-ai/schemastery` from this repository. Link them into the bundle's private `node_modules` once:

```sh
cd examples/hello-plugin
mkdir -p node_modules/@deepseek-ai
ln -sfn ../../../../packages/core/tools node_modules/@deepseek-ai/dsh-tools
ln -sfn ../../../../packages/core/system-prompt node_modules/@deepseek-ai/dsh-system-prompt
ln -sfn ../../../../packages/core/tool-executor-native node_modules/@deepseek-ai/dsh-tool-executor-native
ln -sfn ../../../../vendor/schemastery node_modules/@deepseek-ai/schemastery
```

### Smoke test without the harness

```sh
cd examples/hello-plugin/dev
node --import tsx ../../../vendor/cordis/bin.js
```

```
[hello-observer] hello -> Hi, Cordis!
[hello-smoke] tool replied: [{"type":"text":"Hi, Cordis!"}]
```

The composition in `dev/cordis.yml` mounts the whole dependency chain: `dsh-system-prompt` first, because `dsh-tools` declares `static inject = ['systemPrompt']` and stays pending without it. A plugin that is still pending publishes no service, so every plugin that injects it waits as well — and the process exits with nothing mounted. Read the `inject` chain of every service in a composition before wondering why nothing happened.

### Mount it into a running harness

From the repository root:

```sh
pnpm dsh --profile headless --patch examples/hello-plugin/dev/harness.overlay.yml "say hi"
```

```
[hello-list-tools] registered tools: bash, create_goal, edit, …, hello, …, write
```

`hello` appears beside the harness's built-in tools, so the model would be offered it. A `MISSING_CREDENTIAL` error after that line means the run stopped at the model call, not at plugin activation.

The overlay in `dev/harness.overlay.yml` mounts the bundle's plugins plus the development lister; `dev/cordis.yml` and `dev/harness.overlay.yml` are separate files because the relative names in each one anchor beside its own directory.

## Install it into a profile as a bundle

```sh
pnpm dsh plugin --profile demo add ./examples/hello-plugin
pnpm dsh --profile demo --dump-config   # shows a "# == dsh-hello-plugin" layer
pnpm dsh --profile demo
```

`dsh plugin add` links the checkout into the profile and appends the bundle to `dsh.profile.bundles`. The composed layer then names the plugin files inside the profile's `node_modules` copy.

## Publish it

The published form carries built artifacts, so `pnpm publish` (registry) or `pnpm pack` (tarball) needs no build permission from the user:

```sh
pnpm publish          # → npm, installable with `dsh plugin add dsh-hello-plugin`
pnpm pack             # → tarball, installable with `dsh plugin add ./dsh-hello-plugin-0.1.0.tgz`
```

A direct GitHub install fetches sources instead of artifacts, so it needs a self-contained `prepare` script and the user's explicit `allowBuilds` entry in the profile's `pnpm-workspace.yaml`. See [the publish tutorial](../../../docs/user/develop/basic/publish.md).

Add the `dsh-plugin` topic to the repository so the plugin is discoverable.
