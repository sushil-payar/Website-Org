const FIELD_TYPES = [
  { type: 'shortText', name: 'Short Text' },
  { type: 'longText', name: 'Paragraph' },
  { type: 'email', name: 'Email' },
  { type: 'number', name: 'Number' },
  { type: 'date', name: 'Date' },
  { type: 'dropdown', name: 'Dropdown' },
  { type: 'checkbox', name: 'Checkboxes' },
  { type: 'radio', name: 'Multiple Choice' },
];

const defaults = {
  shortText: { placeholder: 'Type your answer', required: false },
  longText: { placeholder: 'Long answer text', required: false },
  email: { placeholder: 'name@company.com', required: true },
  number: { placeholder: '0', required: false, min: '', max: '' },
  date: { required: false },
  dropdown: { required: false, options: ['Option 1', 'Option 2'] },
  checkbox: { required: false, options: ['Choice A', 'Choice B'] },
  radio: { required: false, options: ['Choice A', 'Choice B'] },
};

const formTitleEl = document.querySelector('#formTitle');
const fieldPaletteEl = document.querySelector('#fieldPalette');
const formCanvasEl = document.querySelector('#formCanvas');
const fieldSettingsEl = document.querySelector('#fieldSettings');
const fieldTemplate = document.querySelector('#canvasFieldTemplate');

const state = {
  title: 'Untitled Form',
  fields: [],
  selectedId: null,
};

const uid = () => Math.random().toString(36).slice(2, 9);

const titleByType = (type) => FIELD_TYPES.find((f) => f.type === type)?.name || type;

function createField(type) {
  const idx = state.fields.filter((field) => field.type === type).length + 1;
  return {
    id: uid(),
    type,
    label: `${titleByType(type)} ${idx}`,
    helpText: '',
    ...structuredClone(defaults[type]),
  };
}

function renderPalette() {
  fieldPaletteEl.innerHTML = '';
  FIELD_TYPES.forEach((field) => {
    const button = document.createElement('button');
    button.textContent = `+ ${field.name}`;
    button.addEventListener('click', () => {
      state.fields.push(createField(field.type));
      state.selectedId = state.fields[state.fields.length - 1].id;
      render();
    });
    fieldPaletteEl.appendChild(button);
  });
}

function renderCanvas() {
  formCanvasEl.innerHTML = '';

  if (state.fields.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-canvas';
    empty.textContent = 'Add fields from the library to start building your form.';
    formCanvasEl.appendChild(empty);
    return;
  }

  state.fields.forEach((field, index) => {
    const node = fieldTemplate.content.firstElementChild.cloneNode(true);
    node.querySelector('.field-label').textContent = field.label;
    node.querySelector('.field-type').textContent = titleByType(field.type);
    node.classList.toggle('active', state.selectedId === field.id);

    node.addEventListener('click', (event) => {
      if (event.target.closest('button')) {
        return;
      }
      state.selectedId = field.id;
      render();
    });

    node.querySelectorAll('[data-action]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        const { action } = button.dataset;
        if (action === 'delete') {
          state.fields.splice(index, 1);
          if (state.selectedId === field.id) state.selectedId = null;
        }
        if (action === 'duplicate') {
          const clone = structuredClone(field);
          clone.id = uid();
          clone.label = `${field.label} copy`;
          state.fields.splice(index + 1, 0, clone);
          state.selectedId = clone.id;
        }
        if (action === 'move-up' && index > 0) {
          [state.fields[index - 1], state.fields[index]] = [state.fields[index], state.fields[index - 1]];
        }
        if (action === 'move-down' && index < state.fields.length - 1) {
          [state.fields[index + 1], state.fields[index]] = [state.fields[index], state.fields[index + 1]];
        }
        render();
      });
    });

    formCanvasEl.appendChild(node);
  });
}

function updateField(id, changes) {
  const target = state.fields.find((field) => field.id === id);
  if (!target) return;
  Object.assign(target, changes);
  render();
}

function renderSettings() {
  const active = state.fields.find((field) => field.id === state.selectedId);
  if (!active) {
    fieldSettingsEl.className = 'empty-state';
    fieldSettingsEl.textContent = 'Select a field to configure it.';
    return;
  }

  fieldSettingsEl.className = '';
  fieldSettingsEl.innerHTML = '';

  const wrap = document.createElement('div');
  wrap.className = 'settings-form';

  wrap.innerHTML = `
    <label>
      Label
      <input name="label" value="${active.label}" />
    </label>
    <label>
      Helper text
      <input name="helpText" value="${active.helpText || ''}" placeholder="Optional instructions" />
    </label>
    <label>
      Required
      <select name="required">
        <option value="false" ${active.required ? '' : 'selected'}>No</option>
        <option value="true" ${active.required ? 'selected' : ''}>Yes</option>
      </select>
    </label>
  `;

  if ('placeholder' in active) {
    wrap.insertAdjacentHTML(
      'beforeend',
      `<label>
        Placeholder
        <input name="placeholder" value="${active.placeholder || ''}" />
      </label>`,
    );
  }

  if (active.type === 'number') {
    wrap.insertAdjacentHTML(
      'beforeend',
      `<div class="row">
        <label>
          Min
          <input name="min" type="number" value="${active.min ?? ''}" />
        </label>
        <label>
          Max
          <input name="max" type="number" value="${active.max ?? ''}" />
        </label>
      </div>`,
    );
  }

  if ('options' in active) {
    wrap.insertAdjacentHTML(
      'beforeend',
      `<label>
        Options (one per line)
        <textarea name="options" rows="6">${active.options.join('\n')}</textarea>
      </label>`,
    );
  }

  const removeBtn = document.createElement('button');
  removeBtn.className = 'danger';
  removeBtn.textContent = 'Delete field';
  removeBtn.addEventListener('click', () => {
    state.fields = state.fields.filter((field) => field.id !== active.id);
    state.selectedId = null;
    render();
  });
  wrap.appendChild(removeBtn);

  wrap.addEventListener('input', (event) => {
    const { name, value } = event.target;
    if (!name) return;

    if (name === 'required') {
      updateField(active.id, { required: value === 'true' });
      return;
    }

    if (name === 'options') {
      const parsed = value
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean);
      updateField(active.id, { options: parsed.length ? parsed : ['Option 1'] });
      return;
    }

    updateField(active.id, { [name]: value });
  });

  fieldSettingsEl.appendChild(wrap);
}

function exportHtml() {
  const safeTitle = state.title || 'Generated Form';
  const fieldsMarkup = state.fields
    .map((field) => {
      const required = field.required ? 'required' : '';
      const helper = field.helpText ? `<small>${field.helpText}</small>` : '';

      if (field.type === 'longText') {
        return `<label>${field.label}${helper}<textarea placeholder="${field.placeholder || ''}" ${required}></textarea></label>`;
      }
      if (field.type === 'dropdown') {
        const options = field.options.map((o) => `<option>${o}</option>`).join('');
        return `<label>${field.label}${helper}<select ${required}>${options}</select></label>`;
      }
      if (field.type === 'checkbox' || field.type === 'radio') {
        const options = field.options
          .map((o) => `<label><input type="${field.type === 'checkbox' ? 'checkbox' : 'radio'}" name="${field.id}"/> ${o}</label>`)
          .join('');
        return `<fieldset><legend>${field.label}</legend>${helper}${options}</fieldset>`;
      }

      const inputType = field.type === 'shortText' ? 'text' : field.type;
      const min = field.type === 'number' && field.min !== '' ? `min="${field.min}"` : '';
      const max = field.type === 'number' && field.max !== '' ? `max="${field.max}"` : '';
      return `<label>${field.label}${helper}<input type="${inputType}" placeholder="${field.placeholder || ''}" ${min} ${max} ${required} /></label>`;
    })
    .join('\n');

  const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <style>
    body{font-family:system-ui,sans-serif;margin:2rem auto;max-width:700px;padding:0 1rem;}
    form{display:grid;gap:1rem;}
    label,fieldset{display:grid;gap:.45rem;}
    input,select,textarea{padding:.5rem;border:1px solid #cbd5e1;border-radius:.4rem;}
    small{color:#64748b;}
    button{padding:.6rem .9rem;border:none;border-radius:.4rem;background:#4f46e5;color:white;cursor:pointer;}
  </style>
</head>
<body>
  <h1>${safeTitle}</h1>
  <form>
    ${fieldsMarkup}
    <button type="submit">Submit</button>
  </form>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${safeTitle.toLowerCase().replace(/\s+/g, '-') || 'form'}.html`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function saveJson() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${(state.title || 'form').toLowerCase().replace(/\s+/g, '-')}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

function loadJson() {
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'application/json';
  picker.addEventListener('change', async () => {
    const file = picker.files?.[0];
    if (!file) return;
    const content = await file.text();
    const parsed = JSON.parse(content);
    state.title = parsed.title || 'Untitled Form';
    state.fields = Array.isArray(parsed.fields) ? parsed.fields : [];
    state.selectedId = state.fields[0]?.id || null;
    render();
  });
  picker.click();
}

function resetForm() {
  state.title = 'Untitled Form';
  state.fields = [];
  state.selectedId = null;
  render();
}

function render() {
  formTitleEl.value = state.title;
  renderCanvas();
  renderSettings();
}

formTitleEl.addEventListener('input', (event) => {
  state.title = event.target.value;
});

document.querySelector('#newFormBtn').addEventListener('click', resetForm);
document.querySelector('#saveBtn').addEventListener('click', saveJson);
document.querySelector('#loadBtn').addEventListener('click', loadJson);
document.querySelector('#exportBtn').addEventListener('click', exportHtml);

renderPalette();
render();
