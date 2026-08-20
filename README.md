# UI Kit dos Instaladores · StartSe

Linguagem visual compartilhada para as páginas de instalação das soluções.
Quem consome põe duas tags na página, usa as classes `.i-*` e o instalador
já sai padronizado — light e dark inclusos, sem build e sem dependência.

Derivado do StartSe Design System (Barlow + IBM Plex Sans), com os
componentes específicos de instalação prontos: stepper, log de execução,
cartão de acesso, bloco de conclusão.

```
min.css  20,6 kB  (4,8 kB gzip)
min.js   10,9 kB  (4,4 kB gzip)
```

---

## Para quem vai usar o kit

No `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700;900&family=IBM+Plex+Sans:wght@400;500;600&display=swap" rel="stylesheet">

<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/StartSe/startse-ai-hub-installer-ui-kit@v0.1.0/dist/startse-installer.min.css">
```

Antes do `</body>`:

```html
<script src="https://cdn.jsdelivr.net/gh/StartSe/startse-ai-hub-installer-ui-kit@v0.1.0/dist/startse-installer.min.js"></script>
```

As fontes do Google são pré-requisito: sem elas a tela cai no `system-ui`
e perde a identidade.

**Opcional, mas recomendado** — evita o flash de tema errado quando o
usuário já escolheu dark. Vai no `<head>`, antes do CSS:

```html
<script>try{var t=localStorage.getItem('startse-ui-theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
```

### Documentação

**https://startse.github.io/startse-ai-hub-installer-ui-kit/**

A referência completa: tokens, todos os componentes com o HTML exato ao
lado, os comportamentos por atributo, a API JS e as regras de voz. Cada
componente tem um botão que copia o HTML dele.

O **[exemplo completo](https://startse.github.io/startse-ai-hub-installer-ui-kit/docs/exemplo.html)**
é o gabarito: um instalador de 3 passos funcionando ponta a ponta. Para
começar um instalador novo, copie `docs/exemplo.html` e troque as funções
que simulam as chamadas.

Localmente: `npm run dev` e abra `http://localhost:4178`.

### Os dois níveis de uso

**Declarativo** — só marcação, nenhum JS seu:

```html
<div class="i-copy">
  <code>https://n8n.suaempresa.com/webhook/atendimento</code>
  <button data-i-copy>Copiar</button>
</div>
```

**Programático** — para o miolo do instalador:

```js
const passos = StartSeUI.stepper('[data-i-stepper]')
const log    = StartSeUI.runLog('#execucao')
const botao  = StartSeUI.button('#instalar')

botao.loading(true)
log.start('Publicando os workflows — leva alguns segundos.')
log.ok('Conectando ao seu n8n', 'versão 1.63 · API ok')
log.fail('Publicando 10 workflows', {
  error: 'A API recusou a chave (401). Gere outra em Settings → n8n API.',
  retry: instalar,
})
passos.active(2)
```

Todo texto que você passa entra por `textContent`. Mensagem de erro de
API é dado não confiável e o kit trata como tal — não injete HTML nela.

---

## Para quem vai manter o kit

### Estrutura

```
src/tokens/tokens.json     fonte única de cor, fonte e medida estrutural
src/css/                   base, tipografia, ícones, 1 arquivo por componente
src/js/                    1 arquivo por comportamento
build/                     tokens.mjs · build.mjs · check-dist.mjs
docs/                      referência + exemplo, consumindo dist/
dist/                      COMMITADO — é o que a CDN serve
.github/workflows/         ci.yml (dist em sincronia) · pages.yml (docs)
```

O design doc que originou o kit (tokens com descrição de uso, spec escrita
de cada componente, regras de voz) não é versionado aqui — ele vive na
ferramenta de design. Continua sendo a fonte de verdade visual: mudança de
design entra por lá, depois em `src/tokens/tokens.json` e `src/css/`, e por
último na spec de `docs/index.html`.

Regras que sustentam isso:

1. **Nenhum arquivo em `src/css` contém um valor literal** de cor, família
   de fonte ou medida estrutural — só `var(--i-*)`. Trocar a paleta é um
   commit em `tokens.json`.
2. **Um arquivo por componente**, concatenado no build. Diff pequeno,
   revisão fácil.
3. **`docs/` consome `dist/`**, nunca `src/`. Se a doc quebrou, o bundle
   quebrou.
4. **O snippet de cada componente na doc é gerado do próprio demo**
   (`<template data-demo>`), então não existe HTML documentado que
   divergiu do que roda.
5. **A galeria de cores da doc é gerada de `tokens.json`** pelo build.
   Cor nova aparece na doc sem ninguém editar HTML.

### Comandos

```bash
npm install
npm run build     # gera dist/
npm run dev       # build --watch + servidor em localhost:4178
npm run check     # falha se dist/ não confere com src/  (roda no CI)
```

### GitHub Pages

`.github/workflows/pages.yml` publica a documentação em todo push na
`main`. Ele **rebuilda** em vez de confiar no `dist/` commitado, então o
site sempre reflete o `src/` daquele commit.

O site é montado com `docs/` e `dist/` lado a lado — a mesma forma do
repo, para os caminhos relativos das docs continuarem valendo — e a raiz
redireciona para `/docs/`.

Para ligar, uma vez: **Settings → Pages → Source: GitHub Actions**.

Isso publica um site público. O código do kit não tem segredo, mas
confira antes se algum exemplo em `docs/` não ficou com URL ou dado
interno — o `exemplo.html` usa só valores fictícios (`suaempresa.com`).

### Como adicionar um componente

1. Crie `src/css/components/nome.css` e adicione o `@import` em
   `src/css/index.css` (na seção de componentes — utilitários ficam por
   último de propósito, para vencerem por ordem).
2. Se ele precisar de comportamento, crie `src/js/nome.js` e exporte no
   `src/js/index.js`. Comportamento de clique entra na delegação do
   `onClick`, não com listener por elemento — assim HTML injetado depois
   funciona sem re-init.
3. Documente em `docs/index.html` com um `<template data-demo>`: o
   exemplo vivo e o snippet saem do mesmo markup.
4. `npm run build` e commite `dist/` junto.

### Como publicar uma versão

A URL da CDN aponta para uma tag do git, então **a tag é o release**.

```bash
npm run build            # dist/ atualizado
npm run check            # confirma que confere
npm version minor        # 0.1.0 → 0.2.0, cria o commit e a tag
git push && git push --tags
```

A partir daí a URL `@v0.2.0` existe e é imutável. jsDelivr cacheia por
tempo indeterminado o que já foi servido — é a garantia de que um
instalador publicado não muda debaixo de quem o usa.

**Versionamento:**

| Mudança | Versão |
|---|---|
| Cor, medida ou texto de spec | patch (`0.1.0` → `0.1.1`) |
| Componente ou comportamento novo | minor (`0.1.0` → `0.2.0`) |
| Classe renomeada ou removida, token removido | major |

Enquanto estiver em `0.x`, considere minor como potencialmente
quebrável — e avise no canal das soluções antes.

**Nunca reescreva uma tag publicada.** Se saiu errada, publique a
seguinte. Reescrever muda o CSS de instaladores que já estão no ar.

### Consumo por bundler

Se algum dia um instalador for um app com build:

```js
import * as StartSeUI from '@startse/ai-hub-installer-ui-kit'   // dist/*.esm.js
import '@startse/ai-hub-installer-ui-kit/css'
import tokens from '@startse/ai-hub-installer-ui-kit/tokens'    // valores em JS
```

O pacote é `private: true` — instale por URL de git ou publique no
registry interno antes de usar assim.

---

## Compatibilidade

Alvo do build: `>= 0.5%, last 2 versions, not dead`. Sem IE, sem
polyfill. Usa `mask-image` (ícones), custom properties, `:focus-visible`
e `prefers-color-scheme` — todos com suporte amplo desde 2022.

Sem `data-theme` no `<html>`, o kit segue a preferência do sistema.
Com `data-theme="light"` ou `"dark"`, o autor manda.
