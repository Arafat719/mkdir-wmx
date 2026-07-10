import { registerComponent } from '../core/component-base.js';

function readSourceText(btn) {
  const targetSelector = btn.getAttribute('data-wmx-copy-target');
  if (!targetSelector) return btn.getAttribute('data-wmx-copy') ?? '';
  const target = document.querySelector(targetSelector);
  if (!target) return '';
  return 'value' in target ? target.value : target.textContent;
}

registerComponent({
  selector: '[data-wmx-copy], [data-wmx-copy-target]',
  init(btn) {
    const originalLabel = btn.textContent;

    btn.addEventListener('click', async () => {
      const text = readSourceText(btn);
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        return; // Clipboard API unavailable (insecure context/permissions) — no feedback shown.
      }
      btn.textContent = 'Copied!';
      btn.disabled = true;
      setTimeout(() => {
        btn.textContent = originalLabel;
        btn.disabled = false;
      }, 1500);
    });
  },
});
