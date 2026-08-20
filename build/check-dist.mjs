/**
 * Guarda contra a pior falha possível deste repo: publicar uma tag em
 * que dist/ não corresponde ao src/.
 *
 * Como a CDN serve dist/ direto do commit da tag, um dist desatualizado
 * significa que todo instalador do mundo passa a usar um CSS que não
 * existe em nenhum lugar do código. O CI roda isto em todo push.
 *
 * Uso: node build/check-dist.mjs
 */

import { readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const root = fileURLToPath(new URL('..', import.meta.url))
const dist = path.join(root, 'dist')

const snapshot = async () => {
  const files = (await readdir(dist)).filter((f) => !f.startsWith('.')).sort()
  const entries = await Promise.all(
    files.map(async (f) => [f, await readFile(path.join(dist, f), 'utf8')])
  )
  return new Map(entries)
}

const antes = await snapshot()

execFileSync('node', [path.join(root, 'build/build.mjs')], { cwd: root, stdio: 'pipe' })

const depois = await snapshot()

const diferencas = []
for (const [file, conteudo] of depois) {
  if (!antes.has(file)) diferencas.push(`${file} — não estava commitado`)
  else if (antes.get(file) !== conteudo) diferencas.push(`${file} — conteúdo diferente do build`)
}
for (const file of antes.keys()) {
  if (!depois.has(file)) diferencas.push(`${file} — sobrou no dist, o build não gera mais`)
}

if (diferencas.length) {
  console.error('\ndist/ está fora de sincronia com src/:\n')
  for (const d of diferencas) console.error(`  · ${d}`)
  console.error('\nRode `npm run build` e commite o dist/ junto com a mudança.\n')
  process.exit(1)
}

console.log(`dist/ confere com src/ (${depois.size} arquivos).`)
