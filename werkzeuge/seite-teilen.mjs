/* seite-teilen.mjs — macht aus einer großen erzeugten Seite eine kleine Seite
 * und eine Inhaltsdatei.
 * ==========================================================================
 *
 * Kein eigener Aufruf: regelkategorien-seite.mjs und regelpruefung-seite.mjs
 * rufen schreibeNetzfassung() am Ende ihres Baus.
 *
 * WOZU (11.10.2026)
 *
 * Die zwei großen Regelseiten sind 255 und 284 KB groß. Vor dem
 * Neuveröffentlichen muss eine Sitzung die Fassung im Netz GANZ lesen — bei
 * vokalisiertem Arabisch rund ein Token je Byte, also über 200.000 Token je
 * Seite. Am 11.10.2026 standen beide deshalb drei und fünf Wochen alt im Netz,
 * mit 103 statt 115 Regeln. Kosten sind kein Grund, eine Seite alt zu lassen,
 * sondern ein Grund, den Ablauf billiger zu machen. [[alte_fassung_beim_nutzer]]
 *
 * WAS ES TUT
 *
 * Die Seite bleibt, wie ihr Erzeuger sie baut (artefakte/<name>.html — daran
 * hängen die Prüfer). Zusätzlich entsteht artefakte/netz/<name>/ mit
 *
 *   index.html         Kopf, Stil und Rahmen der Seite (klein)
 *   inhalt-<hash>.js   alle Abschnitte mit den Regeln UND das Skript der Seite
 *
 * Veröffentlicht wird diese Netzfassung. Im Browser setzt inhalt-<hash>.js
 * zuerst die Abschnitte an ihre Stelle und läuft dann wie vorher das Skript.
 * Danach ist die Seite Zeichen für Zeichen dieselbe wie die ungeteilte.
 *
 * ⛔ DREI DINGE, DIE SO BLEIBEN MÜSSEN
 *
 *  1. Adresse und Speicherschlüssel der Seite: darin liegen seine Antworten.
 *     Elias, 18.08.2026: „jedoch habe ich da schon ein paar antworten gegeben,
 *     die sollen nicht verschwinden das ist das aller wichtigste." Dieses
 *     Werkzeug ändert am Skript kein Zeichen, es verschiebt es nur.
 *  2. Das Skript steht in DERSELBEN Datei wie der Inhalt. Lädt die Datei
 *     nicht, läuft auch kein Skript — es kann also nie gegen eine leere Seite
 *     zählen oder speichern. Stehen bleibt dann die Zeile „Die Regeln werden
 *     geladen …", die sonst sofort ersetzt wird. [[ausfall_ist_unsichtbar_gebaut]]
 *  3. Der Dateiname trägt den Fingerabdruck des Inhalts. Eine neue Fassung hat
 *     einen neuen Namen — kein Browser kann eine alte Inhaltsdatei zu einer
 *     neuen Seite ausliefern.
 *
 * ⛔ teileSeite() setzt die zwei Teile selbst wieder zusammen und wirft, wenn
 * das Ergebnis nicht Zeichen für Zeichen die Ausgangsseite ist. Dasselbe prüft
 * werkzeuge/pruefe-netzfassung.mjs an den Dateien auf der Platte.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';

/* Was er sieht, solange (oder falls) die Inhaltsdatei nicht da ist. Eigener
   Stil in der Zeile, weil die zwei Seiten keine gemeinsame Klasse haben. */
export const PLATZHALTER = '<div id="regelinhalt" style="color:#8b95a3;font-size:14px;margin:18px 0">'
  + 'Die Regeln werden geladen. Bleibt diese Zeile stehen, lade die Seite bitte neu.</div>';

const KOPF = '(function(){var p=document.getElementById("regelinhalt");p.insertAdjacentHTML("beforebegin",';
const FUSS = ');p.parentNode.removeChild(p);})();';
const AUF = '<script>', ZU = '</script>', ABSCHNITT_ZU = '</section>';
const NAME_MUSTER = /^inhalt-[0-9a-f]{10}\.js$/;

const zaehle = (text, stueck) => text.split(stueck).length - 1;

/* JSON ist gültiges JavaScript; die zwei Zeilentrenner U+2028 und U+2029
   werden trotzdem ausgeschrieben, damit die erste Zeile der Datei sicher EINE
   Zeile bleibt. */
function alsJsText(text){
  return JSON.stringify(text)
    .split(String.fromCharCode(0x2028)).join('\\u2028')
    .split(String.fromCharCode(0x2029)).join('\\u2029');
}

export function fingerabdruck(text){
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex').slice(0, 10);
}

/* Aus der ganzen Seite: { seite, datei, name }. */
export function teileSeite(html){
  if (zaehle(html, '<script') !== 1 || zaehle(html, ZU) !== 1)
    throw new Error('seite-teilen: erwartet genau EINEN Skriptblock, gefunden '
      + zaehle(html, '<script') + ' öffnende und ' + zaehle(html, ZU) + ' schließende.');
  if (html.includes('id="regelinhalt"'))
    throw new Error('seite-teilen: die Seite benutzt die Kennung „regelinhalt" schon selbst.');
  const c = html.indexOf(AUF), d = html.indexOf(ZU);
  if (c < 0 || d < c) throw new Error('seite-teilen: der Skriptblock beginnt nicht mit <script> ohne Zusätze.');
  const nachStil = Math.max(0, html.indexOf('</style>'));
  const a = html.indexOf('<section', nachStil);
  const letzter = html.lastIndexOf(ABSCHNITT_ZU, c);
  if (a < 0 || letzter < a) throw new Error('seite-teilen: keine Abschnitte (<section>) vor dem Skript gefunden.');
  const b = letzter + ABSCHNITT_ZU.length;

  const inhalt = html.slice(a, b);
  const skript = html.slice(c + AUF.length, d);
  const datei = KOPF + alsJsText(inhalt) + FUSS + '\n' + skript;
  const name = 'inhalt-' + fingerabdruck(datei) + '.js';
  const seite = html.slice(0, a) + PLATZHALTER + html.slice(b, c)
    + '<script src="' + name + '"></script>' + html.slice(d + ZU.length);

  new vm.Script(datei, { filename: name });          /* wirft bei einem Syntaxfehler */
  if (setzeZusammen(seite, datei, name) !== html)
    throw new Error('seite-teilen: wieder zusammengesetzt ist die Seite NICHT dieselbe — nichts geschrieben.');
  return { seite, datei, name };
}

/* Die Gegenrichtung: aus kleiner Seite und Inhaltsdatei wieder die ganze Seite. */
export function setzeZusammen(seite, datei, name){
  const z = datei.indexOf('\n');
  const erste = z < 0 ? datei : datei.slice(0, z);
  if (!erste.startsWith(KOPF) || !erste.endsWith(FUSS))
    throw new Error('seite-teilen: die Inhaltsdatei beginnt nicht mit dem Einsetzer.');
  const inhalt = JSON.parse(erste.slice(KOPF.length, erste.length - FUSS.length));
  const skript = z < 0 ? '' : datei.slice(z + 1);
  const marke = '<script src="' + name + '"></script>';
  const p = seite.indexOf(PLATZHALTER), s = seite.indexOf(marke);
  if (p < 0) throw new Error('seite-teilen: in der kleinen Seite fehlt die Zeile „Die Regeln werden geladen".');
  if (s < p) throw new Error('seite-teilen: die kleine Seite lädt die Datei ' + name + ' nicht.');
  return seite.slice(0, p) + inhalt + seite.slice(p + PLATZHALTER.length, s)
    + AUF + skript + ZU + seite.slice(s + marke.length);
}

function schreibe(datei, text){
  fs.writeFileSync(datei + '.neu', text, 'utf8');
  fs.renameSync(datei + '.neu', datei);
}

/* Schreibt die Netzfassung nach <ordner> und räumt ältere Inhaltsdateien dort
   weg — der Ordner zeigt immer genau das, was im Netz stehen soll. */
export function schreibeNetzfassung(html, ordner){
  const { seite, datei, name } = teileSeite(html);
  fs.mkdirSync(ordner, { recursive: true });
  for (const f of fs.readdirSync(ordner))
    if (NAME_MUSTER.test(f) && f !== name) fs.unlinkSync(path.join(ordner, f));
  schreibe(path.join(ordner, name), datei);
  schreibe(path.join(ordner, 'index.html'), seite);
  return { name, ordner, seiteBytes: Buffer.byteLength(seite, 'utf8'), dateiBytes: Buffer.byteLength(datei, 'utf8') };
}

/* Die Zeilen, die ein Erzeuger am Ende ausgibt: wie die Netzfassung ins Netz kommt. */
export function hinweisVeroeffentlichen(netz, kurz, adresse){
  const kb = n => Math.round(n / 1024) + ' KB';
  return [
    '  Netzfassung: artefakte/netz/' + kurz + '/index.html (' + kb(netz.seiteBytes) + ') + ' + netz.name + ' (' + kb(netz.dateiBytes) + ')',
    '  ⚠️ Veröffentlichen kann die Routine nicht selbst — das braucht eine Sitzung. Und zwar die NETZFASSUNG,',
    '     nicht die große Datei (die müsste die Sitzung vorher ganz lesen, über 200.000 Token):',
    '       1. Artifact read   url ' + adresse + '   (die kleine Seite kommt ganz)',
    '       2. Artifact list   scope "files", dieselbe url   (zeigt die Inhaltsdatei, die im Netz liegt)',
    '       3. Artifact publish   url wie oben · file_path artefakte/netz/' + kurz + '/index.html',
    '            files { "' + netz.name + '": "artefakte/netz/' + kurz + '/' + netz.name + '",',
    '                    "<die ältere inhalt-….js aus Schritt 2, wenn sie anders heißt>": null }',
  ];
}

export { NAME_MUSTER };
