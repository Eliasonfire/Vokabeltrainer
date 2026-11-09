/* js/lehrerblatt.js — das Übungsblatt seines Lehrers als Übung (09.11.2026)
   ===========================================================================

   Elias, 08.11.2026, zur Zusammenfassung seines Lehrers (Madina 1 bis Kapitel 17):
   „beides und fehlende wörter ergänzen falls vorhanden" — beides = die fehlenden Regeln
   UND die Aufgaben als Übung. Die Form ist meine (Claude): jede Aufgabe als Karte mit
   der Frage im Wortlaut des Blatts, die Lösung erst auf Knopfdruck — erst selbst
   überlegen, dann nachsehen.

   Die Lösung hat drei Teile (Daten in lehrerblatt-data.js):
     • antworten — Musterlösung, von mir aus seinen Karten zusammengesetzt; die Karte sagt das
     • irab      — die Zerlegung der App (irabZeilenHtml in js/saetze.js), wie im Satzmodus
     • regeln    — Knöpfe zu SEINEN Regeln; „Erkläre …" beantwortet die Regel selbst
   Bewacht von werkzeuge/pruefe-lehrerblatt.mjs.

   Kein Speicherschlüssel: welche Lösungen offen sind, gilt nur für diesen Besuch.
   (Pflegeplan: werkzeuge/pflegeplan.mjs, Eintrag „Lehrerblatt".) */

function lbEsc(s){
  return typeof escapeHtml === 'function' ? escapeHtml(String(s == null ? '' : s))
    : String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}
const lbIstArabisch = s => /[؀-ۿ]/.test(String(s || ''));
const lbText = s => lbIstArabisch(s)
  ? `<span class="lb-ar" lang="ar" dir="rtl">${lbEsc(s)}</span>`
  : `<span>${lbEsc(s)}</span>`;

function lbRegelName(id){
  const r = (typeof GRAMMAR_RULES !== 'undefined' ? GRAMMAR_RULES : []).find(x => x.id === id);
  return r ? r.name : id;
}

function lbLoesungHtml(t){
  let h = '';
  if (t.antworten && t.antworten.length){
    h += t.antworten.map(x => `<div class="lb-zeile">
        <span class="lb-q">${x.q ? lbText(x.q) : ''}</span>
        <span>${lbText(x.a)}${x.de ? `<span class="lb-de">${lbEsc(x.de)}</span>` : ''}</span>
      </div>`).join('');
    h += '<div class="lb-herkunft">Musterlösung aus deinen Karten zusammengesetzt (nicht vom Lehrer).</div>';
  }
  if (t.irab && t.irab.length && typeof irabZeilenHtml === 'function'){
    h += t.irab.map(s => `<div class="lb-satz">
        <div class="lb-ar" lang="ar" dir="rtl">${lbEsc(s)}</div>
        <div class="irab-box">${irabZeilenHtml(s)}</div>
      </div>`).join('');
  }
  if (t.regeln && t.regeln.length){
    h += '<div class="lb-herkunft">Deine Regeln dazu:</div>'
      + t.regeln.map(id => `<button class="lb-regel" data-lb-regel="${lbEsc(id)}">${lbText(lbRegelName(id))}</button>`).join('');
  }
  if (t.hinweis) h += `<div class="lb-hinweis">${lbEsc(t.hinweis)}</div>`;
  return h;
}

function zeichneLehrerblatt(){
  const ziel = document.getElementById('lehrerblattInhalt');
  if (!ziel || typeof LEHRERBLATT === 'undefined') return;
  const TEILE = { A: 'Teil A — Grundlagen und Nominalsatz', B: 'Teil B — Pronomen, Hinweiswörter und Fragen',
                  C: 'Teil C — Präpositionen und Iḍāfa', D: 'Teil D — Adjektive, Genus und Plural', E: 'Teil E — Übersetzung und Iʿrāb' };
  let teil = '';
  let h = `<div class="lb-kopf">${lbEsc(LEHRERBLATT.untertitel)}. Überleg dir die Antwort zuerst selbst, dann tippe auf „Lösung zeigen".<br>Quelle: ${lbEsc(LEHRERBLATT.quelle)}.</div>`;
  for (const a of LEHRERBLATT.aufgaben){
    if (a.teil !== teil){ teil = a.teil; h += `<div class="lb-teil">${lbEsc(TEILE[teil] || 'Teil ' + teil)}</div>`; }
    h += `<div class="lb-aufgabe">
      <div class="lb-titel"><span class="lb-titel-de">Aufgabe ${a.nr} · ${lbEsc(a.titelDe)}</span>${lbText(a.titelAr)}</div>`;
    a.teile.forEach((t, i) => {
      const key = a.nr + '-' + i;
      h += `<div class="lb-frage">${t.b ? `<b>${lbEsc(t.b)})</b> ` : ''}${lbEsc(t.frage)}</div>`;
      const items = (t.antworten || []).filter(x => x.q).map(x => x.q);
      if (items.length) h += `<div class="lb-items">${items.map(lbText).join('')}</div>`;
      else if (t.irab && t.irab.length) h += `<div class="lb-items">${t.irab.map(lbText).join('')}</div>`;
      h += `<button class="lb-knopf" data-lb-zeige="${key}">Lösung zeigen</button>
        <div class="lb-loesung hidden" id="lb-l-${key}">${lbLoesungHtml(t)}</div>`;
    });
    h += '</div>';
  }
  ziel.innerHTML = h;
}

document.addEventListener('click', function(e){
  const zeige = e.target.closest && e.target.closest('[data-lb-zeige]');
  if (zeige){
    const box = document.getElementById('lb-l-' + zeige.dataset.lbZeige);
    if (box){
      const offen = box.classList.toggle('hidden') === false;
      zeige.textContent = offen ? 'Lösung ausblenden' : 'Lösung zeigen';
    }
    return;
  }
  const regel = e.target.closest && e.target.closest('[data-lb-regel]');
  if (regel && typeof oeffneRegelKarte === 'function') oeffneRegelKarte(regel.dataset.lbRegel);
});
