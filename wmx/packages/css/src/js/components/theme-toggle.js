import { registerComponent, emit } from '../core/component-base.js';

const STORAGE_KEY = 'wmx-theme';

function systemPrefersDark() {
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

function currentTheme() {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : (systemPrefersDark() ? 'dark' : 'light');
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
}

registerComponent({
  selector: '[data-wmx-theme-toggle]',
  init(input) {
    input.checked = currentTheme() === 'dark';
    applyTheme(currentTheme());

    input.addEventListener('change', () => {
      const theme = input.checked ? 'dark' : 'light';
      localStorage.setItem(STORAGE_KEY, theme);
      applyTheme(theme);
      emit(input, 'theme:change', { theme });
    });

    window.matchMedia?.('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (localStorage.getItem(STORAGE_KEY)) return;
      input.checked = currentTheme() === 'dark';
      applyTheme(currentTheme());
    });
  },
});
