const files = window.MARKDOWN_FILES || [];
const grid = document.querySelector('#articleGrid');
const filters = document.querySelector('#filters');
const search = document.querySelector('#searchInput');
const folderSearch = document.querySelector('#folderSearch');
const folderFilters = document.querySelector('#folderFilters');
const resultCount = document.querySelector('#resultCount');
const dialog = document.querySelector('#readerDialog');
const content = document.querySelector('#articleContent');
const toc = document.querySelector('#tableOfContents');
const toast = document.querySelector('#toast');
let activeCategory = 'All';
let activeFolder = 'All';
let articles = [];

if (window.marked) marked.setOptions({ gfm: true, breaks: false });
const encodePath = value => value.split('/').map(encodeURIComponent).join('/');
const cleanTitle = value => decodeURIComponent(value.split('/').pop()).replace(/\.md$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
const categoryOf = value => value.includes('/') ? value.split('/')[0] : 'General';
const folderOf = value => {
  const parts = value.split('/');
  if (parts[0] === 'Interview_Answers' && parts.length > 2) return parts[1];
  return parts.length > 1 ? parts.slice(0, -1).join('/') : 'General';
};
const folderLabel = value => value.replace(/^\d+-/, '').replace(/[-_]+/g, ' ');
const isReadme = value => value.split('/').pop().toLowerCase() === 'readme.md';
const strip = text => text.replace(/^---[\s\S]*?---\s*/, '').replace(/```[\s\S]*?```/g, ' ').replace(/[#>*_`\[\]()-]/g, ' ').replace(/\s+/g, ' ').trim();
const heading = text => {
  const match = text.replace(/^---[\s\S]*?---\s*/, '').match(/^#\s+(.+)$/m);
  return match ? match[1].replace(/[*_`]/g, '').trim() : '';
};
const excerpt = text => {
  const body = strip(text).replace(/^.+?(?=\s[A-Z])/, '').trim();
  return body.slice(0, 190) + (body.length > 190 ? '…' : '');
};
const naturalSort = (a, b) => {
  const folderOrder = a.folder.localeCompare(b.folder, undefined, { numeric: true, sensitivity: 'base' });
  if (folderOrder) return folderOrder;
  if (a.isReadme !== b.isReadme) return a.isReadme ? -1 : 1;
  return a.path.localeCompare(b.path, undefined, { numeric: true, sensitivity: 'base' });
};

function notify(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

async function loadLibrary() {
  articles = (await Promise.all(files.map(async item => {
    const articlePath = typeof item === 'string' ? item : item.path;
    let text = typeof item === 'object' && item.content ? item.content : '';
    if (!text && location.protocol !== 'file:') {
      try {
        const response = await fetch(encodePath(articlePath));
        if (response.ok) text = await response.text();
      } catch { /* display the fallback description */ }
    }
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    return {
      path: articlePath,
      text,
      title: heading(text) || cleanTitle(articlePath),
      category: categoryOf(articlePath),
      folder: folderOf(articlePath),
      isReadme: isReadme(articlePath),
      description: text ? excerpt(text) : 'This article could not be loaded. Run node generate-library.js to refresh the library.',
      minutes: Math.max(1, Math.ceil(words / 220)),
      words
    };
  }))).sort(naturalSort);
  renderFilters();
  renderFolderOptions();
  render();
  updateStats();
  const requested = new URLSearchParams(location.search).get('article');
  const requestedArticle = articles.find(article => article.path === requested);
  if (requestedArticle) openArticle(requestedArticle);
}

function updateStats() {
  document.querySelector('#articleCount').textContent = articles.length;
  document.querySelector('#categoryCount').textContent = new Set(articles.map(article => article.folder)).size;
  document.querySelector('#readingMinutes').textContent = articles.reduce((sum, article) => sum + article.minutes, 0);
}

function renderFilters() {
  const categories = ['All', ...new Set(articles.map(article => article.category).sort())];
  filters.innerHTML = categories.map(category => `<button class="filter ${category === 'All' ? 'active' : ''}" data-category="${category}">${category} <span>${category === 'All' ? articles.length : articles.filter(article => article.category === category).length}</span></button>`).join('');
  filters.querySelectorAll('button').forEach(button => {
    button.onclick = () => {
      activeCategory = button.dataset.category;
      activeFolder = 'All';
      filters.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
      renderFolderOptions();
      render();
    };
  });
}

function renderFolderOptions() {
  const folders = [...new Set(articles.filter(article => activeCategory === 'All' || article.category === activeCategory).map(article => article.folder))]
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }));
  if (!folders.includes(activeFolder)) activeFolder = 'All';
  const query = folderSearch.value.trim().toLowerCase();
  const matching = folders.filter(folder => !query || folderLabel(folder).toLowerCase().includes(query));
  folderFilters.innerHTML = `<button class="folder-filter ${activeFolder === 'All' ? 'active' : ''}" data-folder="All">All folders</button>` + matching.map(folder => `<button class="folder-filter ${activeFolder === folder ? 'active' : ''}" data-folder="${folder}">${folderLabel(folder)}</button>`).join('');
  folderFilters.querySelectorAll('button').forEach(button => {
    button.onclick = () => {
      activeFolder = button.dataset.folder;
      renderFolderOptions();
      render();
    };
  });
}

function createCard(article, index) {
  const card = document.createElement('article');
  card.className = `article-card${article.isReadme ? ' folder-guide' : ''}`;
  card.tabIndex = 0;
  card.style.setProperty('--motion-delay', `${-(index % 7) * .7}s`);
  card.innerHTML = `<div class="card-gif" aria-hidden="true"><img src="assets/running-animals-canal.png" alt=""></div><div class="card-content"><div class="card-top"><span class="category">${article.isReadme ? 'Folder guide' : article.category}</span><span class="read-time">${article.minutes} min read</span></div><h3>${article.title}</h3><p>${article.description}</p><div class="card-bottom"><span>${article.words.toLocaleString()} words</span><span>→</span></div></div>`;
  card.onclick = () => openArticle(article);
  card.onkeydown = event => { if (event.key === 'Enter') openArticle(article); };
  return card;
}

function render() {
  const query = search.value.trim().toLowerCase();
  const shown = articles.filter(article =>
    (activeCategory === 'All' || article.category === activeCategory) &&
    (activeFolder === 'All' || article.folder === activeFolder) &&
    (!query || `${article.title} ${article.category} ${folderLabel(article.folder)} ${article.text}`.toLowerCase().includes(query))
  ).sort(naturalSort);
  grid.innerHTML = '';
  let currentFolder = '';
  shown.forEach((article, index) => {
    if (article.folder !== currentFolder) {
      currentFolder = article.folder;
      const folderHeading = document.createElement('div');
      folderHeading.className = 'folder-heading';
      const folderCount = shown.filter(item => item.folder === currentFolder).length;
      folderHeading.innerHTML = `<h3>${folderLabel(currentFolder)}</h3><span>${folderCount} files</span>`;
      grid.append(folderHeading);
    }
    grid.append(createCard(article, index));
  });
  resultCount.textContent = `${shown.length.toLocaleString()} files shown`;
  document.querySelector('#emptyState').hidden = shown.length > 0;
}

function slug(value) {
  return value.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function openArticle(article) {
  if (!article) return;
  document.querySelector('#readerPath').textContent = article.path;
  document.querySelector('#rawLink').href = encodePath(article.path);
  content.innerHTML = window.marked ? marked.parse(article.text) : `<pre>${article.text}</pre>`;
  const headings = [...content.querySelectorAll('h2,h3')];
  toc.innerHTML = '';
  headings.forEach((item, index) => {
    item.id = `${slug(item.textContent)}-${index}`;
    const link = document.createElement('a');
    link.href = `#${item.id}`;
    link.textContent = item.textContent;
    link.className = `level-${item.tagName.slice(1)}`;
    link.onclick = () => setTimeout(() => item.scrollIntoView({ behavior: 'smooth' }), 50);
    toc.append(link);
  });
  history.replaceState({}, '', `?article=${encodeURIComponent(article.path)}`);
  dialog.showModal();
  content.scrollTop = 0;
  document.title = `${article.title} — Dev Notes`;
}

function closeReader() {
  dialog.close();
  history.replaceState({}, '', location.pathname);
  document.title = 'Dev Notes — Technical Knowledge Library';
}

document.querySelector('#closeReader').onclick = closeReader;
document.querySelector('#closeReaderTop').onclick = closeReader;
document.querySelector('#copyLink').onclick = async () => {
  await navigator.clipboard.writeText(location.href);
  notify('Article link copied');
};
search.oninput = render;
folderSearch.oninput = renderFolderOptions;
document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (!dialog.open) search.focus();
  }
  if (event.key === 'Escape' && dialog.open) closeReader();
});
dialog.addEventListener('cancel', event => { event.preventDefault(); closeReader(); });
loadLibrary();
