/**
 * Tabs para vistas paralelas do mesmo conteúdo (log resumido × completo).
 * Nunca para os passos — passos são o stepper.
 *
 *   <div class="i-tabs" data-i-tabs>
 *     <button class="i-tab i-tab--active" data-i-tab="#resumo">Resumo</button>
 *     <button class="i-tab" data-i-tab="#log">Log completo</button>
 *   </div>
 *   <div id="resumo" class="i-tabpanel">…</div>
 *   <div id="log" class="i-tabpanel" hidden>…</div>
 *
 * O init aplica os papéis ARIA e liga as setas do teclado.
 */

import { qsa, emit } from './dom.js'

let uid = 0
const ready = new WeakSet()

const tabsOf = (list) => qsa('[data-i-tab]', list)
const panelOf = (tab) => document.querySelector(tab.getAttribute('data-i-tab'))

export function select(tab, { focus = false } = {}) {
  const list = tab.closest('[data-i-tabs]')
  if (!list) return

  for (const other of tabsOf(list)) {
    const active = other === tab
    other.classList.toggle('i-tab--active', active)
    other.setAttribute('aria-selected', String(active))
    other.tabIndex = active ? 0 : -1

    const panel = panelOf(other)
    if (panel) panel.hidden = !active
  }

  if (focus) tab.focus()
  emit(list, 'i:tabchange', { tab, panel: panelOf(tab) })
}

function onKeydown(event) {
  const tab = event.target.closest?.('[data-i-tab]')
  if (!tab) return

  const list = tab.closest('[data-i-tabs]')
  if (!list) return

  const tabs = tabsOf(list)
  const at = tabs.indexOf(tab)
  const moves = {
    ArrowRight: at + 1,
    ArrowLeft: at - 1,
    Home: 0,
    End: tabs.length - 1,
  }
  if (!(event.key in moves)) return

  event.preventDefault()
  const next = tabs[(moves[event.key] + tabs.length) % tabs.length]
  select(next, { focus: true })
}

/** Chamado por init(root) — idempotente. */
export function setup(root) {
  for (const list of qsa('[data-i-tabs]', root)) {
    if (ready.has(list)) continue
    ready.add(list)

    list.setAttribute('role', 'tablist')
    const tabs = tabsOf(list)
    let selected = tabs.find((t) => t.classList.contains('i-tab--active')) ?? tabs[0]

    for (const tab of tabs) {
      if (!tab.id) tab.id = `i-tab-${++uid}`
      tab.setAttribute('role', 'tab')

      const panel = panelOf(tab)
      if (panel) {
        panel.setAttribute('role', 'tabpanel')
        panel.setAttribute('aria-labelledby', tab.id)
        if (!panel.hasAttribute('tabindex')) panel.tabIndex = 0
        tab.setAttribute('aria-controls', panel.id)
      }
    }

    list.addEventListener('keydown', onKeydown)
    if (selected) select(selected)
  }
}
