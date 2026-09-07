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
       erreichbar ist, darf das Aktualisieren nicht verhindern. */
    for (const d of dateien){ try { await fetch(d, { cache: 'reload' }); } catch(_){} }
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
