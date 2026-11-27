// Lightweight code editor: a transparent textarea layered over a syntax-highlighted <pre>.
import { h, highlight } from '../ui.js';

export function createEditor({ value = '', lang = 'javascript', onChange, label = 'Code editor', readOnly = false } = {}) {
  let tabTraps = true;
  const pre = h('pre.ed-hl', { 'aria-hidden': 'true' }, h('code'));
  const gutter = h('div.ed-gutter', { 'aria-hidden': 'true' });
  const ta = h('textarea.ed-input', { spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', 'aria-label': `${label}. Tab inserts spaces; press Escape, then Tab, to move focus out.`, readonly: readOnly || null });
  ta.value = value;
  const wrap = h('div.editor', h('div.ed-scroll', gutter, h('div.ed-layer', pre, ta)));

  const sync = () => {
    pre.firstChild.innerHTML = highlight(ta.value, lang) + '\n';
    const lines = ta.value.split('\n').length;
    gutter.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
  };
  ta.addEventListener('input', () => { sync(); onChange?.(ta.value); });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { tabTraps = false; return; }
    if (e.key === 'Tab' && tabTraps && !e.shiftKey) {
      e.preventDefault();
      const { selectionStart: a, selectionEnd: b } = ta;
      ta.setRangeText('  ', a, b, 'end');
      sync(); onChange?.(ta.value);
    } else if (e.key === 'Enter') {
      const a = ta.selectionStart;
      const line = ta.value.slice(0, a).split('\n').pop();
      const indent = line.match(/^\s*/)[0] + (/[{[(:]\s*$/.test(line) ? '  ' : '');
      e.preventDefault();
      ta.setRangeText('\n' + indent, a, ta.selectionEnd, 'end');
      sync(); onChange?.(ta.value);
    }
  });
  ta.addEventListener('focus', () => { tabTraps = true; });
  sync();

  return {
    el: wrap,
    textarea: ta,
    getValue: () => ta.value,
    setValue: (v) => { ta.value = v; sync(); onChange?.(v); },
    setLang: (l) => { lang = l; sync(); },
  };
}
