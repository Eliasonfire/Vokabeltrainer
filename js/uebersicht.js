/* ================================================================
   Kapitel im Überblick und Thementafeln (Arabisch-App, 15.11.2026)
   ================================================================

   Elias, 15.11.2026: „ich möchte im prinzip die grammatik regeln als übersicht haben bzw die
   jeweiligen lektionen der kapteln damit ich später auch noch darauf gucken kann und eine
   zusammenfassung von allem wichtigen habe so wie auch bei der russich app". Auf den Plan:
   „fang an".

   Zwei Gruppen oben im Bereich Regeln:
   1. „Kapitel im Überblick" — je Kapitel von Madina 1: worum es geht, Beispielsätze, worauf du
      achten musst, und die Regeln dieses Kapitels zum Antippen (Kennung „kap-<n>").
   2. „Übersichten" — Thementafeln (Kennung „ueb-…").

   ⛔ NUR ZUM NACHSCHLAGEN. Hier entsteht keine Lernkarte, keine Übung, kein Lernstand —
   nichts wird abgefragt und nichts gespeichert. Bewacht von werkzeuge/pruefe-uebersichten.mjs.
   ⛔ Kein Ton beim Antippen (Elias zur Russisch-App, 12.11.2026: Ton nur über einen Knopf).

   Daten: uebersichten-data.js. Welche Regeln zu einem Kapitel gehören, wird hier aus
   grammar-data.js gelesen (kapitel, sonst source.chapter) — so bleibt die Liste aktuell.
   Die Karte ist die der Regeln (#regelKarte): js/regeln.js fragt istUebersicht(). */

function uebDaten(){ return (typeof UEBERSICHTEN !== 'undefined' && UEBERSICHTEN) ? UEBERSICHTEN : { kapitel: [], tafeln: [] }; }
function uebTafel(id){ return (uebDaten().tafeln || []).find(t => t.id === id) || null; }
function uebKapitel(id){ const n = Number(String(id).slice(4)); return (uebDaten().kapitel || []).find(k => k.nr === n) || null; }
function istUebersicht(id){ return typeof id === 'string' && (id.indexOf('ueb-') === 0 || id.indexOf('kap-') === 0); }

const UEB_LATEIN = /[0-9A-Za-zÄÖÜäöüß]/;   /* auch Ziffern: „2. إِضَافَةٌ" ist eine deutsche Beschriftung */
const UEB_AR = /[ء-ي]/;

function uebRegelKapitel(r){ return Number(r.kapitel || (r.source && r.source.chapter) || 0); }

/* Die Regeln eines Kapitels, ohne die, die er gestrichen oder weggeworfen hat. */
function uebRegelnVonKapitel(nr){
  const alle = (typeof GRAMMAR_RULES !== 'undefined' && Array.isArray(GRAMMAR_RULES)) ? GRAMMAR_RULES : [];
  return alle.filter(r => uebRegelKapitel(r) === nr
    && !(typeof regelVerborgen === 'function' && regelVerborgen(r.id))
    && !(typeof regelImPapierkorb === 'function' && regelImPapierkorb(r.id)));
}

function uebRegelLinks(ids){
  const zeilen = ids.map(id => {
    const r = typeof grammatikRegel === 'function' ? grammatikRegel(id) : null;
    if (!r) return '';
    const t = typeof regelText === 'function' ? regelText(id) : null;
    return `<li><button class="rk-link" type="button" data-regelkarte="${escapeHtml(id)}">${regelnAr(t ? t.name : r.name)}</button></li>`;
  }).join('');
  return zeilen ? `<ol class="uebs-regeln">${zeilen}</ol><div class="rk-klein">Tipp eine Regel an, dann öffnet sie sich.</div>` : '';
}

/* Eine Zelle: nur Arabisch → groß und von rechts; sonst deutscher Text mit arabischen Stellen. */
function uebZelle(text, tag){
  const s = String(text == null ? '' : text);
  if (UEB_AR.test(s) && !UEB_LATEIN.test(s)) return `<${tag} class="uebs-ar" lang="ar" dir="rtl">${escapeHtml(s)}</${tag}>`;
  return `<${tag} class="uebs-de">${regelnAr(s)}</${tag}>`;
}

function uebTabelleHtml(tab){
  if (!tab) return '';
  /* Heißt die letzte Spalte „auf Deutsch", steht die Übersetzung klein UNTER dem Arabischen —
     sonst passt die Tafel auf dem Handy nicht in die Breite (gemessen 15.11.2026, 375 px), und ein
     arabischer Ausdruck soll nicht mitten im Ausdruck umbrechen. */
  const unter = (tab.kopf || []).slice(-1)[0] === 'auf Deutsch';
  const kopfZeile = unter ? tab.kopf.slice(0, -1) : (tab.kopf || []);
  const kopf = kopfZeile.some(Boolean) ? `<thead><tr>${kopfZeile.map(k => uebZelle(k, 'th')).join('')}</tr></thead>` : '';
  const rumpf = (tab.zeilen || []).map(z => {
    if (!unter) return `<tr>${uebZelle(z[0], 'th')}${z.slice(1).map(c => uebZelle(c, 'td')).join('')}</tr>`;
    const de = z[z.length - 1], mitte = z.slice(1, -1);
    const zellen = mitte.map((c, i) => i === mitte.length - 1
      ? `<td class="uebs-ar" lang="ar" dir="rtl">${escapeHtml(c)}<span class="uebs-unter" lang="de" dir="ltr">${regelnAr(de)}</span></td>`
      : uebZelle(c, 'td')).join('');
    return `<tr>${uebZelle(z[0], 'th')}${zellen}</tr>`;
  }).join('');
  return (tab.titel ? `<div class="rk-titel-klein uebs-tab-titel">${regelnAr(tab.titel)}</div>` : '')
    + `<div class="rk-tabelle-rahmen uebs-rahmen"><table class="rk-tabelle uebs-tabelle">${kopf}<tbody>${rumpf}</tbody></table></div>`;
}

/* Sonnen- und Mondbuchstaben: die Sonnenbuchstaben aus SONNENBUCHSTABEN in js/irab.js — dieselbe
   Liste, mit der die App selbst liest. Die Mondbuchstaben sind die übrigen der 28. */
const UEB_28 = 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي';
function uebSonneMondHtml(){
  if (typeof SONNENBUCHSTABEN === 'undefined') return '';
  const sonne = [...UEB_28].filter(b => SONNENBUCHSTABEN.includes(b.codePointAt(0)));
  const mond = [...UEB_28].filter(b => !SONNENBUCHSTABEN.includes(b.codePointAt(0)));
  const reihe = (name, l) => `<div class="uebs-buchstaben"><div class="wk-marke">${name} (${l.length})</div><div class="uebs-ar uebs-reihe" lang="ar" dir="rtl">${l.join(' ')}</div></div>`;
  return reihe('Sonnenbuchstaben', sonne) + reihe('Mondbuchstaben', mond);
}

function uebHinweiseHtml(liste){
  return (liste || []).length ? rkAbschnitt('Gut zu wissen', liste.map(h => `<div class="de uebs-hinweis">${regelnAr(h)}</div>`).join('')) : '';
}

function zeichneTafel(t){
  return rkKopfHtml('<span class="chip">Übersicht</span>')
    + `<div class="rk-titel">${regelnAr(t.titel)}</div>`
    + (t.unter ? `<div class="rk-klein">${regelnAr(t.unter)}</div>` : '')
    + (t.sonneMond ? uebSonneMondHtml() : '')
    + uebTabelleHtml(t.tabelle)
    + uebTabelleHtml(t.tabelle2)
    + uebHinweiseHtml(t.hinweise)
    + ((t.regeln || []).length ? rkAbschnitt('Die Regeln dazu', uebRegelLinks(t.regeln)) : '')
    + '<div class="wk-quelle">Aus deinen Regeln · zum Nachschlagen, hier wird nichts abgefragt</div>';
}

function zeichneKapitelUeberblick(k){
  const regeln = uebRegelnVonKapitel(k.nr).map(r => r.id);
  const beispiele = (k.beispiel || []).map(b =>
    `<div class="rk-beispiel"><div class="ar" lang="ar" dir="rtl">${escapeHtml(b[0])}</div><div class="de">${escapeHtml(b[1])}</div></div>`).join('');
  return rkKopfHtml('<span class="chip">Kapitel</span>')
    + `<div class="rk-titel">Kapitel ${k.nr} · ${regelnAr(k.titel)}</div>`
    + '<div class="rk-klein">Madina Band 1</div>'
    + rkAbschnitt('Worum geht es?', `<div class="de">${regelnAr(k.worum)}</div>`)
    + (beispiele ? rkAbschnitt('So sieht es aus', beispiele) : '')
    + (regeln.length ? rkAbschnitt(`Die Regeln dieses Kapitels (${regeln.length})`, uebRegelLinks(regeln)) : '')
    + ((k.achtung || []).length ? rkAbschnitt('Worauf du achten musst', k.achtung.map(a => `<div class="de uebs-hinweis">${regelnAr(a)}</div>`).join('')) : '')
    + '<div class="wk-quelle">Aus deinen Regeln · zum Nachschlagen, hier wird nichts abgefragt</div>';
}

function zeichneUebersicht(id){
  const t = uebTafel(id), k = t ? null : uebKapitel(id);
  if (t) return zeichneTafel(t);
  if (k) return zeichneKapitelUeberblick(k);
  return rkKopfHtml('') + '<div class="empty-state">Diese Übersicht gibt es nicht.</div>';
}

/* Die zwei Gruppen oben im Bereich Regeln (js/regeln.js, renderRegeln). */
function uebersichtenListeHtml(){
  const d = uebDaten();
  const kap = (d.kapitel || []).map(k => {
    const n = uebRegelnVonKapitel(k.nr).length;
    return regelZeileHtml('kap-' + k.nr, `<span class="rz-nr">${k.nr}</span><span>${regelnAr(k.titel)}</span>`,
      n ? `${n} ${n === 1 ? 'Regel' : 'Regeln'}` : 'noch keine Regel', '');
  }).join('');
  const taf = (d.tafeln || []).map(t => regelZeileHtml(t.id, regelnAr(t.titel), regelnAr(t.unter || ''), '')).join('');
  if (!kap && !taf) return '';
  return `<section class="regeln-abschnitt">
      <h3 class="regeln-kopf">Kapitel im Überblick <span class="regeln-zahl">${(d.kapitel || []).length}</span></h3>
      <div class="pane-hinweis">Worum es in jedem Kapitel geht und worauf du achten musst. Zum Nachlesen, hier wird nichts abgefragt.</div>
      ${kap}
    </section>
    <section class="regeln-abschnitt">
      <h3 class="regeln-kopf">Übersichten <span class="regeln-zahl">${(d.tafeln || []).length}</span></h3>
      <div class="pane-hinweis">Die wichtigsten Themen als Tafel zum Nachschlagen.</div>
      ${taf}
    </section>`;
}
