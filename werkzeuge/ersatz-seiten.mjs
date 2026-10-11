/* ersatz-seiten.mjs -- holt die Seiten des englischen Wiktionary zu den gesuchten Wörtern im Wortlaut
 * (Wikitext, über die öffentliche Schnittstelle) und liest daraus, was der Auszug von kaikki.org nicht trägt:
 * die WURZELANGABE je Herkunftsabschnitt. Jede Seite wird nur einmal geholt und lokal abgelegt
 * (data-ersatz/quellen/enwikt-seiten/seiten.jsonl), behalten wird nur der arabische Abschnitt.
 *
 * Aufruf (aus dem Repo-Wurzelverzeichnis):
 *   node werkzeuge/ersatz-seiten.mjs holen     → fehlende Seiten nachladen (liest die Titel aus data-ersatz/arbeit/zuordnung.jsonl)
 *   node werkzeuge/ersatz-seiten.mjs wurzeln   → auszuege/enwikt-wurzeln.json aus den abgelegten Seiten bauen
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = process.env.ERSATZ_REPO || path.join(HIER, '..');
const LAGER = path.join(REPO, 'data-ersatz', 'quellen', 'enwikt-seiten');
const SEITEN = path.join(LAGER, 'seiten.jsonl');
const ZUORDNUNG = path.join(REPO, 'data-ersatz', 'arbeit', 'zuordnung.jsonl');
const WURZELN = path.join(REPO, 'data-ersatz', 'quellen', 'auszuege', 'enwikt-wurzeln.json');
const AGENT = 'Vokabeltrainer-Ersatzdatenbank/0.1 (privates Lernprojekt; liest einzelne Seiten einmal)';
const ZEICHEN = /[ً-ْٰـ]/g;
const nackt = t => String(t ?? '').normalize('NFC').trim().replace(ZEICHEN, '').replace(/ٱ/g, 'ا');
const warte = ms => new Promise(r => setTimeout(r, ms));

const ladeSeiten = () => fs.existsSync(SEITEN) ? fs.readFileSync(SEITEN, 'utf8').split('\n').filter(Boolean).map(z => JSON.parse(z)) : [];

function arabischerAbschnitt(text) {
  const start = text.search(/^==\s*Arabic\s*==\s*$/m);
  if (start < 0) return null;
  const rest = text.slice(start).replace(/^==\s*Arabic\s*==\s*\n?/, '');
  const ende = rest.search(/^==[^=].*?==\s*$/m);
  return ende < 0 ? rest : rest.slice(0, ende);
}

async function holen() {
  fs.mkdirSync(LAGER, { recursive: true });
  const da = new Set(ladeSeiten().map(s => s.gefragt));
  const titel = new Set();
  for (const z of fs.readFileSync(ZUORDNUNG, 'utf8').split('\n').filter(Boolean)) {
    const s = JSON.parse(z);
    const refs = [s.ref, ...(s.wahl || []).map(w => w.ref), ...(s.andereVokale || []).map(w => w.ref), ...(s.teile || []).flatMap(t => t.ref || [])].filter(Boolean);
    for (const r of refs) titel.add(r.split('#')[0]);
    for (const t of nackt(s.suche.ar).split(/\s+/)) { if (t) { titel.add(t); if (t.startsWith('ال') && t.length > 3) titel.add(t.slice(2)); } }
    if (/\s/.test(s.suche.ar)) titel.add(nackt(s.suche.ar));
  }
  const offen = [...titel].filter(t => t && !da.has(t));
  console.log(`Titel gesamt: ${titel.size} · schon abgelegt: ${titel.size - offen.length} · zu holen: ${offen.length}`);
  let geholt = 0, fehlend = 0, ohneArabisch = 0;
  // Die Schnittstelle bremst, wer zu schnell fragt (am 11.10.2026 nach 23 Paketen in einer Minute: „You are making
  // too many requests"). Darum kleine Pakete, eine Pause nach jedem, und bei einer Absage so lange warten, wie sie sagt.
  for (let i = 0; i < offen.length; i += 25) {
    const teil = offen.slice(i, i + 25);
    const body = new URLSearchParams({ action: 'query', format: 'json', formatversion: '2', prop: 'revisions', rvprop: 'ids|timestamp|content', rvslots: 'main', redirects: '1', maxlag: '5', titles: teil.join('|') });
    let daten = null;
    for (let versuch = 0; versuch < 7 && !daten; versuch++) {
      try {
        const antwort = await fetch('https://en.wiktionary.org/w/api.php', { method: 'POST', headers: { 'User-Agent': AGENT, 'Content-Type': 'application/x-www-form-urlencoded' }, body });
        if (!antwort.ok) {
          const pause = Math.min(300, Math.max(30, Number(antwort.headers.get('retry-after')) || 60));
          console.log(`  Absage HTTP ${antwort.status} bei Paket ab ${i} — warte ${pause} s`);
          await warte(pause * 1000); continue;
        }
        const j = await antwort.json();
        if (j.error) { console.log('  Schnittstelle meldet: ' + j.error.code + ' — warte'); await warte(10000); continue; }
        daten = j;
      } catch (e) { console.log('  Abruf fehlgeschlagen (' + String(e.message).slice(0, 60) + ') — warte'); await warte(30000); }
    }
    if (!daten) { console.log('  Paket ab ' + i + ' nicht geholt, breche ab.'); break; }
    const q = daten.query || {};
    const umleitung = new Map();
    for (const n of q.normalized || []) umleitung.set(n.from, n.to);
    for (const r of q.redirects || []) umleitung.set(r.from, r.to);
    const nachTitel = new Map((q.pages || []).map(p => [p.title, p]));
    const zeilen = [];
    for (const gefragt of teil) {
      let t = gefragt; for (let k = 0; k < 3 && umleitung.has(t); k++) t = umleitung.get(t);
      const p = nachTitel.get(t);
      const rev = p && p.revisions && p.revisions[0];
      const text = rev && rev.slots && rev.slots.main ? rev.slots.main.content : null;
      const ar = text ? arabischerAbschnitt(text) : null;
      if (!p || p.missing || !rev) fehlend++; else if (!ar) ohneArabisch++; else geholt++;
      zeilen.push(JSON.stringify({ gefragt, titel: t, fehlt: !p || p.missing || !rev || undefined, revid: rev && rev.revid, zeit: rev && rev.timestamp, arabisch: ar }));
    }
    fs.appendFileSync(SEITEN, zeilen.join('\n') + '\n', 'utf8');
    await warte(4000);
  }
  console.log(`geholt mit arabischem Abschnitt: ${geholt} · Seite fehlt: ${fehlend} · Seite ohne arabischen Abschnitt: ${ohneArabisch}`);
}

const wurzelnIn = text => {
  const funde = [];
  for (const m of text.matchAll(/\{\{\s*(ar-rootbox|ar-root)\s*\|([^{}]*)\}\}/g)) {
    const teile = m[2].split('|').map(t => t.trim()).filter(t => t && !t.includes('='));
    const buchstaben = teile.join(' ').split(/\s+/).filter(t => /^[ء-ي]$/.test(t));
    if (buchstaben.length >= 2) funde.push({ art: m[1], w: buchstaben.join(' ') });
  }
  return funde;
};
function wurzeln() {
  const aus = {};
  let seiten = 0, mitWurzel = 0;
  for (const s of ladeSeiten()) {
    if (!s.arabisch) continue;
    seiten++;
    const teile = s.arabisch.split(/^===\s*Etymology(?:\s+(\d+))?\s*===\s*$/m);
    // teile: [Vorspann, nr1, text1, nr2, text2, …]
    const eintrag = { titel: s.titel, revid: s.revid, zeit: s.zeit, vorspann: wurzelnIn(teile[0]), einheiten: [] };
    for (let i = 1; i < teile.length; i += 2) eintrag.einheiten.push({ nr: teile[i] ? Number(teile[i]) : null, w: wurzelnIn(teile[i + 1] || '') });
    if (eintrag.vorspann.length || eintrag.einheiten.some(e => e.w.length)) mitWurzel++;
    aus[s.gefragt] = eintrag;
    if (s.titel !== s.gefragt && !aus[s.titel]) aus[s.titel] = eintrag;
  }
  fs.writeFileSync(WURZELN + '.neu', JSON.stringify(aus), 'utf8');
  fs.renameSync(WURZELN + '.neu', WURZELN);
  console.log(`Seiten mit arabischem Abschnitt: ${seiten} · davon mit Wurzelangabe: ${mitWurzel} · ${fs.statSync(WURZELN).size} B`);
}

const was = process.argv[2];
if (was === 'holen') await holen();
else if (was === 'wurzeln') wurzeln();
else { console.error('Aufruf: node werkzeuge/ersatz-seiten.mjs holen|wurzeln'); process.exit(2); }
