/**
 * Log de execução — o componente que mais economiza tempo de quem
 * escreve um instalador.
 *
 *   <div data-i-runlog></div>
 *
 *   const log = StartSeUI.runLog('[data-i-runlog]')
 *   log.start('Publicando os workflows — leva alguns segundos.')
 *   log.ok('Conectando ao seu n8n', 'versão 1.63 · API ok')
 *   log.fail('Publicando 10 workflows', {
 *     error: 'A API recusou a chave (401). Gere outra e tente de novo.',
 *     retry: () => publicar(),
 *   })
 *   log.stop()
 *
 * O texto de start fica em aria-live="polite" e cada linha entra no log
 * — leitor de tela acompanha sem ler a lista toda de novo.
 *
 * Toda string entra por textContent: mensagem de erro de API é dado não
 * confiável.
 */

import { h, emit, resolve } from './dom.js'

const ico = (variant) =>
  h('span', { class: `i-ico i-ico--${variant} i-ico--sm`, 'aria-hidden': 'true' })

export function runLog(target) {
  const root = resolve(target)
  if (!root) return null

  root.classList.add('i-stack', 'i-stack--tight')

  const run = h('div', { class: 'i-run', role: 'status', 'aria-live': 'polite', hidden: true })
  const list = h('div', { class: 'i-log', 'aria-live': 'polite', 'aria-relevant': 'additions' })
  root.replaceChildren(run, list)

  const api = {
    /** Frase do que está rodando. Sempre com expectativa de tempo. */
    start(message) {
      run.hidden = false
      run.replaceChildren(h('span', { class: 'i-spinner', 'aria-hidden': 'true' }), message ?? '')
      return api
    },

    /** Para o spinner sem apagar o log. */
    stop() {
      run.hidden = true
      run.replaceChildren()
      return api
    },

    /** Etapa concluída: nome à esquerda, detalhe técnico em mono à direita. */
    ok(name, detail) {
      const line = h(
        'span',
        { class: 'i-log__line' },
        h('span', {}, name),
        detail ? h('span', { class: 'i-log__det' }, detail) : null
      )
      api.row('ok', line)
      return api
    },

    /** Condição degradada que não bloqueia a instalação. */
    warn(name, detail) {
      const line = h(
        'span',
        { class: 'i-log__line' },
        h('span', {}, name),
        detail ? h('span', { class: 'i-log__det' }, detail) : null
      )
      api.row('warn', line)
      return api
    },

    /**
     * Falha: interrompe o log, nomeia a causa e oferece a próxima ação.
     * retry é uma função — o botão só aparece se ela existir.
     */
    fail(name, { error, retry, retryLabel = 'Tentar de novo' } = {}) {
      const body = h('span', { class: 'i-log__body' }, name)
      if (error) body.append(h('span', { class: 'i-log__err' }, error))

      if (typeof retry === 'function') {
        const btn = h('button', { type: 'button', class: 'i-btn i-btn--secondary' }, retryLabel)
        btn.addEventListener('click', () => retry())
        body.append(btn)
      }
      api.stop()
      const row = api.row('fail', body)
      row.setAttribute('role', 'alert')
      return api
    },

    /** Escape hatch: monta a linha na mão. Sempre devolve o nó criado. */
    row(variant, content) {
      const row = h(
        'div',
        { class: `i-log__row i-log__row--${variant}` },
        ico(variant === 'ok' ? 'check' : variant === 'fail' ? 'x' : 'alert'),
        content
      )
      list.append(row)
      emit(root, 'i:log', { variant, row })
      return row
    },

    clear() {
      list.replaceChildren()
      api.stop()
      return api
    },
  }

  return api
}
