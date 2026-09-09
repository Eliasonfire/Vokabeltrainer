/* einstellungen.js -- Einstellungen
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum. */
/* ===================== SETTINGS ===================== */
function renderSettings(){
  const sw = document.getElementById('toggleShowPlural');
  sw.classList.toggle('on', SETTINGS.showPlural);
  document.getElementById('togglePluralKarten').classList.toggle('on', !!SETTINGS.pluralKarten);
  document.getElementById('toggleVerbFormen').classList.toggle('on', !!SETTINGS.showVerbFormen);
  document.getElementById('toggleQuran').classList.toggle('on', !!SETTINGS.showQuran);
  zeigeSitzungsgroesse();
  if (typeof zeigeTagesDeckel === 'function') zeigeTagesDeckel();
  if (typeof zeigeHoerZiel === 'function') zeigeHoerZiel();
  document.getElementById('directionSelect').value = SETTINGS.direction || 'ar-de';
  document.getElementById('toggleTippen').classList.toggle('on', !!SETTINGS.tippenAbBox4);
  /* Wurzelmodus. Die Ausrichtung ist standardmaessig AN, deshalb wird auf
     `!== false` geprueft und nicht auf Wahrheit - ein fehlender Eintrag ist
     hier "an", nicht "aus". */
  document.getElementById('wurzelFarbeSelect').value = SETTINGS.wurzelFarbe || 'normal';
  document.getElementById('wurzelNiveauSelect').value = SETTINGS.wurzelNiveau || 'stand';
  document.getElementById('toggleWurzelAusrichten')
    .classList.toggle('on', SETTINGS.wurzelAusrichten !== false);
  zeichneFarbwahl();
  zeichneKenneSchonListe();
  zeichneEinzelnFreiListe();
  loadVoices();
}

/* ---------- Der Rückweg aus „Kenne ich schon" (17.08.2026) ----------

   Ohne diese Liste wäre der Knopf eine Einbahnstraße: ein Fehlgriff, und das
   Wort wäre für immer weg - und nirgends stünde, welches. (Der Knopf steht
   seit dem 18.08.2026 im Hörmodus, vorher auf der Lernkarte. Hier ändert das
   nichts: die Liste ist der Rückweg für beide Fälle.)
   Genau daran ist die Idee beim Aufschreiben der Anleitung gescheitert („dann
   holst du es dir zurück, indem du …" - es gab kein Indem).

   ⛔ Bis zum 07.09.2026 stand hier, die Liste stehe „bewusst offen da und nicht
   hinter einem Aufklapper: sie ist normalerweise leer und stört dann nicht".
   Die Begründung war richtig — für DIESE Liste. Sie galt aber ungeprüft auch
   für die zweite darunter, und die ist nicht leer: 28 Einträge auf Elias' Bild.
   Beide liegen jetzt hinter `pflegeListenSchalter`, und der Schalter erscheint
   nur, wenn es etwas zu zeigen gibt — der leere Fall bleibt also so ruhig wie
   vorher. [[regel_gilt_nur_mit_begruendung]] */
/* ⭐ Die Wörter, die er einzeln freigeschaltet hat, obwohl ihr Kapitel noch zu
   ist (20.08.2026). Ohne diese Liste ist der Knopf in der Wortkarte eine
   Einbahnstraße: zurücknehmen ginge nur dort, wo man das Wort erst wieder
   suchen muss. Genau dieselbe Überlegung wie eine Liste weiter oben. */
/* ---------- Die beiden Listen hinter einen Aufklapper (07.09.2026) ----------

   Elias mit Bild der Einstellungen, auf dem 28 freigeschaltete Wörter
   untereinander standen: „ich möchte das diese auflistung der wörter in einem
   punkt gepackt werden und beim aufklappen dann eine liste ergeben, damit die
   einstellungen nicht zur hälfte von dieser riesen liste eingenommen werden."

   ⛔ Damit ist die Begründung über `zeichneKenneSchonListe` überholt, die Liste
   stehe „bewusst offen da": sie galt für den Fall, dass die Liste normalerweise
   leer ist. Bei den einzeln freigeschalteten Wörtern trifft das nicht zu — dort
   sind es 28. Der Kommentar dort ist entsprechend geändert; eine Begründung,
   die nicht mehr trägt, aber stehen bleibt, ist die nächste falsche Fährte.
   [[widerspruch_liegt_in_der_beschriftung]]

   ⭐ EIN Bauteil für beide Listen. Zwei getrennte Fassungen wären zwei Stellen
   für dieselbe Entscheidung. [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
function pflegeListenSchalter(knopfId, listenId, anzahl){
  const knopf = document.getElementById(knopfId);
  const liste = document.getElementById(listenId);
  if (!knopf || !liste) return;
  knopf.dataset.n = String(anzahl);
  knopf.classList.toggle('da', anzahl > 0);
  /* ⛔ Eine leer gewordene Liste muss auch ZUgehen. Sonst bliebe der Schalter
     auf „offen" stehen, verschwände (weil `.da` fällt), und beim nächsten Wort
     käme die Liste ohne Zutun aufgeklappt zurück — genau das Bild, das er
     nicht mehr sehen will. */
  if (!anzahl){
    liste.classList.add('hidden');
    knopf.setAttribute('aria-expanded', 'false');
  }
  beschrifteListenSchalter(knopf);
}

function beschrifteListenSchalter(knopf){
  const txt = knopf.querySelector('.txt');
  if (!txt) return;
  const offen = knopf.getAttribute('aria-expanded') === 'true';
  const n = Number(knopf.dataset.n || 0);
  /* Die Zahl gehört in den Schalter, nicht nur in den Stand darüber:
     zugeklappt ist sie sonst die einzige Auskunft, die fehlt. */
  txt.textContent = (offen ? 'Liste ausblenden' : 'Liste zeigen') + ' (' + n + ')';
}

function schalteListeUm(knopfId, listenId){
  const knopf = document.getElementById(knopfId);
  const liste = document.getElementById(listenId);
  if (!knopf || !liste) return;
  const zu = liste.classList.toggle('hidden');
  knopf.setAttribute('aria-expanded', String(!zu));
  beschrifteListenSchalter(knopf);
}

function zeichneEinzelnFreiListe(){
  const kasten = document.getElementById('einzelnFreiListe');
  const stand  = document.getElementById('einzelnFreiStand');
  const alle   = document.getElementById('btnEinzelnFreiAlle');
  if (!kasten || !stand) return;
  const woerter = (typeof einzelnFreigeschaltete === 'function') ? einzelnFreigeschaltete() : [];

  /* ⚠️ Der Text hiess bis zum 07.09.2026 „… laufen mit, obwohl das Kapitel
     noch zu ist“ — und das stimmt seit demselben Tag nicht mehr uneingeschränkt:
     passtZurAuswahl() behandelt diese Wörter jetzt wie eigene Vokabeln, sie
     laufen also nur mit, solange kein Kapitel eingeengt ist oder „Eigene“
     angehakt ist. Ein Stand, der mehr verspricht als er hält, ist schlimmer
     als keiner. [[widerspruch_liegt_in_der_beschriftung]] */
  stand.textContent = woerter.length
    ? `${woerter.length} ${woerter.length===1?'Wort ist':'Wörter sind'} freigeschaltet, obwohl das Kapitel noch zu ist — sie laufen wie deine eigenen Vokabeln mit`
    : 'Noch keins freigeschaltet';
  if (alle) alle.disabled = !woerter.length;

  const eintrag = (w, knopf, marke) =>
    `<div class="kenne-schon-eintrag">
       <div class="kenne-schon-wort">
         <span class="ar" lang="ar" dir="rtl">${escapeHtml(w.sg || w.ar)}</span>
         <span class="de">${escapeHtml(w.de)} · ${escapeHtml(kapitelBeschriftung(w))}</span>
       </div>
       <button class="kenne-schon-zurueck" ${marke}="${escapeHtml(String(w.id))}">${knopf}</button>
     </div>`;

  /* ⛔⛔ DER RUECKWEG (07.09.2026). Elias: „ich habe testweise mal aladhi zu
     gemacht und es ist verschwunden … warum man die dann nicht wieder aufmachen
     kann“

     Ueber dieser Funktion steht seit dem 20.08.2026, die Liste sei der
     Rueckweg, damit der Knopf in der Wortkarte keine Einbahnstrasse ist. Sie
     war dann selbst eine: „Wieder zumachen“ nahm das Wort aus genau der Liste,
     in der es danach haette stehen muessen.
     [[bedingung_wird_durch_die_handlung_ungueltig]]

     Die zugemachten stehen bewusst UNTEN und abgesetzt: sie sind der
     Ausnahmefall, und wer sie nicht braucht, soll sie nicht zuerst lesen. */
  const zu = (typeof einzelnZugemachte === 'function') ? einzelnZugemachte() : [];
  kasten.innerHTML =
    woerter.map(w => eintrag(w, 'Wieder zumachen', 'data-einzelnzurueck')).join('')
    + (zu.length
        ? `<div class="einzeln-zu-titel">Wieder zugemacht — ${zu.length === 1 ? 'läuft' : 'laufen'} nicht mehr mit</div>`
          + zu.map(w => eintrag(w, 'Wieder aufmachen', 'data-einzelnauf')).join('')
        : '');

  /* Die Kopierzeile erscheint nur, wenn es etwas zu kopieren gibt — und das
     ist seit dem 20.08.2026 MEHR als die freigeschalteten Wörter: auch seine
     eigenen Korrekturen an Vokabeln stehen nur im localStorage. */
  const zeile = document.getElementById('einzelnFreiExportZeile');
  if (zeile) zeile.hidden = !(woerter.length || aenderungsZahl());

  /* ⚠️ Der Schalter zählt BEIDE Gruppen — die freigeschalteten und die wieder
     zugemachten. Zählte er nur `woerter`, verschwände er, sobald Elias das
     letzte Wort zumacht, und mit ihm der einzige Weg zurück: die zugemachten
     stehen in derselben Liste. Genau die Einbahnstraße, die am 07.09.2026
     behoben wurde. [[bedingung_wird_durch_die_handlung_ungueltig]] */
  pflegeListenSchalter('btnEinzelnFreiListe', 'einzelnFreiListe', woerter.length + zu.length);
}

/* Wie viele Vokabeln hat Elias selbst korrigiert? Die Zahl steht in der
   Beschriftung, damit er sieht, dass da etwas ist. */
function aenderungsZahl(){
  try { return Object.keys(WORT_AENDERUNGEN || {}).length; } catch (e) { return 0; }
}

/* ---------- Die Liste für die Wartung herausgeben (20.08.2026) ----------

   ⛔ Ohne diesen Weg ist `vt_einzeln_frei` eine Sackgasse: die Wörter laufen im
   Lernstoff mit, aber kein Werkzeug außerhalb des Browsers weiß von ihnen. Die
   Wartung mittwochs und sonntags gibt deshalb genau diesen Wörtern KEIN volles
   Programm — sie sieht sie nicht. [[daten_ohne_zugang]]

   Das Format ist bewusst schlicht und für Menschen lesbar: eine Zeile je Wort
   mit Id, Wort und Buch. Ein JSON wäre für ein Werkzeug bequemer, aber Elias
   fügt das in einen Chat ein und soll dabei sehen, was er weitergibt. */
function einzelnFreiAlsText(){
  const woerter = (typeof einzelnFreigeschaltete === 'function') ? einzelnFreigeschaltete() : [];
  if (!woerter.length) return '';
  const zeilen = woerter.map(w =>
    `${w.id}\t${w.ar}\t${w.de}\t${w.book || '?'} Kap. ${w.chapter}`);
  return `Einzeln freigeschaltete Wörter (${woerter.length}), Stand `
    + new Date().toLocaleDateString('de-DE') + '\n'
    + 'Id\tArabisch\tDeutsch\tHerkunft\n' + zeilen.join('\n');
}

/* ---------- Seine eigenen Korrekturen (20.08.2026) ----------

   ⛔⛔ DIESELBE SACKGASSE, ein zweites Mal. `vt_wortAenderungen` nimmt auf, was
   Elias im Bearbeitungsformular ändert: Schreibung, Übersetzung, Plural,
   Wurzel, Beispielsatz — und seit heute die Wortart. Alles davon liegt in
   seinem localStorage und in keiner Datei.

   Die Folge ist derselbe Kreislauf wie bei den einzeln freigeschalteten
   Wörtern, nur andersherum: Er trägt einen Plural ein, `vorrat.mjs` sieht ihn
   nie und meldet das Wort beim nächsten Lauf wieder als unvollständig. Er
   bekommt also jede Woche dieselbe Frage zu einem Wort, das er längst
   beantwortet hat. [[daten_ohne_zugang]]

   ⭐ NUR die Felder, die wirklich abweichen. `speichereWortAenderung()` legt
   immer alle sieben ab, auch die unveränderten — ein Export davon wäre bei
   zwanzig Korrekturen 140 Zeilen, von denen fünf etwas sagen.

   Der Vergleichswert kommt aus `window.VOKABELN[buch]` und NICHT aus
   `VOCAB_DATA`: dort hat `wendeWortAenderungenAn()` den neuen Wert längst
   hineingeschrieben, ein Vergleich damit fände nie einen Unterschied. Am
   20.08.2026 im Browser gegengeprüft — dieselbe Vokabel las sich in VOCAB_DATA
   als „GEAENDERT" und in VOKABELN weiterhin als „Moschee".
   [[eingefrorenes_feld_ist_kein_zustand]] */
function aenderungenAlsText(){
  let eintraege;
  try { eintraege = WORT_AENDERUNGEN || {}; } catch (e) { return ''; }
  const ids = Object.keys(eintraege);
  if (!ids.length) return '';

  /* ⛔ NFC vor dem Vergleich. Am 20.08.2026 gemessen: derselbe Plural أَئِمَّةٌ
     stand einmal als م + Fatḥah + Schaddah (645 64e 651) und einmal als
     م + Schaddah + Fatḥah (645 651 64e) — gleiches Bild, andere Reihenfolge der
     kombinierenden Marken, und `===` sagt „geändert". NFC sortiert sie nach
     ihrer Combining Class und macht beide gleich. [[arabisch_vergleichen_nfc]] */
  const gleich = (a, b) =>
    String(a == null ? '' : a).trim().normalize('NFC') === String(b == null ? '' : b).trim().normalize('NFC');

  const FELDER = ['ar', 'de', 'pl', 'root', 'type', 'sentAr', 'sentDe'];
  const zeilen = [];
  ids.forEach(id => {
    const a = eintraege[id];
    if (!a || typeof a !== 'object') return;
    const w = VOCAB_DATA.find(x => String(x.id) === String(id));
    /* WORT_ORIGINAL wird in js/kern.js gefüllt, bevor überschrieben wird —
       es ist die einzige Stelle, an der der Vorher-Wert noch steht. */
    const o = (typeof WORT_ORIGINAL !== 'undefined' && WORT_ORIGINAL[id]) || null;
    const felder = FELDER
      .filter(f => typeof a[f] === 'string' && a[f].trim())
      /* Ohne Original wird alles gezeigt — lieber zu viel als eine stille
         Auslassung, die wie „nichts geändert" aussieht. */
      .filter(f => !o || !(f in o) || !gleich(o[f], a[f]))
      .map(f => {
        const vorher = o && (f in o) ? String(o[f] || '').trim() : '';
        return `${f}: ${vorher ? vorher + '  →  ' : '(war leer)  →  '}${a[f]}`;
      });
    if (!felder.length) return;
    const kopf = w ? `${id}\t${w.ar}\t${w.de}` : `${id}\t(Wort nicht mehr im Bestand)`;
    zeilen.push(kopf + '\n    ' + felder.join('\n    '));
  });
  if (!zeilen.length) return '';
  return `Deine eigenen Korrekturen (${zeilen.length}), Stand `
    + new Date().toLocaleDateString('de-DE') + '\n' + zeilen.join('\n');
}

/* Beides zusammen — ein Knopf, ein Einfügen. */
function wartungsExportAlsText(){
  return [einzelnFreiAlsText(), aenderungenAlsText()].filter(Boolean).join('\n\n');
}

async function kopiereEinzelnFrei(){
  const text = wartungsExportAlsText();
  if (!text){ toast('Nichts zu kopieren.'); return; }
  /* ⚠️ navigator.clipboard braucht einen sicheren Kontext UND kann trotzdem
     werfen (verweigerte Berechtigung, Fokus verloren). Der Rückfallweg über ein
     verstecktes Textfeld funktioniert überall — ohne ihn stünde bei einem Fehler
     nur eine Konsolenmeldung, die niemand sieht. [[ausfall_ist_unsichtbar_gebaut]] */
  try {
    if (navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(text);
      toast('Liste kopiert — schick sie mir im Chat.');
      return;
    }
    throw new Error('kein clipboard');
  } catch (e) {
    const feld = document.createElement('textarea');
    feld.value = text;
    feld.setAttribute('readonly', '');
    feld.style.cssText = 'position:fixed;top:-1000px;left:0;opacity:0;';
    document.body.appendChild(feld);
    feld.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e2) { ok = false; }
    document.body.removeChild(feld);
    toast(ok ? 'Liste kopiert — schick sie mir im Chat.'
             : 'Kopieren ging nicht. Mach ein Bildschirmfoto der Liste oben.');
  }
}

document.getElementById('einzelnFreiListe').addEventListener('click', (e)=>{
  /* ⭐ Beide Richtungen an EINEM Zuhoerer, damit sie nicht auseinanderlaufen
     koennen: was der eine Weg tut, muss der andere zurueckdrehen — dieselbe
     Neuzeichnung, derselbe Aufruf von nachAuswahlwechsel(). Zwei getrennte
     Zuhoerer waeren zwei Stellen fuer dieselbe Entscheidung.
     [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
  const auf = e.target.closest('[data-einzelnauf]');
  if (auf){
    const id = auf.dataset.einzelnauf;
    setzeEinzelnFrei(id, true);
    zeichneEinzelnFreiListe();
    if (typeof nachAuswahlwechsel === 'function') nachAuswahlwechsel();
    const w = VOCAB_DATA.find(x => String(x.id) === id);
    toast(w ? `${w.de} läuft wieder mit.` : 'Wieder aufgemacht.');
    return;
  }
  const knopf = e.target.closest('[data-einzelnzurueck]');
  if (!knopf) return;
  const id = knopf.dataset.einzelnzurueck;
  setzeEinzelnFrei(id, false);
  zeichneEinzelnFreiListe();
  /* ⚠️ Wie in der Wortkarte: Lernvorrat, Kategorien, Wortfelder und Statistik
     hängen alle an derselben Prüfung und stehen sonst mit der alten Liste da. */
  if (typeof nachAuswahlwechsel === 'function') nachAuswahlwechsel();
  const w = VOCAB_DATA.find(x => String(x.id) === id);
  toast(w ? `${w.de} ist wieder außer Reichweite.` : 'Zurückgenommen.');
});

document.getElementById('btnEinzelnFreiKopieren').addEventListener('click', kopiereEinzelnFrei);

document.getElementById('btnEinzelnFreiAlle').addEventListener('click', ()=>{
  const woerter = einzelnFreigeschaltete();
  if (!woerter.length) return;
  woerter.forEach(w => setzeEinzelnFrei(w.id, false));
  zeichneEinzelnFreiListe();
  if (typeof nachAuswahlwechsel === 'function') nachAuswahlwechsel();
  toast(`${woerter.length} ${woerter.length===1?'Wort ist':'Wörter sind'} wieder außer Reichweite.`);
});

function zeichneKenneSchonListe(){
  const kasten = document.getElementById('kenneSchonListe');
  const stand  = document.getElementById('kenneSchonStand');
  const alle   = document.getElementById('btnKenneSchonAlle');
  if (!kasten || !stand) return;
  const woerter = (typeof bekannteMarkierungen === 'function') ? bekannteMarkierungen() : [];

  stand.textContent = woerter.length
    ? `${woerter.length} ${woerter.length===1?'Wort wird':'Wörter werden'} nicht mehr abgefragt`
    : 'Noch keins ausgeblendet';
  if (alle) alle.disabled = !woerter.length;

  kasten.innerHTML = woerter.map(w =>
    `<div class="kenne-schon-eintrag">
       <div class="kenne-schon-wort">
         <span class="ar" lang="ar" dir="rtl">${escapeHtml(w.ar)}</span>
         <span class="de">${escapeHtml(w.de)}</span>
       </div>
       <button class="kenne-schon-zurueck" data-zurueck="${escapeHtml(String(w.id))}">Wieder abfragen</button>
     </div>`).join('');

  pflegeListenSchalter('btnKenneSchonListe', 'kenneSchonListe', woerter.length);
}

/* Ein Zuhörer für beide Schalter — sie tun dasselbe an zwei Listen. */
document.getElementById('btnKenneSchonListe')
  .addEventListener('click', ()=> schalteListeUm('btnKenneSchonListe', 'kenneSchonListe'));
document.getElementById('btnEinzelnFreiListe')
  .addEventListener('click', ()=> schalteListeUm('btnEinzelnFreiListe', 'einzelnFreiListe'));
/* ---------- Die Gruppen in den Einstellungen (08.09.2026) ----------

   Elias: „guck mal ob man in meiner app die einstellungen etwas aufräumen
   kann." Vorher standen 24 Zeilen in EINER Liste, ohne eine einzige
   Überschrift und in gewachsener statt sortierter Reihenfolge.

   ⭐ Dasselbe Bauteil wie `schalteListeUm()` eine Ebene tiefer, nur über
   `aria-controls` statt über ein zweites Argument — damit die Zuordnung im
   HTML steht und nicht in zwei Dateien gleichzeitig gepflegt werden muss.

   ⭐ DER ZUSTAND WIRD GEMERKT, und das ist der eigentliche Punkt. Welche
   Gruppe er täglich braucht, weiß ich nicht — er schon. Das HTML gibt nur
   den ERSTEN Eindruck vor („Daten & App" zu, der Rest offen); ab dem ersten
   eigenen Klick entscheidet, was er selbst zuletzt eingestellt hat.
   [[pc_daten_sind_nicht_sein_lernstand]] */
const EINST_GRUPPEN_SCHLUESSEL = 'vt_einstGruppen';

function schalteEinstGruppe(knopf){
  const inhalt = document.getElementById(knopf.getAttribute('aria-controls'));
  if (!inhalt) return;
  const zu = inhalt.classList.toggle('hidden');
  knopf.setAttribute('aria-expanded', String(!zu));
  merkeEinstGruppen();
}

function merkeEinstGruppen(){
  const stand = {};
  document.querySelectorAll('.einst-gruppe').forEach(k => {
    stand[k.id] = k.getAttribute('aria-expanded') === 'true';
  });
  LS.set(EINST_GRUPPEN_SCHLUESSEL, stand);
}

function stelleEinstGruppenHer(){
  const stand = LS.get(EINST_GRUPPEN_SCHLUESSEL, null);
  document.querySelectorAll('.einst-gruppe').forEach(knopf => {
    knopf.addEventListener('click', ()=> schalteEinstGruppe(knopf));
    /* ⛔ Kein gespeicherter Wert heisst NICHT „zugeklappt": dann gilt, was im
       HTML steht. Ein `stand[k.id] || false` haette beim allerersten Start
       ALLE Gruppen zugeklappt — und die Einstellungen wären leer gewesen.
       [[vorgabewert_greift_nicht_bei_null]] */
    if (!stand || !(knopf.id in stand)) return;
    const inhalt = document.getElementById(knopf.getAttribute('aria-controls'));
    if (!inhalt) return;
    const offen = stand[knopf.id] === true;
    inhalt.classList.toggle('hidden', !offen);
    knopf.setAttribute('aria-expanded', String(offen));
  });
}

stelleEinstGruppenHer();


document.getElementById('kenneSchonListe').addEventListener('click', (e)=>{
  const knopf = e.target.closest('[data-zurueck]');
  if (!knopf) return;
  const id = knopf.dataset.zurueck;
  setzeKennErSchon(id, false);
  zeichneKenneSchonListe();
  const w = VOCAB_DATA.find(x => String(x.id) === id);
  toast(w ? `${w.de} wird wieder abgefragt.` : 'Wieder in der Abfrage.');
});

document.getElementById('btnKenneSchonAlle').addEventListener('click', ()=>{
  const woerter = bekannteMarkierungen();
  if (!woerter.length) return;
  woerter.forEach(w => setzeKennErSchon(w.id, false));
  zeichneKenneSchonListe();
  toast(`${woerter.length} ${woerter.length===1?'Wort kommt':'Wörter kommen'} wieder in die Abfrage.`);
});

/* Faerbung der Wurzel. Wirkt ueber ein Attribut am <body>, nicht ueber eine
   Klasse an jedem Wort: so laesst sie sich umschalten, ohne irgendetwas neu
   aufzubauen - und der Lesestand einer laufenden Uebung bleibt stehen. */
document.getElementById('wurzelFarbeSelect').addEventListener('change', (e)=>{
  SETTINGS.wurzelFarbe = e.target.value;
  saveSettings();
  document.body.dataset.wurzelfarbe = SETTINGS.wurzelFarbe;
  if (SETTINGS.wurzelFarbe === 'um'){
    toast('Umgekehrt: 32 von 113 Wörtern bestehen restlos aus ihrer Wurzel und stehen dann ganz grau da.');
  }
});
document.getElementById('toggleWurzelAusrichten').addEventListener('click', ()=>{
  SETTINGS.wurzelAusrichten = (SETTINGS.wurzelAusrichten === false);
  saveSettings();
  renderSettings();
  if (typeof wzAusrichten === 'function') wzAusrichten();
});
/* ⚠️ Das Niveau baut den ganzen Bestand neu auf. Danach MUSS eine frische
   Sitzung beginnen - die laufende zeigte sonst noch Woerter vom alten Stand,
   und der Hinweis darunter naennte eine Zahl, die zu ihr nicht passt. */
document.getElementById('wurzelNiveauSelect').addEventListener('change', (e)=>{
  SETTINGS.wurzelNiveau = e.target.value;
  saveSettings();
  if (typeof oeffneWurzeln === 'function') oeffneWurzeln();
});
document.getElementById('toggleTippen').addEventListener('click', ()=>{
  SETTINGS.tippenAbBox4 = !SETTINGS.tippenAbBox4;
  saveSettings();
  renderSettings();
  /* Der Hinweis erklaert, warum nach dem Einschalten erst mal nichts passiert:
     Karten in Box 1 bis 3 bleiben unveraendert. */
  /* ⚠️ Hier stand „— in Richtung Deutsch → Arabisch". Seit dem 07.09.2026 wird
     in BEIDEN Richtungen getippt; der Satz hätte die Hälfte der Übung
     verschwiegen. [[widerspruch_liegt_in_der_beschriftung]] */
  if (SETTINGS.tippenAbBox4) toast('Ab Box 4 wird eingetippt — in beide Richtungen, mit „Überspringen".');
});
document.getElementById('btnSettings').addEventListener('click', ()=>showScreen('settings'));
document.getElementById('toggleShowPlural').addEventListener('click', ()=>{
  SETTINGS.showPlural = !SETTINGS.showPlural;
  saveSettings();
  renderSettings();
});
/* ---------- Pluralkarten ein- und ausschalten (18.08.2026) ----------

   Anders als die Schalter darueber aendert dieser nicht nur die Anzeige,
   sondern den BESTAND: beim Einschalten kommen rund 120 Karten dazu, beim
   Ausschalten verschwinden sie wieder. Deshalb drei Dinge, die die anderen
   Schalter nicht brauchen:

   1. `wendePluralKartenAn` baut VOCAB_DATA um.
   2. `initProgress()` traegt fuer die neuen Karten eine Startbox nach - ohne
      das saehe man sie in den Kategorien, aber nie in „Jetzt lernen".
   3. Der Startbildschirm und die Kategorien zeigen Zaehlungen, die sich
      dadurch aendern; ohne den Neuaufbau stimmten sie bis zum naechsten Start
      nicht.

   ⭐ Der Fortschritt bleibt beim Ausschalten erhalten. initProgress loescht
   nichts, es traegt nur Fehlendes nach - wer die Karten wieder einschaltet,
   findet seine Kaesten so vor, wie er sie verlassen hat. */
document.getElementById('togglePluralKarten').addEventListener('click', ()=>{
  SETTINGS.pluralKarten = !SETTINGS.pluralKarten;
  saveSettings();
  const stand = wendePluralKartenAn(SETTINGS.pluralKarten);
  PROGRESS = initProgress();
  renderSettings();
  if (typeof renderHome === 'function') renderHome();
  if (typeof renderChapterCats === 'function') renderChapterCats();
  const dazu = Math.abs(stand.nachher - stand.vorher);
  toast(SETTINGS.pluralKarten
    ? `${dazu} Pluralkarten sind dazugekommen — sie starten in Kasten 1.`
    : `${dazu} Pluralkarten ausgeblendet. Ihr Fortschritt bleibt gespeichert.`);
});
/* Verbformen ein- und ausschalten (Elias' Wunsch vom 30.07.2026). Genau wie bei
   den Pluralformen: eine Umschaltung, kein eigener Bildschirm. */
document.getElementById('toggleVerbFormen').addEventListener('click', ()=>{
  SETTINGS.showVerbFormen = !SETTINGS.showVerbFormen;
  saveSettings();
  renderSettings();
});
/* Quran-Bezuege ein- und ausschalten (Elias' Wunsch vom 31.07.2026).
   renderHome() muss mit, weil die Kachel auf dem Startbildschirm daran haengt —
   ohne den Aufruf erschiene sie erst beim naechsten Start. */
document.getElementById('toggleQuran').addEventListener('click', ()=>{
  SETTINGS.showQuran = !SETTINGS.showQuran;
  saveSettings();
  renderSettings();
  if (typeof renderHome === 'function') renderHome();
});
/* ⭐ SITZUNGSGRÖSSE — feste Stufen UND eine eigene Zahl (06.09.2026).

   Elias: „ich will auch bei den karteikarten bei den einstellungen, dass ich
   selbst entscheiden kann wie viel genau ich trainiere, aktuell gibts die
   option 10 oder 20 zu lernen, letztens wollte ich aber 15 lernen und das ging
   nicht, keine option. diese option speziell soll eingefügt werden und auch
   indiduell selbst zahlen eingeben."

   ⚠️ Beides, nicht nur das Zahlenfeld: die festen Stufen sind mit einem Tipp
   erledigt, und 15 hat er ausdrücklich verlangt. Das Feld ist für alles
   andere da.

   ⛔ Die Auswahl allein reicht nicht zum Anzeigen. `select.value = "15"`
   greift nur, wenn es die Option gibt — steht in den Einstellungen eine 17,
   bliebe die Auswahl sonst LEER und sähe aus, als wäre nichts eingestellt.
   Deshalb entscheidet zeigeSitzungsgroesse(), ob eine feste Stufe passt oder
   „Eigene Zahl" mit gefülltem Feld gezeigt wird. */
const SITZUNG_STUFEN = ['10','15','20','40','9999'];

function zeigeSitzungsgroesse(){
  const wahl = document.getElementById('sessionSizeSelect');
  const feld = document.getElementById('sessionSizeEigen');
  if (!wahl || !feld) return;
  const wert = String(SETTINGS.sessionSize);
  const fest = SITZUNG_STUFEN.indexOf(wert) >= 0;
  wahl.value = fest ? wert : 'eigen';
  feld.hidden = fest;
  if (!fest) feld.value = wert;
}

/* Grenzen bewusst weit: 1 Karte ist eine sinnvolle Runde (eine schwere Vokabel
   noch einmal), und mehr als 999 deckt „Alle" ab. Ein leeres oder unsinniges
   Feld ändert NICHTS — sonst stünde nach einem halb getippten „1" plötzlich
   eine Einer-Runde in den Einstellungen. */
function setzeSitzungsgroesse(zahl){
  const n = Math.round(Number(zahl));
  if (!Number.isFinite(n) || n < 1 || n > 999) return false;
  SETTINGS.sessionSize = n;
  saveSettings();
  if (typeof renderHome === 'function') renderHome();
  return true;
}

/* ⭐ Der Tagesdeckel — wie viele fällige Karten heute überhaupt angeboten
   werden. Die Rechnung dahinter steht bei `tagesAuswahl()` in js/kern.js.
   ⚠️ Einfacher gebaut als die Sitzungsgröße: dort brauchte Elias eine eigene
   Zahl („letztens wollte ich aber 15 lernen"), hier sind die Stufen von 5 bis
   30 breit genug, und „Aus" ist die wichtigste Option — sie muss ohne Umweg
   erreichbar sein. Kommt eine eigene Zahl später dazu, ist das Muster von
   `zeigeSitzungsgroesse()` das Vorbild. */
function zeigeTagesDeckel(){
  const wahl = document.getElementById('tagesDeckelSelect');
  if (!wahl) return;
  const wert = String(Number.isFinite(SETTINGS.tagesDeckel) ? SETTINGS.tagesDeckel : 10);
  /* ⛔ Steht dort eine Zahl, die es als Option nicht gibt, bliebe die Auswahl
     LEER und sähe aus, als wäre nichts eingestellt — derselbe Fehler, der bei
     der Sitzungsgröße schon einmal auftrat. Dann lieber die nächstliegende
     Stufe zeigen als gar nichts. */
  const stufen = [...wahl.options].map(o => o.value);
  wahl.value = stufen.includes(wert) ? wert
    : String(stufen.map(Number).filter(n => n > 0)
        .reduce((a, b) => Math.abs(b - Number(wert)) < Math.abs(a - Number(wert)) ? b : a, 10));
}

const deckelWahl = document.getElementById('tagesDeckelSelect');
if (deckelWahl) deckelWahl.addEventListener('change', (e)=>{
  const n = Number(e.target.value);
  if (!Number.isFinite(n) || n < 0) return;
  SETTINGS.tagesDeckel = n;
  saveSettings();
  if (typeof renderHome === 'function') renderHome();
});

/* ⭐ Das Hör-Tagesziel (08.09.2026). Bis dahin stand es als feste `10` in
   js/hoeren.js. Vorgabe ist jetzt 5 — die Begründung steht bei den
   SETTINGS-Vorgaben in js/kern.js.

   ⭐ Mit eigener Zahl seit demselben Abend, eine halbe Stunde später. Elias:
   „ich will auch individuell eingeben können." Ich hatte oben noch geschrieben,
   die Stufen 3 bis 30 deckten den Bereich ab — dieselbe Fehleinschätzung wie
   am 06.09.2026 bei der Sitzungsgröße („letztens wollte ich aber 15 lernen und
   das ging nicht, keine option"). ⛔ Zweimal dieselbe Annahme, zweimal von ihm
   widerlegt: **Eine Stufenliste, die ich für ausreichend halte, ist keine
   Messung seines Bedarfs.** [[kann_ist_nicht_ist]]

   ⛔ Die Auswahl allein reicht nicht zum Anzeigen: `select.value = "7"` greift
   nur, wenn es die Option gibt — sonst bliebe sie LEER und sähe aus, als wäre
   nichts eingestellt. Deshalb entscheidet zeigeHoerZiel(), ob eine feste Stufe
   passt oder „Eigene Zahl" mit gefülltem Feld gezeigt wird. */
const HOER_STUFEN = ['3','5','10','15','20','30'];

function zeigeHoerZiel(){
  const wahl = document.getElementById('hoerZielSelect');
  const feld = document.getElementById('hoerZielEigen');
  if (!wahl || !feld) return;
  const wert = String(hoerTagesziel());
  const fest = HOER_STUFEN.indexOf(wert) >= 0;
  wahl.value = fest ? wert : 'eigen';
  feld.hidden = fest;
  if (!fest) feld.value = wert;
}

/* Grenzen wie bei der Sitzungsgröße, und aus demselben Grund weit: 1 Wort ist
   an einem schlechten Tag ein sinnvolles Ziel — genau dafür ist die Zahl da.
   Ein leeres oder unsinniges Feld ändert NICHTS, sonst stünde nach einem halb
   getippten „1" plötzlich ein Einer-Ziel in den Einstellungen. */
function setzeHoerZiel(zahl){
  const n = Math.round(Number(zahl));
  if (!Number.isFinite(n) || n < 1 || n > 999) return false;
  SETTINGS.hoerZiel = n;
  saveSettings();
  /* ⚠️ Die Standzeile im Hörmodus trägt die Zahl im Text („Tagesziel 2 von
     5"). Ohne dieses Nachziehen behauptet sie die alte Zahl weiter, bis der
     Modus neu geöffnet wird — der Klassiker: die Einstellung wirkt, aber man
     sieht es nicht, und das sieht aus wie ein Fehler. */
  if (typeof hoerStandSchreiben === 'function' && document.getElementById('hoerStand')) hoerStandSchreiben();
  return true;
}

const hoerZielWahl = document.getElementById('hoerZielSelect');
if (hoerZielWahl) hoerZielWahl.addEventListener('change', (e)=>{
  const feld = document.getElementById('hoerZielEigen');
  if (e.target.value === 'eigen'){
    feld.hidden = false;
    if (!feld.value) feld.value = String(hoerTagesziel());
    feld.focus();
    feld.select();
    return;                       /* erst die Zahl, dann wird gespeichert */
  }
  feld.hidden = true;
  setzeHoerZiel(e.target.value);
});

const hoerZielFeld = document.getElementById('hoerZielEigen');
if (hoerZielFeld){
  hoerZielFeld.addEventListener('input', (e)=>{ setzeHoerZiel(e.target.value); });
  /* Beim Verlassen zurueck auf den gespeicherten Stand, falls die Eingabe
     unbrauchbar war — sonst behauptet das Feld eine Zahl, die nicht gilt. */
  hoerZielFeld.addEventListener('blur', ()=>{ zeigeHoerZiel(); });
}

document.getElementById('sessionSizeSelect').addEventListener('change', (e)=>{
  const feld = document.getElementById('sessionSizeEigen');
  if (e.target.value === 'eigen'){
    feld.hidden = false;
    if (!feld.value) feld.value = String(SETTINGS.sessionSize);
    feld.focus();
    feld.select();
    return;                       /* erst die Zahl, dann wird gespeichert */
  }
  feld.hidden = true;
  SETTINGS.sessionSize = Number(e.target.value);
  saveSettings();
  if (typeof renderHome === 'function') renderHome();
});

document.getElementById('sessionSizeEigen').addEventListener('input', (e)=>{
  setzeSitzungsgroesse(e.target.value);
});
/* Beim Verlassen zurueck auf den gespeicherten Stand, falls die Eingabe
   unbrauchbar war — sonst behauptet das Feld eine Zahl, die nicht gilt. */
document.getElementById('sessionSizeEigen').addEventListener('blur', ()=>{
  zeigeSitzungsgroesse();
  if (typeof zeigeTagesDeckel === 'function') zeigeTagesDeckel();
});
document.getElementById('directionSelect').addEventListener('change', (e)=>{
  SETTINGS.direction = e.target.value;
  saveSettings();
});
document.getElementById('voiceSelect').addEventListener('change', (e)=>{
  SETTINGS.voiceURI = e.target.value;
  saveSettings();
});
/* ---------- Sicherung ----------
   Alles, was Elias selbst erarbeitet hat, steht im localStorage dieses einen
   Browsers: Leitner-Boxen, eigene Eselsbruecken, abgehakte Verse, eigene
   Vokabeln, eigene Kategorien. Ein geleerter Browserspeicher, ein neues Handy
   oder ein anderer Browser - und es ist weg. Die App hat kein Backend und soll
   auch keines bekommen (Goal-Prompt), also ist eine Datei der richtige Weg:
   sie liegt bei ihm, geht durch keine fremde Hand und funktioniert offline.

   Der Wortschatz selbst wird NICHT mitgesichert. Der steht in den Datendateien
   der App und kommt beim naechsten Aufruf ohnehin wieder - ihn mitzuschreiben
   blaehte die Sicherung von wenigen Kilobyte auf ueber ein Megabyte auf. */
const SICHERUNGS_SCHLUESSEL = [
  'vt_progress', 'vt_notes', 'vt_settings', 'vt_streak',
  'vt_uebungstage', /* Uebungskalender (21.08.2026) — nicht wiederherstellbar */
  'vt_personalVocab', 'vt_customCats', 'vt_hifz', 'vt_hifzVerse',
  'vt_hoerTag',   /* Tageszaehler Hoermodus, 17.08.2026 */
  'vt_bekannt',   /* „Kenne ich schon" — seine Auswahl, nicht wiederherstellbar */
  'vt_vorschlagNr', /* welcher Eselsbrücken-Vorschlag gilt (18.08.2026) — dito */
  'vt_vorschlagWeg', /* welche Vorschläge er abgelehnt hat (19.08.2026) — dito */
  'vt_wortAenderungen', /* seine Korrekturen an Buchvokabeln (18.08.2026) */
  'vt_geloescht',   /* ausgeblendete Fachbegriffe (18.08.2026) */
  /* Beide am 04.08.2026 nachgetragen. `vt_quranFav` (Favoriten-Suren) war seit
     seiner Einfuehrung am selben Tag nicht dabei - aufgefallen erst, als
     `vt_lesestand` dazukam und die Liste noch einmal gelesen wurde. Wer eine
     Sicherung einspielte, verlor die Favoriten lautlos. */
  'vt_quranFav', 'vt_lesestand',
  /* Seine eigenen Grammatiknotizen an den Wortkarten (20.08.2026). Sie stehen
     nirgends sonst — geht die Liste hier daran vorbei, ist die Sicherung eine
     Sicherung ohne sie, und das faellt erst beim Einspielen auf. */
  'vt_notizen'
];

function baueSicherung(){
  const daten = {};
  SICHERUNGS_SCHLUESSEL.forEach(k=>{
    const v = localStorage.getItem(k);
    if (v !== null) daten[k] = v;
  });
  return {
    art: 'vokabeltrainer-sicherung',
    fassung: 1,
    erstellt: new Date().toISOString(),
    vokabelnImGeraet: VOCAB_DATA.length,   // nur zur Orientierung beim Einlesen
    daten
  };
}

document.getElementById('btnSicherung').addEventListener('click', ()=>{
  const inhalt = JSON.stringify(baueSicherung(), null, 1);
  const url = URL.createObjectURL(new Blob([inhalt], {type:'application/json'}));
  const a = document.createElement('a');
  a.href = url;
  a.download = `vokabeltrainer-sicherung-${todayStr(0)}.json`;
  a.click();
  /* Erst nach dem Klick freigeben - sonst ist die URL weg, bevor der Browser
     sie gelesen hat. */
  setTimeout(()=>URL.revokeObjectURL(url), 2000);
  toast('Sicherung gespeichert.');
});

document.getElementById('btnSicherungLaden').addEventListener('click', ()=>{
  document.getElementById('sicherungDatei').click();
});

document.getElementById('sicherungDatei').addEventListener('change', (e)=>{
  const datei = e.target.files && e.target.files[0];
  e.target.value = '';                      // damit dieselbe Datei erneut geht
  if (!datei) return;
  const leser = new FileReader();
  leser.onload = ()=>{
    let sicherung;
    try { sicherung = JSON.parse(leser.result); }
    catch { toast('Das ist keine lesbare Sicherungsdatei.'); return; }
    if (!sicherung || sicherung.art !== 'vokabeltrainer-sicherung' || !sicherung.daten){
      toast('Diese Datei stammt nicht aus dem Vokabeltrainer.');
      return;
    }
    const wann = sicherung.erstellt ? sicherung.erstellt.slice(0,10) : 'unbekannt';
    if (!confirm(`Sicherung vom ${wann} einlesen?\n\nDer aktuelle Stand auf diesem Gerät wird dabei ersetzt — Boxen, Eselsbrücken, Hifz, eigene Vokabeln.`)) return;
    /* Nur die bekannten Schluessel uebernehmen. Eine Sicherungsdatei ist eine
       fremde Datei; ungepruefte Schluessel aus ihr in den localStorage zu
       schreiben waere unnoetig grosszuegig. */
    SICHERUNGS_SCHLUESSEL.forEach(k=>{
      if (typeof sicherung.daten[k] === 'string') localStorage.setItem(k, sicherung.daten[k]);
      else localStorage.removeItem(k);
    });
    toast('Sicherung eingelesen — die App startet neu.');
    /* Neu laden statt den halben Zustand im Speicher nachzuziehen: PROGRESS,
       NOTES, SETTINGS, HIFZ und die eigenen Vokabeln haengen an Modulvariablen,
       die beim Start gefuellt werden. */
    setTimeout(()=>location.reload(), 900);
  };
  leser.onerror = ()=> toast('Die Datei liess sich nicht lesen.');
  leser.readAsText(datei);
});

document.getElementById('btnResetProgress').addEventListener('click', ()=>{
  if (!confirm('Wirklich den gesamten Lernfortschritt zurücksetzen? Alle Karten gehen zurück auf Box 1.')) return;
  PROGRESS = {};
  VOCAB_DATA.forEach(w=>{ PROGRESS[w.id] = { box:1, nextReview: todayStr(0), correct:0, wrong:0 }; });
  saveProgress();
  toast('Lernfortschritt zurückgesetzt');
  renderHome();
});
/* HIER STAND „Streak zurücksetzen". Am 29.07.2026 auf Elias' Wunsch entfernt.
   Der Schlüssel `vt_streak` bleibt selbstverständlich — nur der Knopf ist weg. */

/* ---------- Quran-Markierungen aufräumen (09.09.2026) ----------

   Elias mit Bild der Surenliste: „und mach überall auf dem pc die fav und
   gelernten markierung weg, nur mulk kann beides bleiben".

   ⛔ Drei Speicher, nicht einer — und der dritte ist der, den man vergisst:
     `QURAN_FAV`   Stern je Sure          → saveQuranFav()
     `HIFZ`        Auswendig-Haken je Sure → saveHifz()
     `HIFZ_VERSE`  Haken je EINZELVERS     → saveHifzVerse()
   Bliebe der dritte stehen, sähe die Liste aufgeräumt aus und beim Öffnen
   einer Sure wären die Verse weiter abgehakt. [[fehler_trifft_mehr_als_gemeldet]]

   ⭐ Al-Mulk ist Sure 67 — die Zahl steht hier EINMAL als Konstante, damit
   niemand sie in drei Schleifen einzeln pflegen muss.

   ⚠️ `saveHifz()` & Co. schreiben die Zeitstempel-Form: ein Eintrag, dessen
   Zustand sich ändert, bekommt `Date.now()`. Damit gewinnt das Aufräumen im
   Abgleich gegen die alten Marken auf Handy und Tablet — das ist gewollt
   („überall"), und genau deshalb steht es auch in der Rückfrage. */
const QURAN_MARKEN_BEHALTEN = 67;

document.getElementById('btnQuranMarkenWeg')?.addEventListener('click', ()=>{
  const zaehle = (o) => Object.keys(o || {}).length;
  const sterne = zaehle(typeof QURAN_FAV === 'object' ? QURAN_FAV : {});
  const haken  = zaehle(typeof HIFZ === 'object' ? HIFZ : {});
  const verse  = zaehle(typeof HIFZ_VERSE === 'object' ? HIFZ_VERSE : {});
  if (!sterne && !haken && !verse){ toast('Es gibt keine Markierungen zum Aufräumen.'); return; }

  const frage = 'Sterne und Auswendig-Haken entfernen?\n\n'
    + sterne + ' Sterne · ' + haken + ' abgehakte Suren · ' + verse + ' abgehakte Verse\n\n'
    + 'Al-Mulk (67) behält beides. Das gilt nach dem Abgleich auf allen Geräten.';
  if (!confirm(frage)) return;

  let weg = 0;
  const nurMulk = (o) => {
    for (const k of Object.keys(o)){
      if (Number(k) === QURAN_MARKEN_BEHALTEN) continue;
      delete o[k]; weg++;
    }
  };
  if (typeof QURAN_FAV === 'object'){ nurMulk(QURAN_FAV); saveQuranFav(); }
  if (typeof HIFZ === 'object'){ nurMulk(HIFZ); saveHifz(); }
  /* ⛔ Die Verse tragen `sure:vers`, nicht die Surennummer allein — hier zählt
     der Teil VOR dem Doppelpunkt. Ein `Number(k)` auf „67:12" ergibt NaN und
     hätte auch al-Mulks Verse gelöscht. [[regex_erzwingt_zweite_zahl]] */
  if (typeof HIFZ_VERSE === 'object'){
    for (const k of Object.keys(HIFZ_VERSE)){
      if (Number(String(k).split(':')[0]) === QURAN_MARKEN_BEHALTEN) continue;
      delete HIFZ_VERSE[k]; weg++;
    }
    saveHifzVerse();
  }
  toast(weg + ' Markierungen entfernt — al-Mulk ist geblieben.');
  if (typeof renderSurahList === 'function')
    renderSurahList(document.getElementById('surahSearch').value);
  if (typeof renderHome === 'function') renderHome();
});

/* ---------- Diagnose ----------

   ⭐ Anlass: „habe eben 5 wörter angehört und konfeti kam erst bei startseite,
   das soll aber doch kommen beim hörmodus" (Elias, 08.09.2026). Im Prüfbrowser
   kam das Konfetti sofort und an der richtigen Stelle — der Fall ist nur auf
   SEINEM Gerät zu sehen. Eine zweite Reparatur ohne Messung wäre geraten.
   [[diagnose_statt_raten]]

   ⛔ Ausgegeben wird TEXT, kein Diagramm: Elias schickt Bildschirmfotos, das
   ist sein eingespielter Weg. Ein Text, den man abfotografieren kann, kommt
   damit vollständig an — eine Konsole auf dem Handy nicht.

   ⚠️ Jede Quelle wird EINZELN abgesichert. Fehlt ein Modul (der Hörmodus wird
   erst bei Bedarf geladen), darf das nicht die ganze Karte leeren — sonst
   sieht man statt der Diagnose nichts und weiß wieder nicht, warum.
   [[ausfall_ist_unsichtbar_gebaut]] */
function diagnoseText(){
  const zeilen = [];
  const dazu = (name, wert) => zeilen.push(name + ': ' + wert);
  const sicher = (name, fn) => {
    try { dazu(name, fn()); } catch (e){ dazu(name, '— (' + (e && e.message) + ')'); }
  };

  dazu('Stand', new Date().toLocaleString('de-DE'));
  /* ⭐ Der LERNTAG neben der Uhrzeit (09.09.2026). Seine Karte um 02:46 zeigte
     „Hören heute: 5 gehört · Ziel 5" und darunter „Feiern heute: (noch
     keine)" — das sah nach einem Fehler aus und war keiner: um 02:46 läuft
     noch der Lerntag vom Vortag (Tagesgrenze 8 Uhr), und dessen Feier war am
     Nachmittag längst durch. Ohne diese Zeile muss man das wissen; mit ihr
     steht es da. [[tagesbegriff_der_app_ist_utc]] */
  sicher('Lerntag', () => (typeof todayStr === 'function' ? todayStr(0) : '—')
    + ' (beginnt 8 Uhr — davor zählt der Vortag)');
  /* ⭐ Die Selbstmeldung zum Dark-Reader-Riegel (09.09.2026). Das
     `<meta name="darkreader-lock">` im Kopf sperrt die Erweiterung aus — aber
     ein Gegenmittel, das still ausfallen kann, ist dieselbe Falle wie vorher,
     nur unsichtbarer. In Dark Reader 4.9.86 gab es einen Fehler, durch den das
     Tag ignoriert wurde. [[ausfall_ist_unsichtbar_gebaut]]
     ⚠️ Die Erweiterung setzt ihre Marken ERST NACH dem Laden. Sofort gefragt
     meldete sie im Korantrainer fälschlich „nicht aktiv" — hier wird deshalb
     zum Zeitpunkt des Knopfdrucks gemessen, und das ist lange danach. */
  sicher('Dark Reader', () => {
    const marke = document.documentElement.dataset.darkreaderMode
               || document.documentElement.dataset.darkreaderScheme;
    const knoten = document.querySelectorAll('style.darkreader, style[class*="darkreader"]').length;
    if (!marke && !knoten) return 'ausgesperrt (Farben stimmen)';
    return '⛔ LÄUFT TROTZDEM (' + (marke || 'ohne Marke') + ', ' + knoten
      + ' Stilknoten) — die Farben auf diesem Gerät sind nicht die der App';
  });
  sicher('Akzentfarbe', () => {
    const w = getComputedStyle(document.documentElement).getPropertyValue('--red').trim();
    const soll = (typeof SETTINGS === 'object' && SETTINGS && SETTINGS.akzentFarbe) || '#ff1744';
    return w + (w.toLowerCase() === soll.toLowerCase() ? ' (wie eingestellt)' : ' — eingestellt ist ' + soll);
  });
  /* ⛔⛔ DIE VERSION MUSS OBEN STEHEN (09.09.2026). „Service Worker aktiv"
     sagte nur, DASS einer läuft — nicht WELCHE Fassung er ausliefert. Genau
     das war zweimal hintereinander die offene Frage („die lücke beim tablet
     ist immer noch da"): behoben oder nur nicht angekommen?
     ⭐ Gelesen wird der Name des Zwischenspeichers, denn der ist die Wahrheit
     darüber, was die Seite gerade bedient — nicht eine Zahl, die jemand ins
     Markup schreibt und beim nächsten Mal vergisst.
     [[alte_fassung_beim_nutzer]] [[frischeprobe_braucht_geaenderte_zahl]] */
  zeilen.push('Version: … (wird geladen)');
  const versionZeile = zeilen.length - 1;
  try {
    if (window.caches && caches.keys) caches.keys().then(namen => {
      const v = namen.filter(n => /vokabeltrainer-v/.test(n)).sort().join(', ') || 'kein Zwischenspeicher';
      const kasten = document.getElementById('diagnoseText');
      if (kasten && !kasten.classList.contains('hidden'))
        kasten.textContent = kasten.textContent.replace('Version: … (wird geladen)',
          'Version: ' + v + (navigator.serviceWorker && navigator.serviceWorker.controller ? '' : ' (SW steuert nicht)'));
    });
  } catch (e){ stillerFehler('Diagnose: Version lesen', e); }
  sicher('Bildschirm', () => window.innerWidth + '×' + window.innerHeight
    + ' · Gerät ' + (screen && screen.width) + '×' + (screen && screen.height)
    + ' · Pixelverhältnis ' + (window.devicePixelRatio || 1));
  /* ⛔⛔ WO LÄUFT DIE APP? (09.09.2026, nach der fünften Meldung „lücke ist
     immer noch da und der weiße streifen auch"). Alles, was die App selbst
     malt, ist gemessen schwarz — bleibt ein heller Streifen, kommt er von dem,
     was AUSSEN HERUM ist: Chromes eigene Leiste, das Fenster eines geteilten
     Bildschirms, die Systemleiste. Ob die App installiert läuft oder im
     Browser, ob das Fenster das ganze Gerät ausfüllt und ob eine
     Sicherheitszone oben liegt, entscheidet, welche dieser drei es ist.
     [[diagnose_statt_raten]] */
  sicher('Läuft als', () => {
    const modi = ['standalone', 'fullscreen', 'minimal-ui', 'browser'];
    const m = modi.find(x => window.matchMedia('(display-mode: ' + x + ')').matches) || '?';
    return (m === 'browser' ? 'Browser-Tab (nicht installiert)' : 'installierte App (' + m + ')');
  });
  sicher('Sicherheitszone oben', () => {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--safe-top').trim();
    const px = document.createElement('div');
    px.style.cssText = 'position:fixed;top:0;height:env(safe-area-inset-top,0px);width:1px;visibility:hidden';
    document.body.appendChild(px);
    const h = px.getBoundingClientRect().height; px.remove();
    return v + ' (gemessen ' + Math.round(h) + ' px)';
  });
  sicher('Fenster füllt Gerät', () => {
    const vv = window.visualViewport;
    const fenster = window.innerWidth + '×' + window.innerHeight;
    const sicht = vv ? Math.round(vv.width) + '×' + Math.round(vv.height) + ' (Versatz ' + Math.round(vv.offsetTop) + ')' : '—';
    const voll = (screen.width === window.innerWidth) ? 'ja' : 'NEIN — ' + (screen.width - window.innerWidth) + ' px schmaler';
    return voll + ' · Fenster ' + fenster + ' · sichtbar ' + sicht;
  });
  sicher('Oberste 3 px', () => {
    /* Was liegt ganz oben, und wie wird es GEMALT — Farbe UND Bild. Ein
       Verlauf hat backgroundColor rgb(0,0,0) und ist trotzdem rot. */
    const e = document.elementFromPoint(Math.round(window.innerWidth / 2), 1);
    if (!e) return 'nichts (Punkt außerhalb der Seite)';
    const s = getComputedStyle(e);
    return (e.id ? '#' + e.id : e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0])
      + ' · Farbe ' + s.backgroundColor + ' · Bild ' + (s.backgroundImage === 'none' ? 'keins' : s.backgroundImage.slice(0, 38) + '…');
  });
  /* ⭐ Die Kopfzeile, Zahl für Zahl — der Fall, an dem zwei Reparaturen
     gescheitert sind. Wer diese vier Werte sieht, weiß sofort, WO die Lücke
     entsteht: passt die Polsterung nicht zur gemessenen Höhe, oder wurde gar
     nicht gemessen? [[diagnose_statt_raten]] */
  sicher('Kopfzeile', () => {
    const tb = document.querySelector('header.topbar');
    const main = document.getElementById('main');
    if (!tb || !main) return '—';
    const h = Math.round(tb.getBoundingClientRect().height);
    const gesetzt = document.documentElement.style.getPropertyValue('--topbar-h').trim() || '(nicht gesetzt)';
    const pad = Math.round(parseFloat(getComputedStyle(main).paddingTop) || 0);
    return 'hoch ' + h + ' · gemessen ' + gesetzt + ' · Polsterung ' + pad
      + ' → Lücke ' + (pad - h) + ' px';
  });
  sicher('Quran-Kopf', () => {
    const tb = document.querySelector('header.topbar');
    const sh = document.querySelector('#screen-quranfull .screen-header');
    if (!tb || !sh) return '—';
    const a = tb.getBoundingClientRect().bottom, b = sh.getBoundingClientRect().top;
    if (!sh.offsetParent) return 'Leser gerade nicht offen';
    return 'Abstand Kopfzeile → Surentitel: ' + Math.round(b - a) + ' px';
  });
  sicher('Abgleich', () => (typeof syncPutStand === 'function') ? syncPutStand() : '—');
  sicher('Hören heute', () => {
    if (typeof hoerTag !== 'function') return '—';
    const t = hoerTag();
    return t.gesamt + ' gehört, ' + t.richtig + ' richtig · Ziel '
      + (typeof hoerTagesziel === 'function' ? hoerTagesziel() : '?');
  });

  zeilen.push('');
  zeilen.push('Feiern heute:');
  let feiern = [];
  /* ⛔ Ohne Meldung waere ein Fehler hier die schlimmste Sorte: die Karte
     zeigte dann „(noch keine)" — also einen BEFUND, wo in Wahrheit die
     Messung ausgefallen ist. [[leere_liste_ist_keine_messung]] */
  try { feiern = (typeof feierProtokoll === 'function') ? feierProtokoll() : []; }
  catch (e){ stillerFehler('Diagnose: Feier-Protokoll', e); }
  if (!feiern.length) zeilen.push('  (noch keine)');
  else feiern.forEach(z => zeilen.push('  ' + z.uhr + '  ' + z.anlass + '  @ ' + z.wo
    + (z.fehler ? '  ⛔ ' + z.fehler : '')));

  zeilen.push('');
  zeilen.push('Geh-Modus heute:');
  let geh = [];
  /* ⛔ Gleiche Falle wie oben: „(nicht gelaufen)" waere sonst eine Aussage
     ueber den Geh-Modus, obwohl sie eine ueber das Auslesen ist. */
  try { geh = (typeof gehProtokollZeilen === 'function') ? gehProtokollZeilen() : []; }
  catch (e){ stillerFehler('Diagnose: Geh-Protokoll', e); }
  if (!geh.length) zeilen.push('  (nicht gelaufen)');
  else {
    const woerter = geh.filter(z => z.was === 'wort');
    const stumm   = woerter.filter(z => z.sprach === false).length;
    const dunkel  = geh.filter(z => z.sichtbar === 'hidden').length;
    zeilen.push('  ' + woerter.length + ' Wörter · ' + stumm + ' ohne Ton · '
      + dunkel + ' bei ausgeschaltetem Bildschirm');
    /* Nur die letzten acht Zeilen — der Rest passt auf kein Bildschirmfoto. */
    geh.slice(-8).forEach(z => zeilen.push('  ' + z.uhr + '  ' + z.was + '  ' + z.sichtbar
      + (z.sprach === false ? '  ⛔ stumm' : '')));
  }

  /* ---------- Geschluckte Fehler (09.09.2026) ----------
     ⭐⭐ Der Abschnitt, der den Konfetti-Fall in einer Zeile geloest haette.
     Er steht ZULETZT und damit unten auf dem Bildschirmfoto — davor stehen
     die Werte, die man in jedem Fall braucht. Ist er leer, ist das eine
     echte Aussage: seit dem Start ist kein Fehler geschluckt worden.
     [[ausfall_ist_unsichtbar_gebaut]] */
  zeilen.push('');
  zeilen.push('Geschluckte Fehler seit dem Start:');
  let still = [];
  try { still = (typeof stilleFehlerZeilen === 'function') ? stilleFehlerZeilen() : ['  — (Protokoll fehlt)']; }
  catch (e){ still = ['  — (Protokoll unlesbar: ' + (e && e.message) + ')']; }
  if (!still.length) zeilen.push('  (keine — gut)');
  else still.forEach(z => zeilen.push(z));

  return zeilen.join('\n');
}

document.getElementById('btnDiagnose')?.addEventListener('click', ()=>{
  const kasten = document.getElementById('diagnoseText');
  const knopf  = document.getElementById('btnDiagnose');
  if (!kasten) return;
  /* ⚠️ `hidden` als KLASSE, nicht als Attribut — die App führt beides, und die
     Klasse `.hidden` gewinnt gegen ein `display` aus der Regel darüber.
     [[hidden_verliert_gegen_display]] */
  const zu = kasten.classList.contains('hidden');
  if (zu) kasten.textContent = diagnoseText();
  kasten.classList.toggle('hidden', !zu);
  if (knopf) knopf.textContent = zu ? 'Verbergen' : 'Anzeigen';
});

/* ---------- App aktualisieren ----------
   Notausgang aus einem Kreislauf, in dem Elias am 30.07.2026 festhing: Die
   Ziehgeste zum Aktualisieren war kaputt, also kam kein neuer Stand an — auch
   nicht der Fix für die Geste. In der installierten App gibt es weder
   Adressleiste noch Neuladen-Knopf des Browsers.

   Es reicht NICHT, einfach `location.reload()` zu rufen: der Service Worker
   liefert seit v27 zwar Netz zuerst, aber der HTTP-Cache des Browsers ist eine
   zweite, stillere Ebene darunter. Genau daran ist beim Prüfen zweimal ein
   scheinbar alter Stand entstanden, obwohl der Server längst das Neue auslieferte.
   Deshalb wird jede eingebundene Datei einzeln mit `cache:'reload'` geholt —
   das entwertet ihren HTTP-Cache-Eintrag — und danach neu geladen. */
document.getElementById('btnAktualisieren').addEventListener('click', async ()=>{
  const knopf = document.getElementById('btnAktualisieren');
  knopf.disabled = true;
  knopf.textContent = 'lädt …';
  try {
    const dateien = [...document.querySelectorAll('script[src]')]
      .map(s => s.getAttribute('src'))
      .filter(s => s && !/^https?:/.test(s))
      .concat(['index.html', 'manifest.json']);
    /* Einzeln und mit abgefangenem Fehler: eine Datei, die gerade nicht
       erreichbar ist, darf das Aktualisieren nicht verhindern.
       ⛔ Gemeldet wird sie trotzdem. Genau hier entsteht sonst der Fall, an
       dem Elias am 18.08.2026 stundenlang Fehler gemeldet hat, die laengst
       behoben waren: der Knopf sagt „fertig", eine Datei blieb aber alt, und
       niemand erfaehrt welche. [[alte_fassung_beim_nutzer]] */
    for (const d of dateien){
      try { await fetch(d, { cache: 'reload' }); }
      catch(e){ stillerFehler('Aktualisieren: ' + d, e); }
    }
    /* Den Service-Worker-Cache mitnehmen, sonst liefert er beim nächsten
       Offline-Start weiter den alten Stand. */
    if ('caches' in window){
      const namen = await caches.keys();
      await Promise.all(namen.map(n => caches.delete(n)));
    }
  } catch (e) {
    console.warn('Aktualisieren nur teilweise möglich:', e);
  }
  location.reload();
});

/* ---------- Automatische Sicherung ----------
   Elias am 29.07.2026: "Außerdem sollte die Fortschrittssicherung automatisch
   immer passieren."

   Was hier automatisch geht und was nicht, ist wichtig zu trennen:
   Eine DATEI kann die App nicht von sich aus schreiben — jeder Download braucht
   eine Nutzergeste, sonst blockt der Browser. Automatisch geht deshalb eine
   Sicherung IM GERÄT: derselbe Datenstand, unter einem eigenen Schlüssel im
   IndexedDB, unabhängig von den laufenden localStorage-Einträgen.

   Was das rettet und was nicht — ehrlich, damit niemand sich in falscher
   Sicherheit wiegt:
     ✓ versehentliches „Fortschritt zurücksetzen"
     ✓ ein kaputtgeschriebener localStorage-Eintrag
     ✗ geleerte Browserdaten, neues Handy, anderer Browser
   Für den zweiten Fall braucht es weiterhin die Datei — deshalb bleibt der
   Knopf „Fortschritt sichern" stehen und die Notiz darunter sagt es. */
const AUTO_SICHERUNG_KEY = 'auto-sicherung';

async function sichereAutomatisch(grund){
  try {
    const db = await paketDbOeffnen();
    await new Promise((fertig, fehler)=>{
      const t = db.transaction(PAKET_STORE, 'readwrite');
      t.objectStore(PAKET_STORE).put(
        Object.assign(baueSicherung(), { grund, automatisch: true }), AUTO_SICHERUNG_KEY);
      t.oncomplete = ()=>{ fertig(); db.close(); };
      t.onerror    = ()=>{ fehler(t.error); db.close(); };
    });
  } catch (e) {
    /* Bewusst still: eine fehlgeschlagene Hintergrundsicherung darf den
       Lernfluss nicht mit einer Meldung unterbrechen. Sie steht in der Konsole,
       falls jemand nachsieht. */
    console.warn('Automatische Sicherung nicht möglich:', e);
  }
}

/* `visibilitychange` statt `beforeunload`: Auf Android wird eine App oft gar
   nicht "verlassen", sondern nur weggewischt — `beforeunload` feuert dann
   nicht. `hidden` ist das einzige Ereignis, auf das bei mobilen Browsern
   Verlass ist. Zusätzlich beim Rundenende, weil dort der meiste Fortschritt
   auf einmal entsteht. */
document.addEventListener('visibilitychange', ()=>{
  if (document.visibilityState === 'hidden') sichereAutomatisch('App in den Hintergrund');
});
window.addEventListener('pagehide', ()=>sichereAutomatisch('Seite verlassen'));


/* ---------- Vokabelpaket ----------
   Holt alle acht Lehrwerke auf dieses Geraet, ohne dass arabicroots'
   Datenbankarbeit im oeffentlichen Repo stehen muss. Die Datei baut Elias
   lokal mit `node werkzeuge/baue-vokabelpaket.mjs`; Hintergrund und
   Speicherweg stehen in js/vokabelpaket.js.

   Anders als "Sicherung einlesen" wird hier NICHTS ersetzt: das Paket bringt
   nur Vokabeln mit, Boxen und Eselsbruecken bleiben unberuehrt. Deshalb auch
   keine Rueckfrage und kein Neustart. */
function zeigePaketStand(){
  const ziel = document.getElementById('paketStand');
  if (!ziel) return;
  if (typeof PAKET_STAND !== 'undefined' && PAKET_STAND){
    const wann = PAKET_STAND.erzeugt ? PAKET_STAND.erzeugt.slice(0,10) : 'unbekannt';
    ziel.textContent = `${PAKET_STAND.buecher} Bücher, ${PAKET_STAND.vokabeln} Vokabeln — Stand ${wann}`;
  } else {
    ziel.textContent = 'Alle acht Lehrwerke auf dieses Gerät holen';
  }
}

document.getElementById('btnPaketLaden').addEventListener('click', ()=>{
  document.getElementById('paketDatei').click();
});

document.getElementById('paketDatei').addEventListener('change', async (e)=>{
  const datei = e.target.files && e.target.files[0];
  e.target.value = '';                        // damit dieselbe Datei erneut geht
  if (!datei) return;
  try {
    toast('Lese Vokabelpaket …');
    const paket = await paketEinlesen(datei);
    await paketUebernehmen(paket);
    zeigePaketStand();
    if (typeof renderChapterFilterChips === 'function') renderChapterFilterChips();
    if (typeof renderHome === 'function') renderHome();
    toast(`${PAKET_STAND.buecher} Bücher, ${PAKET_STAND.vokabeln} Vokabeln eingelesen.`);
  } catch (err){
    toast(err.message || 'Das Vokabelpaket liess sich nicht einlesen.');
  }
});

/* Beim Start anzeigen, was auf diesem Geraet liegt - erst wenn das Paket
   wirklich gelesen ist, sonst stuende dort immer der Leertext. */
if (typeof PAKET_BEREIT !== 'undefined') PAKET_BEREIT.then(zeigePaketStand);

/* ---------- Akzentfarbe waehlen (20.08.2026) ----------
   Elias hat aus acht Vorschlaegen fuenf behalten. Die Kacheln stehen in
   index.html; hier haengt nur die Bedienung dran.

   ⭐ Kein Neuaufbau der Oberflaeche: die Farbe wirkt ueber CSS-Variablen am
   <html>, also aendert sich alles gleichzeitig und ohne dass eine laufende
   Uebung ihren Stand verliert. Dasselbe Prinzip wie bei der Wurzelfaerbung. */
function zeichneFarbwahl(){
  const kasten = document.getElementById('farbwahl');
  if (!kasten) return;
  const jetzt = SETTINGS.akzentFarbe || '#ff1744';
  kasten.querySelectorAll('.farbe').forEach(b =>
    b.setAttribute('aria-checked', b.dataset.hex === jetzt ? 'true' : 'false'));
}

(function(){
  const kasten = document.getElementById('farbwahl');
  if (!kasten) return;
  kasten.addEventListener('click', (e) => {
    const b = e.target.closest('.farbe');
    if (!b) return;
    const hex = b.dataset.hex;
    if (!hex || hex === (SETTINGS.akzentFarbe || '#ff1744')) return;
    SETTINGS.akzentFarbe = wendeAkzentfarbeAn(hex);
    saveSettings();
    zeichneFarbwahl();
    const name = (b.querySelector('.farbe-name') || {}).textContent || hex;
    toast('Akzentfarbe: ' + name);
  });
})();
