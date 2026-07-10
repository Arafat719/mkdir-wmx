import { registerComponent, emit } from '../core/component-base.js';

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** exponent;
  return `${exponent === 0 ? value : value.toFixed(1)} ${units[exponent]}`;
}

registerComponent({
  selector: '[data-wmx-dropzone]',
  init(root) {
    const input = root.querySelector('.wmx-dropzone-input');
    const area = root.querySelector('.wmx-dropzone-area');
    if (!input || !area) return;

    let list = root.querySelector('.wmx-dropzone-list');
    if (!list) {
      list = document.createElement('ul');
      list.className = 'wmx-dropzone-list';
      root.appendChild(list);
    }

    function removeAt(index) {
      const transfer = new DataTransfer();
      Array.from(input.files).forEach((file, i) => {
        if (i !== index) transfer.items.add(file);
      });
      input.files = transfer.files;
      render();
      emit(root, 'dropzone:change', { files: Array.from(input.files) });
    }

    function render() {
      list.innerHTML = '';
      Array.from(input.files).forEach((file, index) => {
        const item = document.createElement('li');
        item.className = 'wmx-dropzone-file';

        const name = document.createElement('span');
        name.className = 'wmx-dropzone-file-name';
        name.textContent = file.name;

        const size = document.createElement('span');
        size.className = 'wmx-dropzone-file-size';
        size.textContent = formatBytes(file.size);

        const remove = document.createElement('button');
        remove.type = 'button';
        remove.className = 'wmx-dropzone-file-remove';
        remove.setAttribute('aria-label', `Remove ${file.name}`);
        remove.textContent = '×';
        remove.addEventListener('click', () => removeAt(index));

        item.append(name, size, remove);
        list.appendChild(item);
      });
    }

    input.addEventListener('change', () => {
      render();
      emit(root, 'dropzone:change', { files: Array.from(input.files) });
    });

    ['dragenter', 'dragover'].forEach((eventName) => {
      area.addEventListener(eventName, (event) => {
        event.preventDefault();
        area.classList.add('wmx-dropzone-active');
      });
    });

    ['dragleave', 'dragend'].forEach((eventName) => {
      area.addEventListener(eventName, () => area.classList.remove('wmx-dropzone-active'));
    });

    area.addEventListener('drop', (event) => {
      event.preventDefault();
      area.classList.remove('wmx-dropzone-active');
      const dropped = event.dataTransfer?.files;
      if (!dropped || dropped.length === 0) return;

      if (input.multiple) {
        input.files = dropped;
      } else {
        const transfer = new DataTransfer();
        transfer.items.add(dropped[0]);
        input.files = transfer.files;
      }
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
  },
});
