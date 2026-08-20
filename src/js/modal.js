/**
 * Modal de confirmação. Só para ação irreversível ou que sobrescreve
 * algo do aluno.
 *
 * Declarativo:
 *   <button data-i-modal-open="#conf">Sobrescrever</button>
 *   <div class="i-modal-scrim" id="conf" hidden>
 *     <div class="i-modal">
 *       <h3 class="i-h-block">Isso vai sobrescrever 3 workflows</h3>
 *       …
 *       <button class="i-btn i-btn--tertiary" data-i-modal-close>Cancelar</button>
 *     </div>
 *   </div>
 *
 * Programático — resolve true/false:
 *   const ok = await StartSeUI.modal.confirm({
 *     title: 'Isso vai sobrescrever 3 workflows existentes',
 *     text: 'Sobrescrever apaga as alterações que você fez neles.',
 *     confirm: 'Sobrescrever', danger: true,
 *   })
 *
 * Esc cancela. Clique no scrim não fecha: para ação destrutiva, sair sem
 * querer é pior que um clique a mais. Use data-i-modal-dismissible para
 * liberar o clique fora.
 */

import { h, qs, emit, focusable, resolve } from './dom.js'

let openScrim = null
let lastFocus = null

export function open(target) {
  const scrim = resolve(target)
  if (!scrim || scrim === openScrim) return null

  if (openScrim) close(openScrim)
  lastFocus = document.activeElement

  const dialog = qs('.i-modal', scrim) ?? scrim
  dialog.setAttribute('role', 'dialog')
  dialog.setAttribute('aria-modal', 'true')

  const heading = qs('h1,h2,h3,h4,.i-h-block', dialog)
  if (heading && !dialog.getAttribute('aria-labelledby')) {
    if (!heading.id) heading.id = `i-modal-title-${Date.now().toString(36)}`
    dialog.setAttribute('aria-labelledby', heading.id)
  }

  scrim.hidden = false
  document.documentElement.classList.add('i-scroll-lock')
  openScrim = scrim
  ;(focusable(dialog)[0] ?? dialog).focus?.()
  emit(scrim, 'i:modalopen', {})
  return scrim
}

export function close(target) {
  const scrim = resolve(target) ?? openScrim
  if (!scrim) return

  scrim.hidden = true
  if (openScrim === scrim) {
    openScrim = null
    document.documentElement.classList.remove('i-scroll-lock')
    lastFocus?.focus?.()
    lastFocus = null
  }
  emit(scrim, 'i:modalclose', {})
}

/** Trap de foco + Esc. Registrado uma vez, no document. */
export function onKeydown(event) {
  if (!openScrim) return

  if (event.key === 'Escape') {
    event.preventDefault()
    close(openScrim)
    return
  }
  if (event.key !== 'Tab') return

  const stops = focusable(qs('.i-modal', openScrim) ?? openScrim)
  if (!stops.length) return

  const first = stops[0]
  const last = stops[stops.length - 1]
  const active = document.activeElement

  if (event.shiftKey && (active === first || !openScrim.contains(active))) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

export function onScrimClick(event) {
  if (!openScrim || event.target !== openScrim) return
  if (openScrim.hasAttribute('data-i-modal-dismissible')) close(openScrim)
}

/**
 * Modal construído na hora. O título nomeia a consequência —
 * nunca "Tem certeza?".
 */
export function confirm({
  title,
  text = '',
  confirm: confirmLabel = 'Confirmar',
  cancel: cancelLabel = 'Cancelar',
  alternative = null,
  danger = false,
} = {}) {
  return new Promise((resolveValue) => {
    const button = (label, variant) =>
      h('button', { type: 'button', class: `i-btn i-btn--${variant}` }, label)

    const cancelBtn = button(cancelLabel, 'tertiary')
    const confirmBtn = button(confirmLabel, danger ? 'danger' : 'primary')
    const altBtn = alternative ? button(alternative, 'secondary') : null

    const dialog = h(
      'div',
      { class: 'i-modal' },
      h('h3', { class: 'i-h-block' }, title),
      text ? h('p', { class: 'i-body', style: 'margin:0' }, text) : null,
      h(
        'div',
        { class: 'i-modal__actions' },
        cancelBtn,
        h('div', { class: 'i-modal__confirm' }, altBtn, confirmBtn)
      )
    )
    const scrim = h('div', { class: 'i-modal-scrim', hidden: true }, dialog)
    document.body.append(scrim)

    // Guard: close() emite i:modalclose, que também chama finish — sem a
    // flag o handler reentraria e o close viraria recursão.
    let settled = false
    const finish = (value) => {
      if (settled) return
      settled = true
      close(scrim)
      scrim.remove()
      resolveValue(value)
    }
    cancelBtn.addEventListener('click', () => finish(false))
    confirmBtn.addEventListener('click', () => finish(true))
    altBtn?.addEventListener('click', () => finish('alternative'))
    // Esc (que fecha por fora) conta como cancelar.
    scrim.addEventListener('i:modalclose', () => finish(false))

    open(scrim)
  })
}
