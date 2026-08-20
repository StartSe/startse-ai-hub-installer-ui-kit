/**
 * StartSe · UI Kit dos Instaladores — camada de comportamento.
 *
 * Dois níveis de uso:
 *
 * 1. Declarativo — só marcação, nenhum JS de quem consome:
 *      data-i-copy            botão que copia (vira "Copiado" por 2s)
 *      data-i-tabs            container de tabs + data-i-tab="#painel"
 *      data-i-theme-toggle    alterna light/dark e persiste
 *      data-i-modal-open="#x" abre modal · data-i-modal-close fecha
 *      data-i-reveal          mostra/esconde o valor de um campo secreto
 *
 * 2. Programático — para o miolo do instalador:
 *      StartSeUI.stepper() · runLog() · progress() · button() · modal.confirm()
 *
 * Os cliques são tratados por delegação no document, uma vez só: HTML
 * injetado depois (passo que aparece, log que cresce) já funciona sem
 * precisar chamar init() de novo.
 */

import { closestAttr } from './dom.js'
import * as themeApi from './theme.js'
import * as modalApi from './modal.js'
import { handle as handleCopy, copy } from './copy.js'
import { setup as setupTabs, select as selectTab } from './tabs.js'
import { stepper } from './stepper.js'
import { runLog } from './runlog.js'
import { progress } from './progress.js'
import { button } from './button.js'

export const version = __VERSION__

let delegated = false

function onClick(event) {
  const target = event.target

  const copyBtn = closestAttr(target, 'data-i-copy')
  if (copyBtn) {
    event.preventDefault()
    handleCopy(copyBtn)
    return
  }

  const themeBtn = closestAttr(target, 'data-i-theme-toggle')
  if (themeBtn) {
    event.preventDefault()
    themeApi.toggle()
    return
  }

  const opener = closestAttr(target, 'data-i-modal-open')
  if (opener) {
    event.preventDefault()
    modalApi.open(opener.getAttribute('data-i-modal-open'))
    return
  }

  if (closestAttr(target, 'data-i-modal-close')) {
    event.preventDefault()
    modalApi.close()
    return
  }

  const reveal = closestAttr(target, 'data-i-reveal')
  if (reveal) {
    event.preventDefault()
    toggleReveal(reveal)
    return
  }

  const tab = closestAttr(target, 'data-i-tab')
  if (tab) {
    event.preventDefault()
    selectTab(tab)
  }
}

function toggleReveal(btn) {
  const field =
    (btn.getAttribute('data-i-reveal') && document.querySelector(btn.getAttribute('data-i-reveal'))) ||
    btn.closest('.i-field__wrap, .i-field')?.querySelector('.i-field__input')
  if (!field) return

  const hidden = field.type === 'password'
  field.type = hidden ? 'text' : 'password'
  btn.setAttribute('aria-pressed', String(hidden))
  btn.setAttribute('aria-label', hidden ? 'Esconder o valor' : 'Mostrar o valor')

  const ico = btn.querySelector('.i-ico')
  if (ico) ico.className = `i-ico i-ico--${hidden ? 'eye-off' : 'eye'}`
}

/**
 * Prepara a marcação declarativa de um pedaço da página. Idempotente —
 * chame de novo depois de injetar HTML que contenha tabs.
 */
export function init(root = document) {
  if (!delegated) {
    delegated = true
    document.addEventListener('click', onClick)
    document.addEventListener('keydown', modalApi.onKeydown)
    document.addEventListener('click', modalApi.onScrimClick, true)
    themeApi.boot()
  }
  setupTabs(root)
  return root
}

export const theme = { get: themeApi.get, set: themeApi.set, toggle: themeApi.toggle }
export const modal = { open: modalApi.open, close: modalApi.close, confirm: modalApi.confirm }
export { copy, stepper, runLog, progress, button }

/* Auto-init: o kit é usado por <script src>, sem bundler. */
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => init())
  } else {
    init()
  }
}
