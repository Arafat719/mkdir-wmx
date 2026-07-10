import { enableAutoInit } from './core/component-base.js';
import { Modal, getModal } from './components/modal.js';
import { Drawer, getDrawer } from './components/drawer.js';
import { CommandPalette, getCommandPalette } from './components/command-palette.js';
import { toast } from './components/toast.js';
import { confirm } from './components/confirm.js';
import './components/dropdown.js';
import './components/tabs.js';
import './components/alert.js';
import './components/accordion.js';
import './components/tooltip.js';
import './components/chip.js';
import './components/navbar.js';
import './components/popover.js';
import './components/copy.js';
import './components/back-to-top.js';
import './components/combobox.js';
import './components/datepicker.js';
import './components/theme-toggle.js';
import './components/dropzone.js';
import './components/tag-input.js';
import './components/sidebar.js';
import './components/table.js';
import './components/rating.js';
import './components/carousel.js';
import './components/password-toggle.js';
import './components/otp-input.js';
import './components/qty-input.js';
import './components/context-menu.js';
import './components/sortable.js';
import './components/scroll-progress.js';

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => enableAutoInit());
  } else {
    enableAutoInit();
  }
}

export { Modal, getModal, Drawer, getDrawer, CommandPalette, getCommandPalette, toast, confirm };
