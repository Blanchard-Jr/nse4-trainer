// Utilitaires communs aux tests : charge l'application dans jsdom avec une horloge figée.
// L'horloge figée rend les tests indépendants de la date réelle (le compte à rebours
// vers l'examen, par exemple, ne doit pas faire échouer les tests après le jour J).
const fs = require('fs');
const path = require('path');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = path.join(__dirname, '..');
const STORE_KEY = 'nse4fgt_progress_v1';
const FAKE_NOW = '2026-10-31T10:00:00';   // heure locale

function loadHtml() {
  return fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
}

function installClock(window, iso) {
  const RealDate = window.Date;
  const offset = new RealDate(iso).getTime() - RealDate.now();   // le temps continue de s'écouler
  class FakeDate extends RealDate {
    constructor(...args) { if (args.length === 0) super(RealDate.now() + offset); else super(...args); }
    static now() { return RealDate.now() + offset; }
  }
  window.Date = FakeDate;
}

function newDom(html, { seed = null, now = FAKE_NOW } = {}) {
  return new JSDOM(html, {
    runScripts: 'dangerously',
    url: 'http://localhost/',
    pretendToBeVisual: true,
    virtualConsole: new VirtualConsole(),      // silence les « not implemented » de jsdom (scrollTo, navigation…)
    beforeParse(w) {
      installClock(w, now);
      if (seed) w.localStorage.setItem(STORE_KEY, seed);
    },
  });
}

module.exports = { loadHtml, newDom, FAKE_NOW, STORE_KEY };
