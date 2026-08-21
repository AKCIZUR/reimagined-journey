const state = {
  notes: [
    { id: '1', title: 'Research workspace', preview: 'Use Ctrl/Cmd + K to search notes and the web.', favorite: true },
    { id: '2', title: 'Frontend ideas', preview: 'UI patterns, components and experiments.', favorite: false },
    { id: '3', title: 'Project roadmap', preview: 'Next milestones and implementation notes.', favorite: false }
  ],
  results: [],
  paletteIndex: 0,
  paletteScope: 'all'
};

const $ = (s) => document.querySelector(s);
const noteList = $('#noteList');
const editor = $('#editor');
const title = $('#noteTitle');
const status = $('#saveStatus');

function renderNotes(filter = 'recent') {
  const notes = filter === 'favorites' ? state.notes.filter(n => n.favorite) : state.notes;
  noteList.innerHTML = notes.map((n, i) => `<div class="note-card ${i === 0 ? 'active' : ''}" data-id="${n.id}"><strong>${escapeHtml(n.title)}</strong><span>${escapeHtml(n.preview)}</span></div>`).join('');
  noteList.querySelectorAll('.note-card').forEach(card => card.addEventListener('click', () => selectNote(card.dataset.id)));
}

function selectNote(id) {
  const note = state.notes.find(n => n.id === id); if (!note) return;
  title.value = note.title;
  editor.value = note.preview + '\n\n';
  updateStats();
}

function createNote() {
  const note = { id: crypto.randomUUID(), title: 'Untitled note', preview: '', favorite: false };
  state.notes.unshift(note); selectNote(note.id); title.focus(); title.select(); renderNotes();
  setStatus('Unsaved');
}

function setStatus(value) {
  status.textContent = value;
  if (value === 'Unsaved') window.clearTimeout(setStatus.timer);
}

function save() {
  setStatus('Saving…');
  window.clearTimeout(save.timer);
  save.timer = window.setTimeout(() => setStatus('Saved'), 450);
}

function updateStats() {
  const text = editor.value.trim();
  const words = text ? text.split(/\s+/).length : 0;
  $('#stats').textContent = `${words} words · ${editor.value.length} chars`;
}

function openPalette() {
  $('#paletteBackdrop').classList.remove('hidden');
  $('#paletteInput').value = '';
  $('#paletteInput').focus();
  renderPalette();
}
function closePalette() { $('#paletteBackdrop').classList.add('hidden'); }

function renderPalette() {
  const q = $('#paletteInput').value.trim().toLowerCase();
  const noteItems = state.notes.filter(n => `${n.title} ${n.preview}`.toLowerCase().includes(q));
  const actions = [
    { title: 'New note', meta: 'Create a new note', action: createNote },
    { title: 'Search web', meta: 'Open Web Research', action: () => { closePalette(); $('#researchPanel').style.display = 'block'; $('#webQuery').focus(); } },
    { title: 'Focus mode', meta: 'Hide distractions while writing', action: () => { closePalette(); document.body.classList.toggle('focus-mode'); } }
  ].filter(x => !q || `${x.title} ${x.meta}`.toLowerCase().includes(q));

  const webItems = q ? [
    { title: `${q} — web search`, meta: 'Search the web', action: () => { closePalette(); $('#researchPanel').style.display = ''; $('#webQuery').value = q; searchWeb(q); } }
  ] : [];

  let items = [];
  if (state.paletteScope === 'all' || state.paletteScope === 'notes') items.push(...noteItems.map(n => ({ title: n.title, meta: 'Note', action: () => { closePalette(); selectNote(n.id); } })));
  if (state.paletteScope === 'all') items.push(...actions.map(x => x));
  if (state.paletteScope === 'all' || state.paletteScope === 'web') items.push(...webItems);
  if (!items.length) items = [{ title: 'No results', meta: 'Try another query', action: () => {} }];
  state.paletteItems = items;
  state.paletteIndex = Math.min(state.paletteIndex, items.length - 1);
  $('#paletteResults').innerHTML = items.map((x, i) => `<div class="palette-item ${i === state.paletteIndex ? 'selected' : ''}" data-index="${i}"><div><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.meta)}</small></div><span>↵</span></div>`).join('');
  $('#paletteResults').querySelectorAll('.palette-item').forEach(el => el.addEventListener('click', () => items[Number(el.dataset.index)].action()));
}

async function searchWeb(query) {
  const box = $('#webResults'); box.innerHTML = '<p class="domain">Searching…</p>';
  try {
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    state.results = data.results || [];
  } catch {
    state.results = [
      { title: `${query} — search provider not connected`, domain: 'local prototype', snippet: 'Connect /api/search to a server-side provider such as Brave or SearXNG. The UI is ready for normalized WebResult objects.', url: '#' },
      { title: 'Search API contract', domain: 'Simple Notebook', snippet: 'Provider-agnostic result shape: title, url, domain, snippet, type and publishedAt.', url: '#' }
    ];
  }
  box.innerHTML = state.results.map(r => `<article class="result"><span class="domain">${escapeHtml(r.domain || 'web')}</span><h3>${escapeHtml(r.title)}</h3><p>${escapeHtml(r.snippet || '')}</p><div class="result-actions"><button data-url="${escapeAttr(r.url || '#')}">Open</button><button data-save="${escapeAttr(r.title)}">Save</button><button data-insert="${escapeAttr(r.url || '#')}">Insert</button></div></article>`).join('');
  box.querySelectorAll('[data-url]').forEach(b => b.onclick = () => { if (b.dataset.url !== '#') window.open(b.dataset.url, '_blank', 'noopener'); });
  box.querySelectorAll('[data-save]').forEach(b => b.onclick = () => { editor.value += `\n\n- ${b.dataset.save}`; updateStats(); save(); });
  box.querySelectorAll('[data-insert]').forEach(b => b.onclick = () => { editor.setRangeText(` [source](${b.dataset.insert}) `, editor.selectionStart, editor.selectionEnd, 'end'); updateStats(); save(); });
}

function escapeHtml(s) { return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function escapeAttr(s) { return escapeHtml(s).replace(/`/g, '&#096;'); }

$('#searchTrigger').onclick = openPalette;
$('#newNote').onclick = createNote;
$('#webSearchBtn').onclick = () => searchWeb($('#webQuery').value.trim());
$('#webQuery').addEventListener('keydown', e => { if (e.key === 'Enter') searchWeb(e.currentTarget.value.trim()); });
editor.addEventListener('input', () => { updateStats(); save(); });
title.addEventListener('input', save);
$('#favoriteBtn').onclick = () => { const n = state.notes[0]; n.favorite = !n.favorite; $('#favoriteBtn').textContent = n.favorite ? '★' : '☆'; renderNotes(); };
$('#focusMode').onclick = () => document.body.classList.toggle('focus-mode');
$('#themeToggle').onclick = () => document.documentElement.classList.toggle('dark');
$('#mobileMenu').onclick = () => $('#sidebar').classList.toggle('open');
$('#closeResearch').onclick = () => $('#researchPanel').style.display = 'none';
$('#paletteBackdrop').onclick = e => { if (e.target === e.currentTarget) closePalette(); };
$('#paletteInput').addEventListener('input', () => { state.paletteIndex = 0; renderPalette(); });
document.querySelectorAll('.palette-tab').forEach(tab => tab.onclick = () => { document.querySelectorAll('.palette-tab').forEach(x => x.classList.remove('active')); tab.classList.add('active'); state.paletteScope = tab.dataset.scope; renderPalette(); });
document.querySelectorAll('.nav-item').forEach(item => item.onclick = () => { renderNotes(item.dataset.view); $('#crumb').textContent = item.textContent.trim(); $('#sidebar').classList.remove('open'); });
document.addEventListener('keydown', e => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); openPalette(); }
  if (mod && e.key.toLowerCase() === 'n') { e.preventDefault(); createNote(); }
  if (e.key === 'Escape') closePalette();
  if ($('#paletteBackdrop').classList.contains('hidden')) return;
  if (e.key === 'ArrowDown') { e.preventDefault(); state.paletteIndex++; renderPalette(); }
  if (e.key === 'ArrowUp') { e.preventDefault(); state.paletteIndex--; renderPalette(); }
  if (e.key === 'Enter') { e.preventDefault(); state.paletteItems?.[state.paletteIndex]?.action(); }
});

renderNotes(); updateStats();
