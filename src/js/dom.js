/**
 * Helpers internos. Nada aqui é exportado no bundle público.
 *
 * Regra dura: todo texto que vem do consumidor (nome de etapa, mensagem
 * de erro da API do n8n, detalhe técnico) entra por textContent. O kit
 * nunca usa innerHTML com dado de terceiro — resposta de API é conteúdo
 * não confiável.
 */

export const qs = (sel, root = document) => root.querySelector(sel)
export const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel))

/** Aceita seletor, elemento ou null. Facilita a API pública. */
export function resolve(target, root = document) {
  if (!target) return null
  if (typeof target === 'string') return qs(target, root)
  return target.nodeType === 1 ? target : null
}

/** h('span', { class: 'i-ico' }, 'texto') — children são sempre texto. */
export function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue
    if (key === 'class') node.className = value
    else if (key === 'dataset') Object.assign(node.dataset, value)
    else node.setAttribute(key, value === true ? '' : String(value))
  }
  for (const child of children) {
    if (child == null || child === false) continue
    node.append(child.nodeType ? child : document.createTextNode(String(child)))
  }
  return node
}

export function emit(node, name, detail) {
  const event = new CustomEvent(name, { detail, bubbles: true, cancelable: true })
  node.dispatchEvent(event)
  return event
}

/** Sobe do alvo do clique até o elemento que carrega o data-attribute. */
export function closestAttr(start, attr) {
  return start instanceof Element ? start.closest(`[${attr}]`) : null
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export const focusable = (root) => qsa(FOCUSABLE, root).filter((node) => node.offsetParent !== null)
