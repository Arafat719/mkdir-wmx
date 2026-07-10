import { registerComponent } from '../core/component-base.js';

registerComponent({
  selector: '.wmx-tablist',
  init(tablist) {
    const tabs = Array.from(tablist.querySelectorAll('[role="tab"]'));

    function select(tab) {
      tabs.forEach((t) => {
        const selected = t === tab;
        t.setAttribute('aria-selected', String(selected));
        t.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.hidden = !selected;
      });
      tab.focus();
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => select(tab));
      tab.addEventListener('keydown', (event) => {
        if (!['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
        // Prevent the browser's default Home/End page-scroll (and avoid any
        // other default key behavior) now that we're handling navigation.
        event.preventDefault();
        if (event.key === 'ArrowRight') select(tabs[(index + 1) % tabs.length]);
        else if (event.key === 'ArrowLeft') select(tabs[(index - 1 + tabs.length) % tabs.length]);
        else if (event.key === 'Home') select(tabs[0]);
        else if (event.key === 'End') select(tabs[tabs.length - 1]);
      });
    });
  },
});
