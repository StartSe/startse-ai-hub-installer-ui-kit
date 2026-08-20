/**
 * Barra de progresso. Só para execução com total conhecido.
 *
 *   <div data-i-progress data-i-progress-label="Publicando workflows"></div>
 *   const bar = StartSeUI.progress('[data-i-progress]')
 *   bar.set(7, 10)   // "7 de 10", 70%
 */

import { h, resolve } from './dom.js'

export function progress(target) {
  const root = resolve(target)
  if (!root) return null

  const label = h('span', { class: 'i-progress__label' }, root.dataset.iProgressLabel ?? '')
  const count = h('span', { class: 'i-mono' })
  const bar = h('div', {
    class: 'i-progress__bar',
    role: 'progressbar',
    'aria-valuemin': '0',
    'aria-valuenow': '0',
  })

  root.replaceChildren(
    h('div', { class: 'i-progress__head' }, label, count),
    h('div', { class: 'i-progress' }, bar)
  )

  return {
    set(current, total) {
      const done = Math.max(0, Math.min(current, total))
      bar.style.width = total > 0 ? `${(done / total) * 100}%` : '0'
      bar.setAttribute('aria-valuenow', String(done))
      bar.setAttribute('aria-valuemax', String(total))
      count.textContent = `${done} de ${total}`
      return this
    },
    label(text) {
      label.textContent = text
      return this
    },
  }
}
