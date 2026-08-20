/**
 * Estado de carregando de um botão: o rótulo sai, o spinner entra, o
 * fundo não muda — e a largura é travada antes da troca, para o botão
 * não pular na tela.
 *
 *   const btn = StartSeUI.button('#instalar')
 *   btn.loading(true)
 *   … await instalar() …
 *   btn.loading(false)
 */

import { h, resolve } from './dom.js'

export function button(target) {
  const node = resolve(target)
  if (!node) return null

  // O rótulo precisa estar num span para poder sumir sem perder o texto.
  let label = node.querySelector('.i-btn__label')
  if (!label) {
    label = h('span', { class: 'i-btn__label' })
    label.append(...node.childNodes)
    node.append(label)
  }
  const spinner = h('span', { class: 'i-spinner', 'aria-hidden': 'true' })

  return {
    loading(on = true) {
      if (on) {
        node.style.minWidth = `${node.offsetWidth}px`
        node.classList.add('is-loading')
        node.setAttribute('aria-busy', 'true')
        node.disabled = true
        if (!spinner.isConnected) node.append(spinner)
      } else {
        node.classList.remove('is-loading')
        node.removeAttribute('aria-busy')
        node.disabled = false
        spinner.remove()
        node.style.minWidth = ''
      }
      return this
    },
    label(text) {
      label.textContent = text
      return this
    },
  }
}
