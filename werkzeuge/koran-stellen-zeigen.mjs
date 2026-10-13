/* koran-stellen-zeigen.mjs — zeigt Verse oder Dua-Texte Wort für Wort mit Nummern.
   Aufruf: node werkzeuge/koran-stellen-zeigen.mjs 112:1 2:255 D1.1 67:9@1-6 …
   "@a-b" begrenzt die Ausgabe auf die Wörter a bis b. Sagt dazu, ob die Stelle in seinem Bereich liegt. */
import { stelle, bereich, kannStelle } from './koran-stellen-lib.mjs';
const A = bereich();
for (const arg of process.argv.slice(2)){
  const [wo, grenze] = arg.split('@');
  try {
    const st = stelle(wo);
    let von = 1, bis = st.w.length;
    if (grenze){ const m = /^(\d+)-(\d+)$/.exec(grenze); if (m){ von = Number(m[1]); bis = Math.min(st.w.length, Number(m[2])); } }
    const teile = []; for (let i = von; i <= bis; i++) teile.push(i + ':' + st.w[i - 1]);
    const drin = st.art === 'vers' ? (kannStelle(A, st.sure, st.vers) ? 'im Bereich' : '⛔ NICHT im Bereich') : (st.dua.alsAnker ? 'Dua als Anker' : '⛔ Dua NICHT als Anker');
    console.log(wo + ' (' + st.w.length + ' W., ' + drin + ')  ' + teile.join('  ') + '   — ' + String(st.de).replace(/\s+/g, ' ').slice(0, 110));
  } catch (e){ console.log(arg + ': ' + e.message); }
}
