/**
 * Stepper. O HTML declara os passos; o JS só move o estado — assim a
 * página funciona (mostrando o passo 1) mesmo se o JS falhar.
 *
 *   <nav class="i-stepper" data-i-stepper>
 *     <span class="i-label-caps i-stepper__title">Instalação em 3 passos</span>
 *     <div class="i-step" data-i-step>
 *       <span class="i-step__dot"></span>
 *       <div><b class="i-step__title">Instalar os workflows</b>
 *            <span class="i-step__desc">No seu n8n.</span></div>
 *     </div>
 *     …
 *   </nav>
 *
 *   const steps = StartSeUI.stepper('[data-i-stepper]')
 *   steps.active(2)   // passo 2 ativo, 1 vira concluído
 *   steps.done(3)     // tudo concluído
 */

import { qsa, h, emit, resolve } from './dom.js'

const CHECK = () => h('span', { class: 'i-ico i-ico--check i-ico--sm', 'aria-hidden': 'true' })

function paint(step, state, index) {
  step.classList.remove('i-step--done', 'i-step--active', 'i-step--future')
  step.classList.add(`i-step--${state}`)

  const dot = step.querySelector('.i-step__dot')
  if (dot) {
    dot.textContent = ''
    if (state === 'done') dot.append(CHECK())
    else dot.textContent = String(index + 1)
  }

  if (state === 'active') step.setAttribute('aria-current', 'step')
  else step.removeAttribute('aria-current')
}

export function stepper(target) {
  const root = resolve(target)
  if (!root) return null

  const steps = qsa('[data-i-step], .i-step', root)
  let current = 1

  const api = {
    get length() {
      return steps.length
    },
    get current() {
      return current
    },

    /** Ativa o passo n (1-based): anteriores viram concluídos, seguintes futuros. */
    active(n) {
      current = Math.min(Math.max(1, n), steps.length)
      steps.forEach((step, i) => {
        const at = i + 1
        paint(step, at < current ? 'done' : at === current ? 'active' : 'future', i)
      })
      emit(root, 'i:step', { step: current, total: steps.length })
      return api
    },

    /** Marca até n como concluído. Sem argumento, conclui todos. */
    done(n = steps.length) {
      const upTo = Math.min(Math.max(0, n), steps.length)
      steps.forEach((step, i) => {
        const at = i + 1
        paint(step, at <= upTo ? 'done' : at === upTo + 1 ? 'active' : 'future', i)
      })
      current = Math.min(upTo + 1, steps.length)
      emit(root, 'i:step', { step: current, total: steps.length, completed: upTo })
      return api
    },

    next() {
      return api.active(current + 1)
    },
  }

  // Respeita o passo que o HTML já marcou como ativo.
  const marked = steps.findIndex((s) => s.classList.contains('i-step--active'))
  return api.active(marked >= 0 ? marked + 1 : 1)
}
