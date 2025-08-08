/* eslint-env browser */

import hotkeys from 'https://cdn.jsdelivr.net/npm/hotkeys-js@3.11.2/+esm';

import { registerSW, loadCSS, sleep } from './scripts/utilities.js';
import { config } from './scripts/managers.js';
import apps from './constants/apps.js';
import { WindowManager } from './wm.js';
import Logger from './scripts/logger.js';

const logger = new Logger();

if (location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
  location.replace(`https:${location.href.substring(location.protocol.length)}`);
}
export default class FlowInstance {
  version; branch; url;
  wm = new WindowManager();

  #init = false;
  #setup = false;

  /**
   * Creates a FlowOS instance
   */
  constructor () {
    registerSW();
    this.setVersion();
  }

  /**
   * Sets the git commit values
   * @returns {void}
   */
  setVersion = async () => {
    const res = await fetch('/ver');
    const data = await res.json();
    this.version = data.hash;
    this.branch = data.branch;
    this.url = data.url;
  };

  /**
   * Boots up the FlowOS runtime
   * @returns {void}
   */
  boot = async () => {
    document.querySelector('.boot').style.opacity = 0;
    setTimeout(() => {
      document.querySelector('.boot').style.pointerEvents = 'none';
    }, 700);

    loadCSS(config.settings.get('theme').url);
    // Progressive enhancement styles (glass + mobile)
    try { loadCSS('/styles/glassmorphism.css'); } catch {}
    try { loadCSS('/styles/mobile.css'); } catch {}

    if (!config.css.get()) config.css.set('');
    if (!config.apps.get()) config.apps.set([]);
    if (!config.customApps.get()) config.customApps.set([]);

    if (this.init) parent.window.location.reload();
    this.apps.register();
    this.hotkeys.register();

    for (const url of config.settings.get('modules').urls) {
      if (url !== '') {
        try {
          const module = await import(url);
          await this.bar.add(module.default);
        } catch (e) { logger.error(e); }
      }
    }

    this.init = true;
    this.apps.register();
    this.hotkeys.register();

    for (const url of config.settings.get('modules').urls) {
      if (url !== '') {
        try {
          const module = await import(url);
          await this.bar.add(module.default);
        } catch (e) { logger.error(e); }
      }
    }

    this.init = true;
  };

  spotlight = {
    /**
     * Adds an application to the spotlight
     * @param {string} app
     * @returns {undefined}
     */
    add: (app) => document.querySelector('.spotlight .apps').append(app),

    /**
     * Toggles the spotlight's visibility
     * @returns {boolean}
     */
    toggle: async () => {
      const spotlightEl = document.querySelector('.spotlight');
      const searchInput = document.querySelector('.spotlight .searchbar');
      const taskbarToggle = document.querySelector('.taskbar > div[role="button"]');

      switch (this.spotlight.state) {
        case true: {
          spotlightEl.style.opacity = 1;
          spotlightEl.style.opacity = 0;
          await sleep(200);
          spotlightEl.style.display = 'none';
          spotlightEl.setAttribute('aria-hidden', 'true');
          if (searchInput) searchInput.setAttribute('aria-expanded', 'false');
          if (taskbarToggle) taskbarToggle.setAttribute('aria-expanded', 'false');
          if (this.spotlight.lastFocus && typeof this.spotlight.lastFocus.focus === 'function') {
            this.spotlight.lastFocus.focus();
          }
          this.spotlight.state = false;
          break;
        }
        case false: {
          this.spotlight.lastFocus = document.activeElement;
          spotlightEl.style.opacity = 0;
          spotlightEl.style.display = 'flex';
          await sleep(200);
          spotlightEl.style.opacity = 1;
          spotlightEl.setAttribute('aria-hidden', 'false');
          if (taskbarToggle) taskbarToggle.setAttribute('aria-expanded', 'true');
          if (searchInput) {
            searchInput.setAttribute('aria-expanded', 'true');
            searchInput.focus({ preventScroll: true });
            try { searchInput.select(); } catch {}
          }
          this.spotlight.state = true;
          break;
        }
      }

      return this.spotlight.state;
    },

    state: false,
    lastFocus: null
  };

  settings = {
    items: {},

    /**
     * Adds a settings category to the settings list
     * @param {SettingsCategory} ITEM
     * @returns {void}
     */
    add: (ITEM) => {
      self.logger.debug(JSON.stringify(ITEM));
      if (!config.settings.get(ITEM.SETTING_ID)) {
        const obj = {};
        ITEM.inputs.forEach(({ type, SETTING_INPUT_ID, defaultValue }) => {
          obj[SETTING_INPUT_ID] = type === 'textarea' ? defaultValue.split('\n') : defaultValue;
        });
        config.settings.set(ITEM.SETTING_ID, obj);
      }
      this.settings.items[ITEM.SETTING_ID] = ITEM;
    }
  };

  bar = {
    items: {},

    /**
     * Adds a bar item to the topbar
     * @param {BarItem} ITEM
     * @param {string} position
     * @returns {void}
     */
    add: (ITEM) => {
      this.bar.items[ITEM.MODULE_ID] = ITEM;
      document.querySelector(`.statusbar .${ITEM.metadata.position ?? 'left'}`)
        .append(this.bar.items[ITEM.MODULE_ID].element);
    }
  };

  hotkeys = {
    /**
     * Registers Hotkeys
     * @returns {void}
     */
    register: () => {
      hotkeys('alt+space, ctrl+space', (e) => {
        e.preventDefault();
        this.spotlight.toggle();
      });

      hotkeys('esc', (e) => {
        e.preventDefault();
        if (this.spotlight.state === true) this.spotlight.toggle();
      });

      hotkeys('alt+/', (e) => {
        e.preventDefault();
        this.wm.open('settings');
      });
    }
  };

  apps = {
    /**
     * Registers applications
     * @returns {void}
     */
    register: () => {
      document.querySelector('.spotlight .apps').innerHTML = '';
      let index = 0;
      for (const [APP_ID, value] of Object.entries(apps())) {
        const appListItem = document.createElement('li');
        appListItem.setAttribute('role', 'option');
        appListItem.setAttribute('tabindex', '-1');
        appListItem.setAttribute('aria-selected', 'false');
        appListItem.id = `app-option-${String(APP_ID).replace(/\s+/g, '-').toLowerCase()}`;
        appListItem.innerHTML = `<img src="${value.icon}" width="25px" alt=""/><p>${value.title}</p>`;
        appListItem.onclick = () => {
          this.wm.open(APP_ID);
          this.spotlight.toggle();
        };
        appListItem.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            appListItem.click();
          }
        });

        this.spotlight.add(appListItem);
        index += 1;
      }
    }
  };
}
