/**
 * Lê src/tokens/tokens.json e transforma em CSS custom properties.
 *
 * O dark é um patch parcial: só as variáveis que mudam. Como o bloco light
 * mora em `:root`, tudo que o dark não redefine é herdado — é o que garante
 * que "cor semântica mantém o matiz" continue verdade por construção.
 */
import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const TOKENS_PATH = fileURLToPath(new URL('../src/tokens/tokens.json', import.meta.url))

export async function loadTokens() {
  return JSON.parse(await readFile(TOKENS_PATH, 'utf8'))
}

/** Remove as chaves de anotação ($comment, $comment-dark, meta) de um grupo. */
function entriesOf(group) {
  return Object.entries(group ?? {}).filter(
    ([key, val]) => !key.startsWith('$') && val && typeof val === 'object' && 'value' in val
  )
}

/** `{ canvas: {value} }` → `  --i-canvas: #F7F7F7;` */
function declarations(group, prefix, indent = '  ') {
  return entriesOf(group)
    .map(([name, token]) => `${indent}--${prefix}-${name}: ${token.value};`)
    .join('\n')
}

/**
 * Monta o bloco de tokens do bundle.
 *
 * Ordem: light em :root (base herdada) → dark por atributo explícito →
 * dark por preferência do sistema, exceto quando o autor forçou light.
 *
 * O bloco light também casa `:host`: dentro de um Shadow DOM, `:root` não casa
 * com nada, e sem isto todos os tokens ficariam indefinidos quando o
 * instalador é montado como custom element. No documento normal `:host` não
 * casa com nada, então não custa.
 */
export function renderTokensCss(tokens, { version } = {}) {
  const prefix = tokens.meta?.prefix ?? 'i'
  const light = declarations(tokens.color.light, prefix)
  const dark = declarations(tokens.color.dark, prefix)
  const type = declarations(tokens.typography, prefix)
  const layout = declarations(tokens.layout, prefix)

  return `/* Tokens — gerados de src/tokens/tokens.json. Não edite à mão.${
    version ? ` (v${version})` : ''
  } */
:root,
:host,
[data-theme="light"] {
  color-scheme: light;
${light}

${type}

${layout}
}

[data-theme="dark"] {
  color-scheme: dark;
${dark}
}

/* Sem data-theme no <html>, segue a preferência do sistema. */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    color-scheme: dark;
${dark.replace(/^ {2}/gm, '    ')}
  }
}
`
}

/** Versão achatada, para quem precisa dos valores em JS (gráficos, canvas, e-mail). */
export function renderTokensJson(tokens) {
  const prefix = tokens.meta?.prefix ?? 'i'
  const flatten = (group) =>
    Object.fromEntries(entriesOf(group).map(([name, t]) => [`--${prefix}-${name}`, t.value]))

  return {
    meta: tokens.meta,
    light: { ...flatten(tokens.color.light), ...flatten(tokens.typography), ...flatten(tokens.layout) },
    dark: flatten(tokens.color.dark),
  }
}

/** Usado pelas docs para listar as cores com a descrição de uso. */
export function swatches(tokens, theme) {
  return entriesOf(tokens.color[theme]).map(([name, t]) => ({
    name,
    variable: `--${tokens.meta?.prefix ?? 'i'}-${name}`,
    value: t.value,
    use: t.use ?? '',
  }))
}
