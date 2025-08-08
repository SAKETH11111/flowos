/* eslint-env browser */
/* global __uv$config */

import Logger from './scripts/logger.js';
import { registerSettings, useCustomCSS, sleep } from './scripts/utilities.js';
import { config } from './scripts/managers.js';

import FlowInstance from './flow.js';

import './uv/uv.config.js';

window.immortalize = async () => {
  console.log('Loading 3MB Tailwind Package...');
  await sleep(500);
  console.log('Immortalizing OS...');
  await sleep(200);
  console.log('Rebooting...');
  await config.settings.set('theme', { url: '/builtin/themes/immortal.css' });
  await sleep(200);
  window.location.reload();
};

self.Flow = new FlowInstance();
self.logger = new Logger();

window.onload = () => {
  registerSettings();
  self.currentProxy = __uv$config;

  useCustomCSS();

  window.Flow.boot();
};

const searchBar = document.querySelector('.searchbar');
const appsList = document.querySelector('ul.apps');

let activeIndex = -1;

function getVisibleItems () {
  return Array.from(appsList.children).filter((item) => item.style.display !== 'none');
}

function updateSelection (index) {
  const items = getVisibleItems();
  items.forEach((el) => el.setAttribute('aria-selected', 'false'));
  if (index >= 0 && index < items.length) {
    const el = items[index];
    el.setAttribute('aria-selected', 'true');
    el.focus({ preventScroll: true });
    searchBar.setAttribute('aria-activedescendant', el.id || '');
  } else {
    searchBar.removeAttribute('aria-activedescendant');
  }
}

searchBar.addEventListener('keyup', () => {
  const input = searchBar.value.toLowerCase();
  const apps = Array.from(appsList.children);

  apps.forEach((item) => {
    item.style.display = item.innerText.toLowerCase().includes(input) ? 'flex' : 'none';
  });
  activeIndex = -1;
  updateSelection(activeIndex);
});

searchBar.addEventListener('keydown', (e) => {
  const items = getVisibleItems();
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    activeIndex = items.length ? (activeIndex + 1) % items.length : -1;
    updateSelection(activeIndex);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    activeIndex = items.length ? (activeIndex - 1 + items.length) % items.length : -1;
    updateSelection(activeIndex);
  } else if (e.key === 'Enter') {
    if (activeIndex >= 0 && activeIndex < items.length) {
      e.preventDefault();
      items[activeIndex].click();
    }
  } else if (e.key === 'Escape') {
    e.preventDefault();
    if (window.Flow?.spotlight?.state) {
      window.Flow.spotlight.toggle();
    }
  }
});
