/* pruefe-loeschen-buchkarte.mjs — jede Vokabelkarte lässt sich löschen, auch eine Buchkarte.
 *
 * Auftrag: Elias, 18.11.2026 (Sitzung „Russisch Vokabeltrainer App", weitergegeben):
 * „ich möchte die vokabelkarten auch löschen können anstatt nur bearbeiten. füge auch einen
 * löschen knopf hinzu" und auf die Frage nach der Arabisch-App: „Ja, Arabisch auch".
 *
 * L1  Die Wortkarte einer Buchkarte zeigt den Knopf „Löschen".
 * L2  Nach dem Löschen fehlt sie in VOCAB_DATA (eine Karte weniger).
 * L3  Nach dem Neuladen fehlt sie weiterhin (vt_geloescht wird beim Einhängen gelesen).
 * L4  Eine Mehrzahlkarte lässt sich nicht löschen.
 * Störtest (--stoer): ohne den Eintrag in vt_geloescht kommt die Karte zurück — L3 wird rot.
 * Exitcode 0 = grün, 1 = rot.
 */
import { oeffneApp } from './browser.mjs';

const stoer = process.argv.includes('--stoer');
const befunde = [];
const app = await oeffneApp();
try {
  const warteAufBuch = async () => {
    for (let i = 0; i < 100; i++) {
      const id = await app.rechne(`(VOCAB_DATA.find(w => /^\\d+$/.test(String(w.id)) && !w.istPlural) || {}).id || null`);
      if (id) return id;
      await new Promise(r => setTimeout(r, 200));
    }
    return null;
  };
  const id = await warteAufBuch();
  if (!id) throw new Error('Keine Buchkarte geladen');
  await new Promise(r => setTimeout(r, 1500));   /* Nachladen der übrigen Quellen abwarten */
  const vorher = await app.rechne(`VOCAB_DATA.length`);

  const knopf = await app.rechne(`(zeigeWortKarte(${JSON.stringify(id)}), !!document.querySelector('[data-wkloeschen]'))`);
  if (!knopf) befunde.push('L1: kein Löschen-Knopf auf der Buchkarte ' + id);

  const ok = await app.rechne(`loeschePersonalVocab(${JSON.stringify(id)})`);
  const nachher = await app.rechne(`VOCAB_DATA.length`);
  if (!ok || nachher !== vorher - 1) befunde.push(`L2: Löschen meldet ${ok}, ${vorher} → ${nachher}`);

  if (stoer) await app.rechne(`(LS.set('vt_geloescht', {}), true)`);
  await app.laden();
  await warteAufBuch();
  await new Promise(r => setTimeout(r, 1500));
  const wieder = await app.rechne(`VOCAB_DATA.some(w => String(w.id) === ${JSON.stringify(String(id))})`);
  const neuGeladen = await app.rechne(`VOCAB_DATA.length`);
  if (wieder) befunde.push('L3: nach dem Neuladen ist ' + id + ' wieder da');

  const pl = await app.rechne(`(() => { const p = VOCAB_DATA.find(w => w.istPlural); return p ? loeschePersonalVocab(p.id) : 'keine'; })()`);
  if (pl === true) befunde.push('L4: eine Mehrzahlkarte wurde gelöscht');

  if (app.fehler.length) befunde.push('Konsolenfehler: ' + app.fehler.slice(0, 3).join(' | '));
  console.log(`Buchkarte ${id}: Knopf ${knopf}, ${vorher} → ${nachher}, nach Neuladen ${neuGeladen}, wieder da: ${wieder}, Mehrzahl: ${pl}`);
} finally {
  await app.schliessen();
}
if (befunde.length) { console.log('ROT\n- ' + befunde.join('\n- ')); process.exitCode = 1; }
else console.log('GRÜN: Buchkarte gelöscht und bleibt nach dem Neuladen weg (L1–L4).');
