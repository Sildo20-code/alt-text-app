const API_URL = 'https://alt-text-q6lg8jonb-ersil.vercel.app/api/generate';
const HISTORY_KEY = 'altTextGeneratorHistory';
const HISTORY_LIMIT = 5;
const USAGE_KEY = 'altTextGeneratorUsage';
const DAILY_LIMIT = 5;
const VARIATIONS = [
  { key: 'seo', label: 'SEO optimized', placeholder: 'Your SEO-focused alt text will appear here.' },
  { key: 'short', label: 'Short version', placeholder: 'Your shorter alt text version will appear here.' },
  { key: 'marketing', label: 'Marketing style', placeholder: 'Your marketing-style alt text will appear here.' },
];

const currentUrlField = document.getElementById('current-url');
const pageTitleField = document.getElementById('page-title');
const pageDescriptionField = document.getElementById('page-description');
const toneSelector = document.getElementById('tone-selector');
const generateButton = document.getElementById('generate-button');
const clearButton = document.getElementById('clear-button');
const statusElement = document.getElementById('status');
const errorElement = document.getElementById('error');
const historyList = document.getElementById('history-list');
const usageMessage = document.getElementById('usage-message');
const usageBadge = document.getElementById('usage-badge');
const upgradeBanner = document.getElementById('upgrade-banner');
const copyButtons = Array.from(document.querySelectorAll('.result-copy-button'));
const resultElements = {
  seo: document.getElementById('seo-result'),
  short: document.getElementById('short-result'),
  marketing: document.getElementById('marketing-result'),
};

let activeContext = {
  url: '',
  title: '',
  description: '',
  imageUrl: '',
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadUsage() {
  try {
    const raw = localStorage.getItem(USAGE_KEY);
    if (!raw) {
      return { date: todayKey(), count: 0 };
    }

    const parsed = JSON.parse(raw);
    if (parsed?.date === todayKey() && typeof parsed?.count === 'number') {
      return parsed;
    }
  } catch (error) {
    // Fall back to a clean counter below.
  }

  const reset = { date: todayKey(), count: 0 };
  localStorage.setItem(USAGE_KEY, JSON.stringify(reset));
  return reset;
}

function saveUsage(count) {
  localStorage.setItem(
    USAGE_KEY,
    JSON.stringify({
      date: todayKey(),
      count,
    }),
  );
}

function updateUsageUi() {
  const usage = loadUsage();
  const remaining = Math.max(0, DAILY_LIMIT - usage.count);
  const limited = usage.count >= DAILY_LIMIT;

  usageMessage.textContent = limited
    ? 'Your free daily limit is reached.'
    : `${remaining} free generation${remaining === 1 ? '' : 's'} left today.`;
  usageBadge.textContent = `${usage.count}/${DAILY_LIMIT} used today`;
  upgradeBanner.dataset.limited = limited ? 'true' : 'false';
  return usage;
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

function setLoadingState(isLoading) {
  const usage = loadUsage();
  const limited = usage.count >= DAILY_LIMIT;

  generateButton.disabled = isLoading || !activeContext.url || limited;
  generateButton.textContent = isLoading
    ? 'Generating...'
    : limited
      ? 'Limit reached'
      : 'Generate Alt Text';
  toneSelector.disabled = isLoading;
}

function setStatus(message = '') {
  statusElement.textContent = message;
}

function setError(message = '') {
  errorElement.textContent = message;
  errorElement.hidden = !message;
}

function setResult(key, result = '') {
  const element = resultElements[key];
  if (!element) {
    return;
  }

  const fallback = VARIATIONS.find((item) => item.key === key)?.placeholder || '';
  element.textContent = result || fallback;

  const button = copyButtons.find((item) => item.dataset.copyTarget === `${key}-result`);
  if (button) {
    button.disabled = !result;
  }
}

function setAllResults(results = {}) {
  for (const variation of VARIATIONS) {
    setResult(variation.key, results[variation.key] || '');
  }
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, HISTORY_LIMIT)));
}

function renderHistory() {
  const items = loadHistory();

  if (!items.length) {
    historyList.innerHTML = '<p class="history-empty">Your recent generations will appear here.</p>';
    return;
  }

  historyList.innerHTML = items
    .map(
      (item, index) => `
        <button class="history-item" type="button" data-history-index="${index}">
          <span class="history-item-title">${escapeHtml(item.title || item.url || 'Saved generation')}</span>
          <span class="history-item-meta">${escapeHtml(item.toneLabel)} | ${escapeHtml(item.createdAt)}</span>
          <span class="history-item-body">${escapeHtml(item.results[item.selectedTone] || item.results.seo || '')}</span>
        </button>
      `,
    )
    .join('');
}

function rememberGeneration(entry) {
  const items = loadHistory();
  items.unshift(entry);
  saveHistory(items);
  renderHistory();
}

function formatTimestamp() {
  return new Date().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function buildPayload(tone) {
  return {
    url: activeContext.url,
    title: activeContext.title,
    description: activeContext.description,
    imageUrl: activeContext.imageUrl,
    tone,
  };
}

async function fetchVariations(tone) {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(buildPayload(tone)),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Request failed.');
  }

  const variations = data?.variations;
  if (
    variations &&
    typeof variations.seo === 'string' &&
    typeof variations.short === 'string' &&
    typeof variations.marketing === 'string'
  ) {
    return variations;
  }

  const fallback = data?.result || 'No result returned.';
  return {
    seo: fallback,
    short: fallback,
    marketing: fallback,
  };
}

function reuseHistoryItem(index) {
  const items = loadHistory();
  const item = items[index];
  if (!item) {
    return;
  }

  activeContext = {
    url: item.url || '',
    title: item.title || '',
    description: item.description || '',
    imageUrl: item.imageUrl || '',
  };

  currentUrlField.value = activeContext.url;
  pageTitleField.textContent = activeContext.title || 'Unknown page title';
  pageDescriptionField.textContent = activeContext.description || 'No meta description found';
  toneSelector.value = item.selectedTone || 'seo';
  setAllResults(item.results || {});
  setError('');
  setStatus('Loaded from history.');
}

async function loadPageContext() {
  setStatus('Detecting current page...');
  setError('');

  try {
    const tab = await getActiveTab();

    if (!tab?.id || !tab.url) {
      throw new Error('Could not detect the current tab URL.');
    }

    currentUrlField.value = tab.url;
    pageTitleField.textContent = tab.title || 'Unknown page title';
    pageDescriptionField.textContent = 'Loading...';
    activeContext = {
      url: tab.url,
      title: tab.title || '',
      description: '',
      imageUrl: '',
    };

    const pageContext = await chrome.tabs.sendMessage(tab.id, { type: 'GET_PAGE_CONTEXT' });

    if (pageContext && typeof pageContext === 'object') {
      activeContext = {
        url: pageContext.url || tab.url,
        title: pageContext.title || tab.title || '',
        description: pageContext.description || '',
        imageUrl: pageContext.imageUrl || '',
      };

      currentUrlField.value = activeContext.url;
      pageTitleField.textContent = activeContext.title || 'Unknown page title';
      pageDescriptionField.textContent = activeContext.description || 'No meta description found';
    }
    if (!pageContext || typeof pageContext !== 'object') {
      pageDescriptionField.textContent = 'No meta description found';
    }

    setStatus('Ready to generate alt text.');
  } catch (error) {
    setStatus('');
    setError('Open a product page and try again.');
    pageDescriptionField.textContent = 'No meta description found';
  } finally {
    setLoadingState(false);
  }
}

async function generateAltText() {
  if (!activeContext.url) {
    setError('No page URL found for this tab.');
    return;
  }

  const usage = updateUsageUi();
  if (usage.count >= DAILY_LIMIT) {
    setError('You have reached your daily free limit. Upgrade for unlimited access.');
    setLoadingState(false);
    return;
  }

  setLoadingState(true);
  setError('');
  setStatus('Generating alt text...');
  setAllResults({});

  try {
    const selectedTone = toneSelector.value;
    const results = await fetchVariations(selectedTone);

    setAllResults(results);
    rememberGeneration({
      url: activeContext.url,
      title: activeContext.title,
      description: activeContext.description,
      imageUrl: activeContext.imageUrl,
      results,
      selectedTone,
      toneLabel: (VARIATIONS.find((item) => item.key === selectedTone)?.label || 'SEO'),
      createdAt: formatTimestamp(),
    });
    saveUsage(usage.count + 1);
    updateUsageUi();
    setStatus('3 alt text variations generated successfully.');
  } catch (error) {
    setStatus('');
    setError(error?.message || 'Could not generate alt text.');
  } finally {
    setLoadingState(false);
  }
}

async function copyResult(targetId, button) {
  const element = document.getElementById(targetId);
  const text = element?.textContent?.trim();
  const fallback = VARIATIONS.find((item) => `${item.key}-result` === targetId)?.placeholder;

  if (!text || text === fallback) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    const previousText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = previousText || 'Copy';
    }, 1500);
  } catch (error) {
    setError('Could not copy the result.');
  }
}

function clearResult() {
  setError('');
  setStatus('Ready to generate alt text.');
  setAllResults({});
}

generateButton.addEventListener('click', generateAltText);
clearButton.addEventListener('click', clearResult);
copyButtons.forEach((button) => {
  button.addEventListener('click', () => copyResult(button.dataset.copyTarget, button));
});
historyList.addEventListener('click', (event) => {
  const button = event.target.closest('.history-item');
  if (!button) {
    return;
  }

  reuseHistoryItem(Number(button.dataset.historyIndex));
});

renderHistory();
updateUsageUi();
setAllResults({});
setLoadingState(true);
loadPageContext();
