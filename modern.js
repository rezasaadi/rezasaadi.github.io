import {
  loadSiteData,
  setTitle,
  normalizeUrl
} from './assets/common.js';
import {
  initTheme,
  attachReveal,
  setHref,
  researchIconMarkup
} from './page-helpers.js';

const byId = id => document.getElementById(id);

function makeLink(label, href) {
  if (!href) return null;
  const anchor = document.createElement('a');
  anchor.href = normalizeUrl(href);
  anchor.textContent = label;
  if (/^https?:\/\//i.test(String(href))) {
    anchor.target = '_blank';
    anchor.rel = 'noopener';
  }
  return anchor;
}

function renderFeaturedPublications(publications = []) {
  const root = byId('featuredPublications');
  if (!root) return;
  root.replaceChildren();

  const selected = publications.slice(0, 3);
  for (const publication of selected) {
    const card = document.createElement('article');
    card.className = 'publication-card reveal';

    const meta = document.createElement('div');
    meta.className = 'publication-meta';
    meta.textContent = [publication.year, publication.venue, publication.status]
      .filter(Boolean)
      .join(' · ');

    const title = document.createElement('h3');
    title.textContent = publication.title || 'Untitled work';

    const description = document.createElement('p');
    description.textContent = publication.summary ||
      (publication.area ? `Research in ${publication.area}.` : 'Research publication or manuscript.');

    const actions = document.createElement('div');
    actions.className = 'publication-actions';
    const links = [
      makeLink(publication.urlLabel || 'Paper', publication.url),
      makeLink('Code', publication.code),
      makeLink(publication.venueLink?.label, publication.venueLink?.href)
    ].filter(Boolean);
    links.forEach(link => actions.appendChild(link));

    card.append(meta, title, description);
    if (links.length) card.appendChild(actions);
    root.appendChild(card);
  }
}

function renderResearchAreas(areas = []) {
  const root = byId('homeResearchCards');
  if (!root) return;
  root.replaceChildren();

  for (const area of areas) {
    const link = document.createElement('a');
    link.className = 'research-topic reveal';
    link.href = `./research/#${area.id || ''}`;

    const icon = document.createElement('div');
    icon.className = 'topic-thumb';
    icon.innerHTML = researchIconMarkup(area);

    const body = document.createElement('div');
    body.className = 'topic-body';

    const title = document.createElement('h3');
    title.className = 'topic-title';
    title.textContent = area.title || 'Research area';

    const question = document.createElement('p');
    question.className = 'topic-question';
    question.textContent = area.summary || area.question || '';

    body.append(title, question);
    link.append(icon, body);
    root.appendChild(link);
  }
}

function renderArtifacts({ manual = [], featuredRepos = [] } = {}) {
  const root = byId('featuredArtifacts');
  if (!root) return;
  root.replaceChildren();

  const selected = featuredRepos
    .map(repo => manual.find(project => project.links?.repo?.endsWith('/' + repo)))
    .filter(Boolean);

  for (const project of selected) {
    const card = document.createElement('article');
    card.className = 'artifact-card reveal';

    const title = document.createElement('h3');
    title.textContent = project.name || 'Software artifact';

    const description = document.createElement('p');
    description.textContent = project.description || '';

    const actions = document.createElement('div');
    actions.className = 'artifact-actions';
    const sourceLinks = project.links || {};
    const links = [
      makeLink('Repository', sourceLinks.repo),
      makeLink('Documentation', sourceLinks.docs),
      makeLink('Live demo', sourceLinks.demo)
    ].filter(Boolean);
    links.forEach(link => actions.appendChild(link));

    card.append(title, description);
    if (links.length) card.appendChild(actions);
    root.appendChild(card);
  }
}

function configureProfileLinks(site) {
  const links = site.links || {};
  setHref('btnGithub', normalizeUrl(links.github || ''));
  setHref('btnLinkedIn', normalizeUrl(links.linkedin || ''));
  setHref('btnScholar', normalizeUrl(links.googleScholar || ''));
  setHref('btnOrcid', normalizeUrl(links.orcid || ''));
  setHref('btnCVShort', links.cvShortPdf || 'resume/CV_Short.pdf');
  setHref('btnCVLong', links.cvLongPdf || 'resume/CV_Long.pdf');

  const email = site.email || '';
  const emailLink = byId('heroEmail');
  if (emailLink) {
    emailLink.textContent = email;
    emailLink.href = email ? `mailto:${email}` : '#';
    emailLink.hidden = !email;
  }
}

async function init() {
  initTheme('auto');

  const site = await loadSiteData('./data/site.json');
  const displayName = site.displayName || site.name || 'Reza Saadi';
  setTitle(displayName, 'PhD Student at Koç University');

  const brand = byId('brandName');
  if (brand) brand.textContent = displayName;

  configureProfileLinks(site);
  renderFeaturedPublications(site.publications || []);
  renderResearchAreas(site.researchAreas || []);
  renderArtifacts(site.implementationProjects);

  const year = byId('currentYear');
  if (year) year.textContent = String(new Date().getFullYear());

  attachReveal();
}

init().catch(error => {
  console.error(error);
  document.querySelectorAll('.reveal').forEach(node => node.classList.add('on'));
});
