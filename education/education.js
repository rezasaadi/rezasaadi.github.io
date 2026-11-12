import { loadSiteData, setTitle, joinNonEmpty, prettyYearRange } from '../assets/common.js';
import { initTheme, el, attachReveal } from '../page-helpers.js';

function renderEducation(list) {
  const root = el('educationTimeline');
  root.innerHTML = '';

  if (!Array.isArray(list) || !list.length) {
    root.textContent = 'Add education in data/site.json';
    return;
  }

  for (const item of list) {
    const entry = document.createElement(item.href ? 'a' : 'div');
    entry.className = 'entry reveal';
    if (item.href) {
      entry.classList.add('entry-link');
      entry.href = item.href;
      entry.setAttribute('aria-label', `View ${item.degree || 'degree'} at ${item.school || 'university'}`);
    }

    const top = document.createElement('div');
    top.className = 'top';

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = `${item.degree || ''}${item.school ? ` — ${item.school}` : ''}`.trim();

    const when = document.createElement('div');
    when.className = 'when';
    when.textContent = prettyYearRange(item.start, item.end);

    top.appendChild(title);
    top.appendChild(when);

    const org = document.createElement('div');
    org.className = 'org';
    org.textContent = joinNonEmpty([item.location]).trim();

    entry.appendChild(top);
    if (org.textContent) entry.appendChild(org);

    if (Array.isArray(item.details) && item.details.length) {
      const ul = document.createElement('ul');
      ul.className = 'bullets';
      for (const d of item.details) {
        const li = document.createElement('li');
        li.textContent = d;
        ul.appendChild(li);
      }
      entry.appendChild(ul);
    }

    root.appendChild(entry);
  }
}

function renderCoursework(coursework) {
  const root = el('amirkabirCoursework');
  const groups = [
    ['M.Sc. in Pure Mathematics', coursework.masters],
    ['B.Sc. in Applied Mathematics', coursework.bachelors],
    ['Physics coursework', coursework.physics]
  ];

  for (const [label, courses] of groups) {
    const section = document.createElement('section');
    section.className = 'panel reveal';
    const heading = document.createElement('h3');
    heading.textContent = label;
    const list = document.createElement('ul');
    list.className = 'bullets';
    for (const course of courses) {
      const item = document.createElement('li');
      item.textContent = course;
      list.appendChild(item);
    }
    section.append(heading, list);
    root.appendChild(section);
  }
}

async function init() {
  initTheme('dark');

  const site = await loadSiteData('../data/site.json');
  el('brandName').textContent = site?.name || 'Portfolio';
  setTitle(site?.name || 'Portfolio', 'Education');

  renderEducation(site?.education || []);
  renderCoursework(site.coursework.amirkabir);
  attachReveal();
}

init().catch((err) => {
  console.error(err);
  document.body.innerHTML = `<pre style="padding:20px">Education page failed to load.\n\n${String(err)}</pre>`;
});
