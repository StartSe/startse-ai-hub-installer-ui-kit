/**
 * Tema. Sem escolha salva, o CSS já segue prefers-color-scheme; este
 * módulo só entra quando o usuário escolhe explicitamente.
 *
 * Para não piscar no carregamento, quem consome deve inlinar no <head>,
 * antes do <link> do kit:
 *
 *   <script>try{var t=localStorage.getItem('startse-ui-theme');
 *   if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
 */

import { emit } from './dom.js'

const KEY = 'startse-ui-theme'
const root = () => document.documentElement

function store(value) {
  try {
    if (value) localStorage.setItem(KEY, value)
    else localStorage.removeItem(KEY)
  } catch {
    /* modo privado / storage bloqueado: o tema vale só para esta sessão */
  }
}

/** 'light' | 'dark' — o efetivo, já considerando a preferência do SO. */
export function get() {
  const explicit = root().dataset.theme
  if (explicit === 'light' || explicit === 'dark') return explicit
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** set('dark' | 'light') força; set(null) volta a seguir o sistema. */
export function set(value) {
  if (value === null || value === undefined) {
    delete root().dataset.theme
    store(null)
  } else {
    root().dataset.theme = value
    store(value)
  }
  const theme = get()
  syncToggles(theme)
  emit(root(), 'i:themechange', { theme })
  return theme
}

export function toggle() {
  return set(get() === 'dark' ? 'light' : 'dark')
}

function syncToggles(theme) {
  for (const btn of document.querySelectorAll('[data-i-theme-toggle]')) {
    btn.setAttribute('aria-pressed', String(theme === 'dark'))
  }
}

/** Restaura a escolha salva e mantém os botões em sincronia com o SO. */
export function boot() {
  let saved = null
  try {
    saved = localStorage.getItem(KEY)
  } catch {
    /* ignora */
  }
  if (saved === 'light' || saved === 'dark') root().dataset.theme = saved
  syncToggles(get())

  window
    .matchMedia?.('(prefers-color-scheme: dark)')
    .addEventListener?.('change', () => {
      if (!root().dataset.theme) {
        const theme = get()
        syncToggles(theme)
        emit(root(), 'i:themechange', { theme })
      }
    })
}
