/*! StartSe · UI Kit dos Instaladores v0.1.1 — ESM
 * Documentação e componentes: docs/index.html
 * Gerado por build/build.mjs. Não edite dist/ à mão. */


// src/js/dom.js
var qs = (sel, root2 = document) => root2.querySelector(sel);
var qsa = (sel, root2 = document) => Array.from(root2.querySelectorAll(sel));
function resolve(target, root2 = document) {
  if (!target) return null;
  if (typeof target === "string") return qs(target, root2);
  return target.nodeType === 1 ? target : null;
}
function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value == null || value === false) continue;
    if (key === "class") node.className = value;
    else if (key === "dataset") Object.assign(node.dataset, value);
    else node.setAttribute(key, value === true ? "" : String(value));
  }
  for (const child of children) {
    if (child == null || child === false) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}
function emit(node, name, detail) {
  const event = new CustomEvent(name, { detail, bubbles: true, cancelable: true });
  node.dispatchEvent(event);
  return event;
}
function closestAttr(start, attr) {
  return start instanceof Element ? start.closest(`[${attr}]`) : null;
}
var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
var focusable = (root2) => qsa(FOCUSABLE, root2).filter((node) => node.offsetParent !== null);

// src/js/theme.js
var KEY = "startse-ui-theme";
var root = () => document.documentElement;
function store(value) {
  try {
    if (value) localStorage.setItem(KEY, value);
    else localStorage.removeItem(KEY);
  } catch {
  }
}
function get() {
  const explicit = root().dataset.theme;
  if (explicit === "light" || explicit === "dark") return explicit;
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}
function set(value) {
  if (value === null || value === void 0) {
    delete root().dataset.theme;
    store(null);
  } else {
    root().dataset.theme = value;
    store(value);
  }
  const theme2 = get();
  syncToggles(theme2);
  emit(root(), "i:themechange", { theme: theme2 });
  return theme2;
}
function toggle() {
  return set(get() === "dark" ? "light" : "dark");
}
function syncToggles(theme2) {
  for (const btn of document.querySelectorAll("[data-i-theme-toggle]")) {
    btn.setAttribute("aria-pressed", String(theme2 === "dark"));
  }
}
function boot() {
  let saved = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
  }
  if (saved === "light" || saved === "dark") root().dataset.theme = saved;
  syncToggles(get());
  window.matchMedia?.("(prefers-color-scheme: dark)").addEventListener?.("change", () => {
    if (!root().dataset.theme) {
      const theme2 = get();
      syncToggles(theme2);
      emit(root(), "i:themechange", { theme: theme2 });
    }
  });
}

// src/js/modal.js
var openScrim = null;
var lastFocus = null;
function open(target) {
  const scrim = resolve(target);
  if (!scrim || scrim === openScrim) return null;
  if (openScrim) close(openScrim);
  lastFocus = document.activeElement;
  const dialog = qs(".i-modal", scrim) ?? scrim;
  dialog.setAttribute("role", "dialog");
  dialog.setAttribute("aria-modal", "true");
  const heading = qs("h1,h2,h3,h4,.i-h-block", dialog);
  if (heading && !dialog.getAttribute("aria-labelledby")) {
    if (!heading.id) heading.id = `i-modal-title-${Date.now().toString(36)}`;
    dialog.setAttribute("aria-labelledby", heading.id);
  }
  scrim.hidden = false;
  document.documentElement.classList.add("i-scroll-lock");
  openScrim = scrim;
  (focusable(dialog)[0] ?? dialog).focus?.();
  emit(scrim, "i:modalopen", {});
  return scrim;
}
function close(target) {
  const scrim = resolve(target) ?? openScrim;
  if (!scrim) return;
  scrim.hidden = true;
  if (openScrim === scrim) {
    openScrim = null;
    document.documentElement.classList.remove("i-scroll-lock");
    lastFocus?.focus?.();
    lastFocus = null;
  }
  emit(scrim, "i:modalclose", {});
}
function onKeydown(event) {
  if (!openScrim) return;
  if (event.key === "Escape") {
    event.preventDefault();
    close(openScrim);
    return;
  }
  if (event.key !== "Tab") return;
  const stops = focusable(qs(".i-modal", openScrim) ?? openScrim);
  if (!stops.length) return;
  const first = stops[0];
  const last = stops[stops.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !openScrim.contains(active))) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && active === last) {
    event.preventDefault();
    first.focus();
  }
}
function onScrimClick(event) {
  if (!openScrim || event.target !== openScrim) return;
  if (openScrim.hasAttribute("data-i-modal-dismissible")) close(openScrim);
}
function confirm({
  title,
  text = "",
  confirm: confirmLabel = "Confirmar",
  cancel: cancelLabel = "Cancelar",
  alternative = null,
  danger = false
} = {}) {
  return new Promise((resolveValue) => {
    const button2 = (label, variant) => h("button", { type: "button", class: `i-btn i-btn--${variant}` }, label);
    const cancelBtn = button2(cancelLabel, "tertiary");
    const confirmBtn = button2(confirmLabel, danger ? "danger" : "primary");
    const altBtn = alternative ? button2(alternative, "secondary") : null;
    const dialog = h(
      "div",
      { class: "i-modal" },
      h("h3", { class: "i-h-block" }, title),
      text ? h("p", { class: "i-body", style: "margin:0" }, text) : null,
      h(
        "div",
        { class: "i-modal__actions" },
        cancelBtn,
        h("div", { class: "i-modal__confirm" }, altBtn, confirmBtn)
      )
    );
    const scrim = h("div", { class: "i-modal-scrim", hidden: true }, dialog);
    document.body.append(scrim);
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      close(scrim);
      scrim.remove();
      resolveValue(value);
    };
    cancelBtn.addEventListener("click", () => finish(false));
    confirmBtn.addEventListener("click", () => finish(true));
    altBtn?.addEventListener("click", () => finish("alternative"));
    scrim.addEventListener("i:modalclose", () => finish(false));
    open(scrim);
  });
}

// src/js/copy.js
var RESET_MS = 2e3;
var timers = /* @__PURE__ */ new WeakMap();
async function copy(text) {
  const value = String(text ?? "");
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return legacyCopy(value);
  }
}
function legacyCopy(value) {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.cssText = "position:fixed;top:-1000px;opacity:0";
  document.body.append(area);
  area.select();
  let ok = false;
  try {
    ok = document.execCommand("copy");
  } catch {
    ok = false;
  }
  area.remove();
  return ok;
}
function sourceText(btn) {
  const explicit = btn.getAttribute("data-i-copy");
  if (explicit) return explicit;
  const scope = btn.closest(".i-copy") ?? btn.parentElement;
  const target = scope?.querySelector("[data-i-copy-source], code, .i-access__val, input");
  if (!target) return "";
  return (target.value ?? target.textContent ?? "").trim();
}
async function handle(btn) {
  const text = sourceText(btn);
  if (!text) return;
  const ok = await copy(text);
  emit(btn, "i:copy", { text, ok });
  const done = btn.getAttribute("data-i-copy-done") ?? (ok ? "Copiado" : "N\xE3o deu");
  if (!btn.dataset.iCopyOriginal) btn.dataset.iCopyOriginal = btn.textContent.trim();
  btn.textContent = done;
  clearTimeout(timers.get(btn));
  timers.set(
    btn,
    setTimeout(() => {
      btn.textContent = btn.dataset.iCopyOriginal;
    }, RESET_MS)
  );
}

// src/js/tabs.js
var uid = 0;
var ready = /* @__PURE__ */ new WeakSet();
var tabsOf = (list) => qsa("[data-i-tab]", list);
var panelOf = (tab) => document.querySelector(tab.getAttribute("data-i-tab"));
function select(tab, { focus = false } = {}) {
  const list = tab.closest("[data-i-tabs]");
  if (!list) return;
  for (const other of tabsOf(list)) {
    const active = other === tab;
    other.classList.toggle("i-tab--active", active);
    other.setAttribute("aria-selected", String(active));
    other.tabIndex = active ? 0 : -1;
    const panel = panelOf(other);
    if (panel) panel.hidden = !active;
  }
  if (focus) tab.focus();
  emit(list, "i:tabchange", { tab, panel: panelOf(tab) });
}
function onKeydown2(event) {
  const tab = event.target.closest?.("[data-i-tab]");
  if (!tab) return;
  const list = tab.closest("[data-i-tabs]");
  if (!list) return;
  const tabs = tabsOf(list);
  const at = tabs.indexOf(tab);
  const moves = {
    ArrowRight: at + 1,
    ArrowLeft: at - 1,
    Home: 0,
    End: tabs.length - 1
  };
  if (!(event.key in moves)) return;
  event.preventDefault();
  const next = tabs[(moves[event.key] + tabs.length) % tabs.length];
  select(next, { focus: true });
}
function setup(root2) {
  for (const list of qsa("[data-i-tabs]", root2)) {
    if (ready.has(list)) continue;
    ready.add(list);
    list.setAttribute("role", "tablist");
    const tabs = tabsOf(list);
    let selected = tabs.find((t) => t.classList.contains("i-tab--active")) ?? tabs[0];
    for (const tab of tabs) {
      if (!tab.id) tab.id = `i-tab-${++uid}`;
      tab.setAttribute("role", "tab");
      const panel = panelOf(tab);
      if (panel) {
        panel.setAttribute("role", "tabpanel");
        panel.setAttribute("aria-labelledby", tab.id);
        if (!panel.hasAttribute("tabindex")) panel.tabIndex = 0;
        tab.setAttribute("aria-controls", panel.id);
      }
    }
    list.addEventListener("keydown", onKeydown2);
    if (selected) select(selected);
  }
}

// src/js/stepper.js
var CHECK = () => h("span", { class: "i-ico i-ico--check i-ico--sm", "aria-hidden": "true" });
function paint(step, state, index) {
  step.classList.remove("i-step--done", "i-step--active", "i-step--future");
  step.classList.add(`i-step--${state}`);
  const dot = step.querySelector(".i-step__dot");
  if (dot) {
    dot.textContent = "";
    if (state === "done") dot.append(CHECK());
    else dot.textContent = String(index + 1);
  }
  if (state === "active") step.setAttribute("aria-current", "step");
  else step.removeAttribute("aria-current");
}
function stepper(target) {
  const root2 = resolve(target);
  if (!root2) return null;
  const steps = qsa("[data-i-step], .i-step", root2);
  let current = 1;
  const api = {
    get length() {
      return steps.length;
    },
    get current() {
      return current;
    },
    /** Ativa o passo n (1-based): anteriores viram concluídos, seguintes futuros. */
    active(n) {
      current = Math.min(Math.max(1, n), steps.length);
      steps.forEach((step, i) => {
        const at = i + 1;
        paint(step, at < current ? "done" : at === current ? "active" : "future", i);
      });
      emit(root2, "i:step", { step: current, total: steps.length });
      return api;
    },
    /** Marca até n como concluído. Sem argumento, conclui todos. */
    done(n = steps.length) {
      const upTo = Math.min(Math.max(0, n), steps.length);
      steps.forEach((step, i) => {
        const at = i + 1;
        paint(step, at <= upTo ? "done" : at === upTo + 1 ? "active" : "future", i);
      });
      current = Math.min(upTo + 1, steps.length);
      emit(root2, "i:step", { step: current, total: steps.length, completed: upTo });
      return api;
    },
    next() {
      return api.active(current + 1);
    }
  };
  const marked = steps.findIndex((s) => s.classList.contains("i-step--active"));
  return api.active(marked >= 0 ? marked + 1 : 1);
}

// src/js/runlog.js
var ico = (variant) => h("span", { class: `i-ico i-ico--${variant} i-ico--sm`, "aria-hidden": "true" });
function runLog(target) {
  const root2 = resolve(target);
  if (!root2) return null;
  root2.classList.add("i-stack", "i-stack--tight");
  const run = h("div", { class: "i-run", role: "status", "aria-live": "polite", hidden: true });
  const list = h("div", { class: "i-log", "aria-live": "polite", "aria-relevant": "additions" });
  root2.replaceChildren(run, list);
  const api = {
    /** Frase do que está rodando. Sempre com expectativa de tempo. */
    start(message) {
      run.hidden = false;
      run.replaceChildren(h("span", { class: "i-spinner", "aria-hidden": "true" }), message ?? "");
      return api;
    },
    /** Para o spinner sem apagar o log. */
    stop() {
      run.hidden = true;
      run.replaceChildren();
      return api;
    },
    /** Etapa concluída: nome à esquerda, detalhe técnico em mono à direita. */
    ok(name, detail) {
      const line = h(
        "span",
        { class: "i-log__line" },
        h("span", {}, name),
        detail ? h("span", { class: "i-log__det" }, detail) : null
      );
      api.row("ok", line);
      return api;
    },
    /** Condição degradada que não bloqueia a instalação. */
    warn(name, detail) {
      const line = h(
        "span",
        { class: "i-log__line" },
        h("span", {}, name),
        detail ? h("span", { class: "i-log__det" }, detail) : null
      );
      api.row("warn", line);
      return api;
    },
    /**
     * Falha: interrompe o log, nomeia a causa e oferece a próxima ação.
     * retry é uma função — o botão só aparece se ela existir.
     */
    fail(name, { error, retry, retryLabel = "Tentar de novo" } = {}) {
      const body = h("span", { class: "i-log__body" }, name);
      if (error) body.append(h("span", { class: "i-log__err" }, error));
      if (typeof retry === "function") {
        const btn = h("button", { type: "button", class: "i-btn i-btn--secondary" }, retryLabel);
        btn.addEventListener("click", () => retry());
        body.append(btn);
      }
      api.stop();
      const row = api.row("fail", body);
      row.setAttribute("role", "alert");
      return api;
    },
    /** Escape hatch: monta a linha na mão. Sempre devolve o nó criado. */
    row(variant, content) {
      const row = h(
        "div",
        { class: `i-log__row i-log__row--${variant}` },
        ico(variant === "ok" ? "check" : variant === "fail" ? "x" : "alert"),
        content
      );
      list.append(row);
      emit(root2, "i:log", { variant, row });
      return row;
    },
    clear() {
      list.replaceChildren();
      api.stop();
      return api;
    }
  };
  return api;
}

// src/js/progress.js
function progress(target) {
  const root2 = resolve(target);
  if (!root2) return null;
  const label = h("span", { class: "i-progress__label" }, root2.dataset.iProgressLabel ?? "");
  const count = h("span", { class: "i-mono" });
  const bar = h("div", {
    class: "i-progress__bar",
    role: "progressbar",
    "aria-valuemin": "0",
    "aria-valuenow": "0"
  });
  root2.replaceChildren(
    h("div", { class: "i-progress__head" }, label, count),
    h("div", { class: "i-progress" }, bar)
  );
  return {
    set(current, total) {
      const done = Math.max(0, Math.min(current, total));
      bar.style.width = total > 0 ? `${done / total * 100}%` : "0";
      bar.setAttribute("aria-valuenow", String(done));
      bar.setAttribute("aria-valuemax", String(total));
      count.textContent = `${done} de ${total}`;
      return this;
    },
    label(text) {
      label.textContent = text;
      return this;
    }
  };
}

// src/js/button.js
function button(target) {
  const node = resolve(target);
  if (!node) return null;
  let label = node.querySelector(".i-btn__label");
  if (!label) {
    label = h("span", { class: "i-btn__label" });
    label.append(...node.childNodes);
    node.append(label);
  }
  const spinner = h("span", { class: "i-spinner", "aria-hidden": "true" });
  return {
    loading(on = true) {
      if (on) {
        node.style.minWidth = `${node.offsetWidth}px`;
        node.classList.add("is-loading");
        node.setAttribute("aria-busy", "true");
        node.disabled = true;
        if (!spinner.isConnected) node.append(spinner);
      } else {
        node.classList.remove("is-loading");
        node.removeAttribute("aria-busy");
        node.disabled = false;
        spinner.remove();
        node.style.minWidth = "";
      }
      return this;
    },
    label(text) {
      label.textContent = text;
      return this;
    }
  };
}

// src/js/index.js
var version = "0.1.1";
var delegated = false;
function onClick(event) {
  const target = event.composedPath?.()[0] ?? event.target;
  const copyBtn = closestAttr(target, "data-i-copy");
  if (copyBtn) {
    event.preventDefault();
    handle(copyBtn);
    return;
  }
  const themeBtn = closestAttr(target, "data-i-theme-toggle");
  if (themeBtn) {
    event.preventDefault();
    toggle();
    return;
  }
  const opener = closestAttr(target, "data-i-modal-open");
  if (opener) {
    event.preventDefault();
    open(opener.getAttribute("data-i-modal-open"));
    return;
  }
  if (closestAttr(target, "data-i-modal-close")) {
    event.preventDefault();
    close();
    return;
  }
  const reveal = closestAttr(target, "data-i-reveal");
  if (reveal) {
    event.preventDefault();
    toggleReveal(reveal);
    return;
  }
  const tab = closestAttr(target, "data-i-tab");
  if (tab) {
    event.preventDefault();
    select(tab);
  }
}
function toggleReveal(btn) {
  const raiz = btn.getRootNode();
  const seletor = btn.getAttribute("data-i-reveal");
  const field = seletor && raiz.querySelector(seletor) || btn.closest(".i-field__wrap, .i-field")?.querySelector(".i-field__input");
  if (!field) return;
  const hidden = field.type === "password";
  field.type = hidden ? "text" : "password";
  btn.setAttribute("aria-pressed", String(hidden));
  btn.setAttribute("aria-label", hidden ? "Esconder o valor" : "Mostrar o valor");
  const ico2 = btn.querySelector(".i-ico");
  if (ico2) ico2.className = `i-ico i-ico--${hidden ? "eye-off" : "eye"}`;
}
function init(root2 = document) {
  if (!delegated) {
    delegated = true;
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeydown);
    document.addEventListener("click", onScrimClick, true);
    boot();
  }
  setup(root2);
  return root2;
}
var theme = { get, set, toggle };
var modal = { open, close, confirm };
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
}
export {
  button,
  copy,
  init,
  modal,
  progress,
  runLog,
  stepper,
  theme,
  version
};
