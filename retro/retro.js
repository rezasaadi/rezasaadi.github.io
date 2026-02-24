import {
  loadSiteData,
  escapeHtml,
  setTitle,
  fetchGithubRepos,
  pickFeaturedRepos,
  formatIsoDate,
  normalizeUrl
} from '../assets/common.js';

const views = ['about', 'resume', 'publications', 'research', 'projects', 'contact', 'help'];
let site = null;
let activeView = 'about';
let linkIndex = []; // links shown in terminal, for `open N`

const elBody = document.getElementById('terminalBody');
const elView = document.getElementById('viewName');
const elMeta = document.getElementById('meta');
const elCmd = document.getElementById('cmd');
const elClock = document.getElementById('clock');
const elCv = document.getElementById('cvLink');

function nowHHMM() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function setClock() {
  if (!elClock) return;
  elClock.textContent = nowHHMM();
}

function setActiveButton(view) {
  const btns = Array.from(document.querySelectorAll('.menu-btn[data-view]'));
  for (const b of btns) {
    const v = b.getAttribute('data-view');
    if (v === view) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  }
}

function hLine(char = '─', len = 56) {
  return char.repeat(len);
}

function box(title, lines) {
  const width = 70;
  const top = `┌${hLine('─', width - 2)}┐`;
  const mid = `├${hLine('─', width - 2)}┤`;
  const bot = `└${hLine('─', width - 2)}┘`;
  const t = (title || '').slice(0, width - 4);
  const titleRow = `│ ${t.padEnd(width - 4, ' ')} │`;

  const body = (lines || []).map(l => {
    const clean = String(l ?? '').replaceAll('\t', '    ');
    return `│ ${clean.slice(0, width - 4).padEnd(width - 4, ' ')} │`;
  });

  return [top, titleRow, mid, ...body, bot].join('\n');
}

function linkListToHtml(links) {
  linkIndex = Array.isArray(links) ? links : [];
  if (!linkIndex.length) return '';
  const items = linkIndex.map((l, i) => {
    const n = i + 1;
    const label = escapeHtml(l.label || l.url || `Link ${n}`);
    const url = escapeHtml(l.url || '#');
    return `<div class="ln"><span class="num">[${n}]</span> <a href="${url}" target="_blank" rel="noopener">${label}</a></div>`;
  }).join('');
  return `<div class="links">${items}</div>`;
}

function renderAbout() {
  const name = site?.name || 'YOUR NAME';
  const tagline = site?.tagline || '';
  const loc = site?.location || '';
  const summary = site?.summary || '';
  const highlights = site?.highlights || [];

  const ascii = [
    '      ____            __  ____      __  _      ',
    '     / __ \\____  _____/ /_/ __ \\___ / /_(_)___ _',
    '    / /_/ / __ \\/ ___/ __/ /_/ / _ \\\\ __/ / __ `/',
    '   / ____/ /_/ / /  / /_/ _, _/  __/ /_/ / /_/ / ',
    '  /_/    \\____/_/   \\__/_/ |_|\\___/\\__/_/\\__,_/  ',
  ].join('\n');

  const lines = [];
  lines.push(ascii);
  lines.push('');
  lines.push(`${name}`);
  if (tagline) lines.push(tagline);
  if (loc) lines.push(loc);
  lines.push('');
  lines.push(summary);
  lines.push('');
  if (highlights.length) {
    lines.push('Highlights:');
    for (const h of highlights) lines.push(`- ${h}`);
  }

  const content = box('ABOUT', wrapLines(lines, 68));

  const links = [];
  if (site?.links?.website) links.push({ label: 'Website', url: normalizeUrl(site.links.website) });
  if (site?.links?.github) links.push({ label: 'GitHub', url: normalizeUrl(site.links.github) });
  if (site?.links?.linkedin) links.push({ label: 'LinkedIn', url: normalizeUrl(site.links.linkedin) });
  if (site?.links?.cvPdf) links.push({ label: 'CV (PDF)', url: site.links.cvPdf });

  return { text: content, links };
}

function renderResume() {
  const skills = site?.skills || {};
  const edu = site?.education || [];
  const exp = site?.experience || [];

  const lines = [];
  lines.push('SUMMARY');
  lines.push(site?.summary || '');
  lines.push('');

  lines.push('SKILLS');
  for (const [cat, items] of Object.entries(skills)) {
    lines.push(`${cat}: ${(items || []).join(', ')}`);
  }
  lines.push('');

  lines.push('EDUCATION');
  for (const e of edu) {
    lines.push(`${e.degree || ''} — ${e.school || ''} (${e.start || ''}-${e.end || ''})`);
    if (e.location) lines.push(`  ${e.location}`);
    for (const d of (e.details || [])) lines.push(`  - ${d}`);
  }
  lines.push('');

  lines.push('EXPERIENCE');
  for (const x of exp) {
    lines.push(`${x.role || ''} @ ${x.org || ''} (${x.start || ''}-${x.end || ''})`);
    if (x.location) lines.push(`  ${x.location}`);
    for (const b of (x.bullets || [])) lines.push(`  - ${b}`);
  }

  const content = box('RESUME', wrapLines(lines, 68));
  const links = [];
  if (site?.links?.cvPdf) links.push({ label: 'CV (PDF)', url: site.links.cvPdf });
  return { text: content, links };
}

function renderPublications() {
  const pubs = site?.publications || [];
  const lines = [];

  if (!pubs.length) {
    lines.push('No publications yet (or you forgot to add them in data/site.json).');
  } else {
    let idx = 1;
    for (const p of pubs) {
      lines.push(`${idx}. ${p.title || 'Untitled'}`);
      if (p.authors) lines.push(`   ${p.authors}`);
      const venue = [p.venue, p.year].filter(Boolean).join(' · ');
      if (venue) lines.push(`   ${venue}`);
      if (p.note) lines.push(`   Note: ${p.note}`);
      lines.push('');
      idx += 1;
    }
  }

  const links = [];
  for (const p of pubs) {
    if (p?.links?.pdf) links.push({ label: `PDF: ${p.title || 'paper'}`, url: p.links.pdf });
    if (p?.links?.doi) links.push({ label: `DOI: ${p.title || 'paper'}`, url: normalizeUrl(p.links.doi) });
    if (p?.links?.code) links.push({ label: `Code: ${p.title || 'paper'}`, url: normalizeUrl(p.links.code) });
  }

  const content = box('PAPERS & PUBLICATIONS', wrapLines(lines, 68));
  return { text: content, links };
}

function renderResearch() {
  const items = site?.researchProjects || [];
  const lines = [];
  if (!items.length) {
    lines.push('No research projects yet (add them in data/site.json).');
  } else {
    let idx = 1;
    for (const r of items) {
      lines.push(`${idx}. ${r.title || 'Untitled'} (${r.when || ''})`);
      if (r.role) lines.push(`   Role: ${r.role}`);
      if (r.summary) lines.push(`   ${r.summary}`);
      if (Array.isArray(r.stack) && r.stack.length) lines.push(`   Stack: ${r.stack.join(', ')}`);
      for (const h of (r.highlights || [])) lines.push(`   - ${h}`);
      lines.push('');
      idx += 1;
    }
  }

  const links = [];
  for (const r of items) {
    const L = r?.links || {};
    if (L.projectPage) links.push({ label: `Project page: ${r.title || 'project'}`, url: normalizeUrl(L.projectPage) });
    if (L.paper) links.push({ label: `Paper: ${r.title || 'project'}`, url: L.paper });
    if (L.code) links.push({ label: `Code: ${r.title || 'project'}`, url: normalizeUrl(L.code) });
  }

  const content = box('RESEARCH PROJECTS', wrapLines(lines, 68));
  return { text: content, links };
}

async function renderProjects() {
  const cfg = site?.implementationProjects || { mode: 'github' };
  const mode = cfg.mode || 'github';

  const lines = [];
  const links = [];

  if (mode === 'manual') {
    const manual = cfg.manual || [];
    if (!manual.length) {
      lines.push('No manual projects. Add implementationProjects.manual in data/site.json');
    } else {
      let idx = 1;
      for (const p of manual) {
        lines.push(`${idx}. ${p.name || 'Project'}`);
        if (p.description) lines.push(`   ${p.description}`);
        if (Array.isArray(p.topics) && p.topics.length) lines.push(`   Topics: ${p.topics.join(', ')}`);
        const L = p.links || {};
        if (L.repo) links.push({ label: `Repo: ${p.name || 'project'}`, url: normalizeUrl(L.repo) });
        if (L.demo) links.push({ label: `Demo: ${p.name || 'project'}`, url: normalizeUrl(L.demo) });
        if (L.docs) links.push({ label: `Docs: ${p.name || 'project'}`, url: normalizeUrl(L.docs) });
        lines.push('');
        idx += 1;
      }
    }

    const content = box('IMPLEMENTATION PROJECTS', wrapLines(lines, 68));
    return { text: content, links, meta: 'MANUAL MODE' };
  }

  // GitHub mode.
  elMeta.textContent = 'LOADING GITHUB…';
  const username = site?.githubUsername;

  const { repos, note } = await fetchGithubRepos(username);
  const featured = pickFeaturedRepos(repos, cfg.featuredRepos || []);

  lines.push(`GitHub user: ${username || 'not set'}`);
  lines.push(note);
  lines.push('');

  if (!featured.length) {
    lines.push('No repos to show yet.');
    lines.push('Fix: set githubUsername in data/site.json, or use manual mode.');
  } else {
    let idx = 1;
    for (const r of featured) {
      lines.push(`${idx}. ${r.name}  ★${r.stargazers_count || 0}  ⑂${r.forks_count || 0}`);
      if (r.description) lines.push(`   ${r.description}`);
      const meta = [r.language, formatIsoDate(r.updated_at)].filter(Boolean).join(' · ');
      if (meta) lines.push(`   ${meta}`);
      links.push({ label: `Repo: ${r.full_name}`, url: r.html_url });
      if (r.homepage) links.push({ label: `Homepage: ${r.name}`, url: normalizeUrl(r.homepage) });
      lines.push('');
      idx += 1;
    }
  }

  if (site?.links?.github) links.unshift({ label: 'GitHub Profile', url: normalizeUrl(site.links.github) });

  const content = box('GITHUB PROJECTS', wrapLines(lines, 68));
  return { text: content, links, meta: 'GITHUB MODE' };
}

function renderContact() {
  const lines = [];
  lines.push(site?.contact?.pitch || 'Send an email. Say hi. Build cool things.');
  lines.push('');
  if (site?.email) lines.push(`Email: ${site.email}`);
  if (site?.phone) lines.push(`Phone: ${site.phone}`);
  if (site?.location) lines.push(`Location: ${site.location}`);
  if (site?.contact?.timezone) lines.push(`Timezone: ${site.contact.timezone}`);

  const links = [];
  if (site?.email) links.push({ label: 'Email', url: `mailto:${site.email}` });
  if (site?.phone) links.push({ label: 'Phone', url: `tel:${site.phone.replace(/\s+/g,'')}` });
  if (site?.links?.linkedin) links.push({ label: 'LinkedIn', url: normalizeUrl(site.links.linkedin) });
  if (site?.links?.github) links.push({ label: 'GitHub', url: normalizeUrl(site.links.github) });

  const content = box('CONTACT', wrapLines(lines, 68));
  return { text: content, links };
}

function renderHelp() {
  const lines = [
    'COMMANDS',
    '',
    '  about | resume | papers | research | projects | contact',
    '  open N        Open link number N from the current screen',
    '  github        Open GitHub profile (if configured)',
    '  cv            Open your CV PDF',
    '  clear         Clear terminal output',
    '  ui            Back to UI selector',
    '',
    'KEYS',
    '',
    '  1–6           Switch sections',
    '  F1 or ?       Help',
    '  ESC           UI selector',
    '  CTRL+L        Clear',
  ];

  const links = [];
  links.push({ label: 'UI selector', url: '../' });
  return { text: box('HELP', lines.map(l => l.padEnd(1))), links };
}

function wrapLines(lines, maxLen) {
  const out = [];
  for (const line of (lines || [])) {
    const s = String(line ?? '');
    if (s.length <= maxLen) {
      out.push(s);
      continue;
    }
    // Simple word wrap.
    let cur = '';
    for (const word of s.split(/\s+/)) {
      if (!cur) {
        cur = word;
        continue;
      }
      if ((cur + ' ' + word).length <= maxLen) {
        cur += ' ' + word;
      } else {
        out.push(cur);
        cur = word;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

function setTerminalHtml(asciiBoxText, links = []) {
  const linksHtml = linkListToHtml(links);
  elBody.innerHTML = `<pre class="pre">${escapeHtml(asciiBoxText)}</pre>${linksHtml}`;
  elBody.scrollTop = 0;
}

async function setView(view) {
  if (!views.includes(view)) view = 'about';
  activeView = view;

  setActiveButton(view);
  elView.textContent = view.toUpperCase();

  elMeta.textContent = 'RENDERING…';

  let out;
  if (view === 'about') out = renderAbout();
  else if (view === 'resume') out = renderResume();
  else if (view === 'publications') out = renderPublications();
  else if (view === 'research') out = renderResearch();
  else if (view === 'projects') out = await renderProjects();
  else if (view === 'contact') out = renderContact();
  else out = renderHelp();

  setTerminalHtml(out.text, out.links);
  elMeta.textContent = out.meta || 'READY';

  history.replaceState(null, '', `#${view}`);
}

function parseCmd(raw) {
  const s = String(raw || '').trim();
  if (!s) return { cmd: '', args: [] };
  const parts = s.split(/\s+/);
  return { cmd: parts[0].toLowerCase(), args: parts.slice(1) };
}

function openLink(n) {
  const idx = Number(n);
  if (!Number.isFinite(idx) || idx < 1 || idx > linkIndex.length) {
    flashMeta('Bad link number.');
    return;
  }
  const url = linkIndex[idx - 1]?.url;
  if (!url) {
    flashMeta('No URL for that link.');
    return;
  }
  window.open(url, '_blank', 'noopener');
  flashMeta(`Opened [${idx}]`);
}

function flashMeta(text, ms = 1200) {
  const old = elMeta.textContent;
  elMeta.textContent = text;
  setTimeout(() => { elMeta.textContent = old; }, ms);
}

async function runCmd(raw) {
  const { cmd, args } = parseCmd(raw);
  if (!cmd) return;

  if (cmd === '1') return setView('about');
  if (cmd === '2') return setView('resume');
  if (cmd === '3') return setView('publications');
  if (cmd === '4') return setView('research');
  if (cmd === '5') return setView('projects');
  if (cmd === '6') return setView('contact');

  if (['about', 'a'].includes(cmd)) return setView('about');

  if (['resume', 'r'].includes(cmd)) return setView('resume');
  if (cmd === 'cv') {
    if (site?.links?.cvPdf) {
      window.open(site.links.cvPdf, '_blank', 'noopener');
      flashMeta('Opened CV.');
      return;
    }
    return setView('resume');
  }

  if (['papers', 'pubs', 'publications', 'p'].includes(cmd)) return setView('publications');
  if (['research', 'lab'].includes(cmd)) return setView('research');

  if (cmd === 'github') {
    if (site?.links?.github) {
      window.open(normalizeUrl(site.links.github), '_blank', 'noopener');
      flashMeta('Opened GitHub.');
      return;
    }
    return setView('projects');
  }
  if (['projects', 'g'].includes(cmd)) return setView('projects');

  if (['contact', 'c'].includes(cmd)) return setView('contact');
  if (['help', '?', 'h', 'f1'].includes(cmd)) return setView('help');

  if (cmd === 'open') return openLink(args[0]);

  if (cmd === 'ui' || cmd === 'home') {
    location.href = '../';
    return;
  }

  if (cmd === 'clear' || cmd === 'cls') {
    elBody.innerHTML = '';
    linkIndex = [];
    flashMeta('CLEARED');
    return;
  }

  flashMeta('Unknown command. Type HELP.');
}

function attachEvents() {
  for (const btn of Array.from(document.querySelectorAll('.menu-btn[data-view]'))) {
    btn.addEventListener('click', () => setView(btn.getAttribute('data-view')));
  }

  elCmd.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const value = elCmd.value;
      elCmd.value = '';
      await runCmd(value);
    }

    if (e.key.toLowerCase() === 'l' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      elBody.innerHTML = '';
      linkIndex = [];
      flashMeta('CLEARED');
    }
  });

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      location.href = '../';
      return;
    }
    if (e.key === 'F1') {
      e.preventDefault();
      setView('help');
      return;
    }
    if (['1','2','3','4','5','6'].includes(e.key) && !isTyping()) {
      runCmd(e.key);
    }
    if (e.key === '?' && !isTyping()) {
      setView('help');
    }
  });

  setTimeout(() => elCmd.focus(), 60);
}

function isTyping() {
  const active = document.activeElement;
  if (!active) return false;
  return active === elCmd;
}

async function init() {
  setClock();
  setInterval(setClock, 15 * 1000);

  site = await loadSiteData('../data/site.json');
  setTitle(site?.name || 'Portfolio', 'Retro');

  if (site?.links?.cvPdf && elCv) elCv.href = site.links.cvPdf;

  attachEvents();

  const hash = (location.hash || '').replace('#', '').trim();
  const startView = views.includes(hash) ? hash : 'about';
  await setView(startView);
}

init().catch((err) => {
  console.error(err);
  elMeta.textContent = 'ERROR';
  elBody.textContent = `Could not start retro UI.\n\n${String(err)}`;
});
