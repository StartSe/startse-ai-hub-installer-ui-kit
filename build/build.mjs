/**
 * Build do kit. Produz em dist/:
 *
 *   startse-installer.css        bundle legível (com comentários de spec)
 *   startse-installer.min.css    o que a CDN serve em produção
 *   startse-installer.js         IIFE, global StartSeUI — <script src>
 *   startse-installer.min.js
 *   startse-installer.esm.js     para quem importa por bundler
 *   tokens.css                   só as variáveis, para quem já tem CSS
 *   tokens.json                  valores achatados, para uso em JS
 *
 * Uso: node build/build.mjs [--watch] [--serve]
 */

import { mkdir, readFile, writeFile, rm } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import path from 'node:path'
import * as esbuild from 'esbuild'
import { bundle as bundleCss, transform as transformCss, browserslistToTargets } from 'lightningcss'
import browserslist from 'browserslist'
import { loadTokens, renderTokensCss, renderTokensJson, swatches } from './tokens.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = path.join(root, 'dist')
const rel = (...p) => path.join(root, ...p)

const args = new Set(process.argv.slice(2))
const WATCH = args.has('--watch')
const SERVE = args.has('--serve')

const pkg = JSON.parse(await readFile(rel('package.json'), 'utf8'))
const VERSION = pkg.version

/* Alvo: navegadores que os alunos de fato usam. Sem IE, sem polyfill. */
const TARGETS = browserslistToTargets(browserslist('>= 0.5%, last 2 versions, not dead'))

const banner = (kind) =>
  `/*! StartSe · UI Kit dos Instaladores v${VERSION} — ${kind}
 * Documentação e componentes: docs/index.html
 * Gerado por build/build.mjs. Não edite dist/ à mão. */\n`

/**
 * Um único pipeline: resolve os @import, concatena os tokens na frente e
 * só então minifica — assim o .min.css é exatamente o .css comprimido,
 * sem chance de os dois divergirem.
 */
async function buildCss(tokensCss) {
  const bundled = bundleCss({
    filename: rel('src/css/index.css'),
    minify: false,
    targets: TARGETS,
  })

  const full = tokensCss + '\n' + bundled.code.toString()
  const minified = transformCss({
    filename: 'startse-installer.css',
    code: Buffer.from(full),
    minify: true,
    targets: TARGETS,
  })

  const readable = banner('CSS') + full
  const min = banner('CSS minificado') + minified.code.toString()

  await writeFile(path.join(dist, 'startse-installer.css'), readable)
  await writeFile(path.join(dist, 'startse-installer.min.css'), min)

  return { readable: readable.length, minified: min.length }
}

async function buildJs() {
  const shared = {
    entryPoints: [rel('src/js/index.js')],
    bundle: true,
    target: ['es2020'],
    define: { __VERSION__: JSON.stringify(VERSION) },
    legalComments: 'none',
    logLevel: 'silent',
  }

  const outputs = [
    { outfile: 'startse-installer.js', format: 'iife', globalName: 'StartSeUI', minify: false },
    { outfile: 'startse-installer.min.js', format: 'iife', globalName: 'StartSeUI', minify: true },
    { outfile: 'startse-installer.esm.js', format: 'esm', minify: false },
  ]

  const sizes = {}
  for (const out of outputs) {
    const result = await esbuild.build({
      ...shared,
      format: out.format,
      globalName: out.globalName,
      minify: out.minify,
      banner: { js: banner(out.format === 'esm' ? 'ESM' : 'IIFE · global StartSeUI') },
      outfile: path.join(dist, out.outfile),
    })
    if (result.warnings.length) for (const w of result.warnings) console.warn('  aviso:', w.text)
    sizes[out.outfile] = (await readFile(path.join(dist, out.outfile))).length
  }
  return sizes
}

async function build() {
  const started = Date.now()
  await rm(dist, { recursive: true, force: true })
  await mkdir(dist, { recursive: true })

  const tokens = await loadTokens()
  const tokensCss = renderTokensCss(tokens, { version: VERSION })

  await writeFile(path.join(dist, 'tokens.css'), banner('tokens') + tokensCss)
  await writeFile(
    path.join(dist, 'tokens.json'),
    JSON.stringify({ version: VERSION, ...renderTokensJson(tokens) }, null, 2) + '\n'
  )

  // As docs leem os tokens daqui, então a galeria de cores nunca fica
  // desatualizada. É <script src> de propósito: assim docs/index.html
  // também abre por file:// sem CORS.
  await writeFile(
    rel('docs/tokens.data.js'),
    `/* Gerado por build/build.mjs — não edite. */\nwindow.I_TOKENS = ${JSON.stringify(
      { version: VERSION, light: swatches(tokens, 'light'), dark: swatches(tokens, 'dark') },
      null,
      2
    )}\n`
  )

  const css = await buildCss(tokensCss)
  const js = await buildJs()

  const kb = (n) => `${(n / 1024).toFixed(1)} kB`
  console.log(`\nStartSe UI Kit v${VERSION} — build em ${Date.now() - started}ms\n`)
  console.log(`  startse-installer.css        ${kb(css.readable)}`)
  console.log(`  startse-installer.min.css    ${kb(css.minified)}`)
  console.log(`  startse-installer.js         ${kb(js['startse-installer.js'])}`)
  console.log(`  startse-installer.min.js     ${kb(js['startse-installer.min.js'])}`)
  console.log(`  startse-installer.esm.js     ${kb(js['startse-installer.esm.js'])}`)
  console.log('')
}

await build()

if (WATCH) {
  const { watch } = await import('node:fs')
  let queued = null
  for (const dir of ['src', 'build']) {
    watch(rel(dir), { recursive: true }, (_event, file) => {
      if (!file || file.includes('.DS_Store')) return
      clearTimeout(queued)
      queued = setTimeout(() => {
        console.log(`\n↻ ${file}`)
        build().catch((error) => console.error(error.message))
      }, 60)
    })
  }
  console.log('Observando src/ e build/ — Ctrl+C para sair.')
}

if (SERVE) {
  const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
  }
  const port = Number(process.env.PORT ?? 4178)

  createServer(async (req, res) => {
    let file = decodeURIComponent(new URL(req.url, 'http://localhost').pathname)
    if (file === '/') file = '/docs/index.html'

    // Sem escapar da raiz do projeto.
    const target = path.join(root, path.normalize(file).replace(/^(\.\.[/\\])+/, ''))
    if (!target.startsWith(root)) {
      res.writeHead(403).end('403')
      return
    }
    try {
      const body = await readFile(target)
      res.writeHead(200, { 'content-type': MIME[path.extname(target)] ?? 'application/octet-stream' })
      res.end(body)
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('404')
    }
  }).listen(port, () => console.log(`Docs em http://localhost:${port}/docs/index.html`))
}
