/**
 * Motor da página de referência. Duas responsabilidades:
 *
 * 1. Renderizar a galeria de cores a partir de docs/tokens.data.js — que
 *    o build gera de src/tokens/tokens.json. Cor nova aparece aqui sem
 *    ninguém tocar no HTML.
 *
 * 2. Para cada <template data-demo>, montar o exemplo vivo E o snippet
 *    logo abaixo, a partir do MESMO HTML. É o que garante que o código
 *    mostrado é exatamente o código que está rodando ali.
 */

/* ---------- 1 · swatches ---------- */

function renderSwatches(hostId, list) {
  const host = document.getElementById(hostId)
  if (!host || !list) return

  host.replaceChildren(
    ...list.map(({ variable, value, use }) => {
      const card = document.createElement('div')
      card.className = 'doc-swatch'

      const chip = document.createElement('div')
      chip.className = 'doc-swatch__chip'
      chip.style.background = value

      const body = document.createElement('div')
      body.className = 'doc-swatch__body'
      body.append(
        Object.assign(document.createElement('code'), { className: 'doc-swatch__var', textContent: variable }),
        Object.assign(document.createElement('span'), { className: 'doc-swatch__hex', textContent: value }),
        Object.assign(document.createElement('span'), { className: 'doc-swatch__use', textContent: use })
      )

      card.append(chip, body)
      return card
    })
  )
}

/* ---------- 2 · demo + snippet a partir do mesmo template ---------- */

/** Remove a indentação comum, para o snippet não vir com 8 espaços. */
function dedent(html) {
  const lines = html.replace(/^\n+/, '').replace(/\s+$/, '').split('\n')
  const indents = lines
    .filter((line) => line.trim())
    .map((line) => line.match(/^\s*/)[0].length)
  const cut = Math.min(...indents, Infinity)
  return lines.map((line) => line.slice(cut)).join('\n')
}

function buildDemos() {
  for (const template of document.querySelectorAll('template[data-demo]')) {
    const host = template.parentElement
    const source = dedent(template.innerHTML)

    host.insertBefore(template.content.cloneNode(true), template)

    const pre = document.createElement('pre')
    pre.append(Object.assign(document.createElement('code'), { textContent: source }))

    const copyBtn = document.createElement('button')
    copyBtn.type = 'button'
    copyBtn.textContent = 'Copiar'
    copyBtn.addEventListener('click', async () => {
      await StartSeUI.copy(source)
      copyBtn.textContent = 'Copiado'
      setTimeout(() => (copyBtn.textContent = 'Copiar'), 2000)
    })

    const body = document.createElement('div')
    body.className = 'doc-code__body'
    body.append(pre, copyBtn)

    const details = document.createElement('details')
    details.className = 'doc-code'
    details.append(
      Object.assign(document.createElement('summary'), { textContent: 'HTML' }),
      body
    )
    host.append(details)
  }
}

/* ---------- 3 · demos interativos da página ---------- */

function wireLiveDemos() {
  // Log de execução: roda uma instalação de mentira, em loop.
  const logHost = document.querySelector('#demo-runlog')
  if (logHost) {
    const log = StartSeUI.runLog(logHost)
    const roteiro = [
      ['ok', 'Conectando ao seu n8n', 'versão 1.63 · API ok'],
      ['ok', 'Criando a credencial do Postgres', 'pooler · ssl'],
      ['warn', 'Chave do OpenRouter ausente', 'parecer sai pelo resumo'],
      ['fail', 'Publicando 10 workflows', 'A API recusou a chave (401). Gere outra em Settings → n8n API e tente de novo.'],
    ]

    const rodar = () => {
      log.clear()
      log.start('Publicando os workflows — leva alguns segundos.')
      roteiro.forEach(([kind, nome, detalhe], i) => {
        setTimeout(() => {
          if (kind === 'ok') log.ok(nome, detalhe)
          else if (kind === 'warn') log.warn(nome, detalhe)
          else log.fail(nome, { error: detalhe, retry: rodar })
        }, 900 * (i + 1))
      })
    }
    document.querySelector('#demo-runlog-start')?.addEventListener('click', rodar)
    rodar()
  }

  // Stepper: avança a cada clique.
  const stepHost = document.querySelector('#demo-stepper')
  if (stepHost) {
    const steps = StartSeUI.stepper(stepHost)
    document.querySelector('#demo-stepper-next')?.addEventListener('click', () => {
      steps.active(steps.current >= steps.length ? 1 : steps.current + 1)
    })
  }

  // Progresso.
  const barHost = document.querySelector('#demo-progress')
  if (barHost) {
    const bar = StartSeUI.progress(barHost)
    let at = 0
    bar.set(7, 10)
    setInterval(() => {
      at = (at + 1) % 11
      bar.set(at, 10)
    }, 1200)
  }

  // Modal programático.
  document.querySelector('#demo-confirm')?.addEventListener('click', async () => {
    const out = document.querySelector('#demo-confirm-out')
    const ok = await StartSeUI.modal.confirm({
      title: 'Isso vai sobrescrever 3 workflows existentes',
      text: 'Encontramos workflows com o mesmo nome no seu n8n. Sobrescrever apaga as alterações que você fez neles.',
      confirm: 'Sobrescrever',
      alternative: 'Manter os meus',
      danger: true,
    })
    out.textContent = `retornou: ${JSON.stringify(ok)}`
  })

  // Botão em carregando.
  const loadBtn = document.querySelector('#demo-loading')
  if (loadBtn) {
    const btn = StartSeUI.button(loadBtn)
    loadBtn.addEventListener('click', () => {
      btn.loading(true)
      setTimeout(() => btn.loading(false), 2200)
    })
  }

  // Rótulo do botão de tema acompanha o estado.
  const themeBtn = document.querySelector('#theme-toggle')
  if (themeBtn) {
    const sync = () => {
      themeBtn.querySelector('span').textContent =
        StartSeUI.theme.get() === 'dark' ? 'Alternar para light' : 'Alternar para dark'
    }
    document.documentElement.addEventListener('i:themechange', sync)
    sync()
  }
}

renderSwatches('swatches-light', window.I_TOKENS?.light)
renderSwatches('swatches-dark', window.I_TOKENS?.dark)
buildDemos()
StartSeUI.init()
wireLiveDemos()

const stamp = document.querySelector('[data-version]')
if (stamp) stamp.textContent = `v${window.I_TOKENS?.version ?? StartSeUI.version}`
