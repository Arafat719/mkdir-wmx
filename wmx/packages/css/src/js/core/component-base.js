// Tiny auto-init registry. Components register a selector + init callback;
// `enableAutoInit` scans the document once and then keeps watching for nodes
// added later (e.g. by client-side rendering) via MutationObserver, so
// consumers never have to manually re-initialize new markup.

const registry = [];

export function registerComponent({ selector, init }) {
  registry.push({ selector, init, seen: new WeakSet() });
}

function scan(root) {
  for (const entry of registry) {
    if (root.nodeType === 1 && root.matches(entry.selector) && !entry.seen.has(root)) {
      entry.seen.add(root);
      entry.init(root);
    }
    root.querySelectorAll?.(entry.selector).forEach((el) => {
      if (entry.seen.has(el)) return;
      entry.seen.add(el);
      entry.init(el);
    });
  }
}

let observer;

export function enableAutoInit(root = document) {
  scan(root);

  if (observer || typeof MutationObserver === 'undefined') return;
  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) scan(node);
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

export function emit(el, name, detail) {
  el.dispatchEvent(new CustomEvent(`wmx:${name}`, { detail, bubbles: true }));
}
