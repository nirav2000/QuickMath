export function getViewedVersion(pathname, fallbackVersion) {
  const match = pathname.match(/\/archives\/([^/]+)\//);
  return match ? match[1] : (fallbackVersion || null);
}

export async function loadVersions({ fetchWithFallback, versionSelect }) {
  const meta = await fetchWithFallback(['../../version.json', 'version.json'], 'json');
  const versionMeta = meta || { currentVersion: '7.3.2', availableVersions: [{ version: '7.3.2', archivePath: 'archives/7.3.2' }] };
  const versionById = Object.fromEntries((versionMeta.availableVersions || []).map((v) => [v.version, v]));
  versionSelect.innerHTML = '';
  versionMeta.availableVersions.forEach((v) => {
    const o = document.createElement('option');
    o.value = v.version;
    o.textContent = `${v.version}${v.label ? ` • ${v.label}` : ''}${v.version === versionMeta.currentVersion ? ' (current)' : ''}`;
    if (v.version === getViewedVersion(window.location.pathname, versionMeta?.currentVersion)) o.selected = true;
    versionSelect.append(o);
  });
  return { versionMeta, versionById };
}

export async function openHistory({ fetchWithFallback, historyContent, historyModal, versionMeta }) {
  const t = await fetchWithFallback(['../../VERSION_HISTORY.md', 'VERSION_HISTORY.md'], 'text');
  const lines = (t || '').split('\n');
  const sections = [];
  let cur = null;
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (cur) sections.push(cur);
      cur = { title: line.replace('## ', '').trim(), items: [] };
    } else if (cur && line.trim().startsWith('- ')) {
      cur.items.push(line.trim().slice(2));
    }
  }
  if (cur) sections.push(cur);
  const map = Object.fromEntries(sections.map((s) => [s.title.split(' - ')[0], s]));
  const cards = (versionMeta?.availableVersions || []).map((v) => {
    const sec = map[v.version];
    const items = sec?.items?.map((i) => `<li>${i}</li>`).join('') || '<li>No notes recorded.</li>';
    return `<article class='history-card'><h4>${v.version} <small>${v.label || ''}</small></h4><ul>${items}</ul></article>`;
  }).join('');
  historyContent.innerHTML = cards || 'Unable to load version history';
  if (!historyModal.open) historyModal.showModal();
}

export function bindVersionSwitcher({ versionSelect, versionMeta, versionById }) {
  versionSelect.addEventListener('change', (e) => {
    const v = e.target.value;
    const base = window.location.pathname.includes('/archives/')
      ? window.location.pathname.split('/archives/')[0]
      : window.location.pathname.replace(/\/[^/]*$/, '');
    const root = `${window.location.origin}${base}`;
    const current = versionMeta?.currentVersion || '7.3.2';
    const target = versionById[v];
    if (!target) return;
    window.location.href = v === current ? `${root}/index.html` : `${root}/${target.archivePath}/index.html`;
  });
}
