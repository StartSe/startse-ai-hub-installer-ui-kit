/**
 * Campo copiável. O botão vira "Copiado" por 2s e volta — é o
 * comportamento especificado na spec.
 *
 *   <div class="i-copy">
 *     <code>https://n8n.suaempresa.com/webhook/atendimento</code>
 *     <button data-i-copy>Copiar</button>
 *   </div>
 *
 * Com valor explícito: <button data-i-copy="texto a copiar">.
 */

import { emit } from './dom.js'

const RESET_MS = 2000
const timers = new WeakMap()

/** Copia para a área de transferência. Retorna Promise<boolean>. */
export async function copy(text) {
  const value = String(text ?? '')
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return legacyCopy(value)
  }
}

/** Fallback para contexto sem permissão de clipboard (http, iframe). */
function legacyCopy(value) {
  const area = document.createElement('textarea')
  area.value = value
  area.setAttribute('readonly', '')
  area.style.cssText = 'position:fixed;top:-1000px;opacity:0'
  document.body.append(area)
  area.select()
  let ok = false
  try {
    ok = document.execCommand('copy')
  } catch {
    ok = false
  }
  area.remove()
  return ok
}

/** Texto a copiar: o atributo, ou o conteúdo do .i-copy irmão. */
function sourceText(btn) {
  const explicit = btn.getAttribute('data-i-copy')
  if (explicit) return explicit

  const scope = btn.closest('.i-copy') ?? btn.parentElement
  const target = scope?.querySelector('[data-i-copy-source], code, .i-access__val, input')
  if (!target) return ''
  return (target.value ?? target.textContent ?? '').trim()
}

export async function handle(btn) {
  const text = sourceText(btn)
  if (!text) return

  const ok = await copy(text)
  emit(btn, 'i:copy', { text, ok })

  const done = btn.getAttribute('data-i-copy-done') ?? (ok ? 'Copiado' : 'Não deu')
  if (!btn.dataset.iCopyOriginal) btn.dataset.iCopyOriginal = btn.textContent.trim()

  btn.textContent = done
  clearTimeout(timers.get(btn))
  timers.set(
    btn,
    setTimeout(() => {
      btn.textContent = btn.dataset.iCopyOriginal
    }, RESET_MS)
  )
}
