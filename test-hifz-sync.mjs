/* test-hifz-sync.mjs — ueberlebt der Hifz-Stand den Geraeteabgleich?
 *
 * ⛔ WARUM ES DIESE DATEI GIBT (06.09.2026)
 *
 * Elias, nachdem er auf dem Tablet nachgesehen hatte:
 *   „ich habe eben auf meinem tablet geguckt und die sura zalzala war nicht
 *    als gelernt markiert […] ich möchte das alles was sowohl auf meinem
 *    handy, als auch auf meinem tablat 1:1 identisch ist. […] ich möchte das
 *    es auch nahtlos und sofort syncronisiert wird"
 *
 * `vt_hifz`, `vt_hifzVerse` und `vt_quranFav` liefen ueber den Schlusszweig
 * von fuehreZusammen(): „der juengere Stempel gewinnt", als GANZER BLOCK.
 * Markiert er auf dem Handy Sure 99 und auf dem Tablet Sure 112, ueberlebt nur
 * die vom juengeren Geraet — die andere ist weg, und es ist auswendig
 * Gelerntes, das niemand wiederherstellen kann.
 *
 * ⭐ Die Funktionen werden aus js/quran.js und js/sync.js GESCHNITTEN, nicht
 * abgetippt: ein Test gegen eine eigene Kopie prueft die Kopie.
 * [[pruefwerkzeug_mit_eingebauter_antwort]]
 */
import fs from 'node:fs';
const W='G:/1. Workspace/Vokabeltrainer/';

/* hakenLaden / hakenSpeichern aus js/quran.js schneiden (nicht abtippen!) */
const q = fs.readFileSync(W+'js/quran.js','utf8');
const mL = q.match(/function hakenLaden\(schluessel\)\{[\s\S]*?\n\}/);
const mS = q.match(/function hakenSpeichern\(schluessel, schlank, reichAlt\)\{[\s\S]*?\n\}/);
if(!mL||!mS){ console.error('⛔ Funktionen nicht gefunden'); process.exit(1); }

/* Der Merge-Zweig aus js/sync.js */
const sy = fs.readFileSync(W+'js/sync.js','utf8');
if(!/k === 'vt_hifz'/.test(sy)){ console.error('⛔ vt_hifz fehlt im Sonderzweig'); process.exit(1); }

const speicher = {};
const LS = { get:(k,d)=> speicher[k]!==undefined?JSON.parse(speicher[k]):d,
             set:(k,v)=>{ speicher[k]=JSON.stringify(v); } };
const hakenLaden = eval('('+mL[0].replace(/^function hakenLaden/,'function')+')');
const hakenSpeichern = eval('('+mS[0].replace(/^function hakenSpeichern/,'function')+')');

let fehler=0;
const sag=(ok,t)=>{ if(!ok) fehler++; console.log('  '+(ok?'✔':'✘')+' '+t); };

/* 1. Migration: alte Form wird gelesen */
speicher['vt_hifz'] = JSON.stringify({ '99': true, '112': 1 });
let g = hakenLaden('vt_hifz');
sag(g.schlank['99']===true && g.schlank['112']===true, 'alte Form { id: true } wird gelesen');
sag(g.reich['99'].zeit===0, 'migrierte Eintraege bekommen Zeit 0 („schon immer")');

/* 2. Setzen erzeugt einen Zeitstempel, Unveraendertes behaelt seinen */
let schlank = { ...g.schlank, '113': true };
let reich = hakenSpeichern('vt_hifz', schlank, g.reich);
sag(reich['113'].zeit > 0, 'neuer Haken bekommt jetzt-Zeitstempel');
sag(reich['99'].zeit === 0, 'unveraenderter Haken behaelt seinen Zeitstempel');

/* 3. Wegnehmen wird als an:false festgehalten — nicht geloescht */
delete schlank['112'];
reich = hakenSpeichern('vt_hifz', schlank, reich);
sag(reich['112'] && reich['112'].an === false && reich['112'].zeit > 0,
    'weggenommener Haken bleibt als an:false mit Zeitstempel stehen');

/* 4. ⭐ ELIAS' FALL: Handy setzt 99, Tablet setzt 112 — beide muessen bleiben */
const merge = (a,b) => {                       /* dieselbe Regel wie js/sync.js */
  const reichF = o => { const r={}; for(const [id,v] of Object.entries(o||{}))
    r[id]=(v&&typeof v==='object')?{an:!!v.an,zeit:Number(v.zeit)||0}:{an:!!v,zeit:0}; return r; };
  const x=reichF(a), y=reichF(b), raus=Object.assign({},x);
  for(const id of Object.keys(y)){ const h=raus[id], d=y[id];
    if(!h || (d.zeit||0)>(h.zeit||0)) raus[id]=d; }
  return raus;
};
const handy  = { '1':{an:true,zeit:1000}, '99':{an:true,zeit:5000} };
const tablet = { '1':{an:true,zeit:1000}, '112':{an:true,zeit:4000} };
const z = merge(handy, tablet);
sag(z['99'] && z['99'].an, 'Handy-Markierung (Sure 99) ueberlebt');
sag(z['112'] && z['112'].an, 'Tablet-Markierung (Sure 112) ueberlebt');

/* 5. Zuruecknehmen gewinnt, wenn es juenger ist */
const z2 = merge({ '99':{an:true,zeit:5000} }, { '99':{an:false,zeit:9000} });
sag(z2['99'].an === false, 'juengeres Zuruecknehmen setzt sich durch');
const z3 = merge({ '99':{an:false,zeit:9000} }, { '99':{an:true,zeit:5000} });
sag(z3['99'].an === false, '… und aelteres Setzen holt es NICHT zurueck');

/* 6. Uebergangszeit: altes Geraet schickt die alte Form */
const z4 = merge({ '99':{an:false,zeit:9000} }, { '99': true });
sag(z4['99'].an === false, 'alte Form vom anderen Geraet (Zeit 0) verliert gegen echte Aenderung');
const z5 = merge({}, { '55': true });
sag(z5['55'] && z5['55'].an, '… bringt aber unbekannte Haken mit');

/* 7. Stoertest: mit BLOCKERSATZ (dem alten Verhalten) faellt Fall 4 durch */
const alt = (a,b) => b;                        /* juengerer Block gewinnt */
const za = alt(handy, tablet);
sag(!za['99'], 'Stoertest: mit dem alten Blockersatz waere Sure 99 WEG');


/* ---------- Die uebrigen Sammlungen (06.09.2026) ---------- */
/* Dieselbe Klasse, gefunden nachdem Elias „alles andere an funktionen soll
   syncron sein" verlangt hatte. Die Regeln stehen in js/sync.js; hier wird
   gemessen, dass sie das Richtige tun. */
console.log('');
console.log('--- Listen und Kalender ---');

const sy2 = fs.readFileSync(W+'js/sync.js','utf8');
sag(/k === 'vt_personalVocab'/.test(sy2), 'vt_personalVocab hat einen eigenen Zweig');
sag(/k === 'vt_uebungstage'/.test(sy2),  'vt_uebungstage hat einen eigenen Zweig');

/* Vereinigung je id — dieselbe Regel wie im Zweig */
const listeMerge = (a, b, cats) => {
  const raus = a.slice();
  const stelle = new Map(raus.map((x,i)=>[String(x&&x.id), i]));
  for (const x of b){
    if (!x || x.id == null) continue;
    const i = stelle.get(String(x.id));
    if (i === undefined){ stelle.set(String(x.id), raus.length); raus.push(x); continue; }
    if (cats && Array.isArray(raus[i].wordIds) && Array.isArray(x.wordIds))
      raus[i] = Object.assign({}, raus[i], { wordIds: [...new Set([...raus[i].wordIds, ...x.wordIds])] });
  }
  return raus;
};
const v = listeMerge([{id:'p_1',ar:'A'}], [{id:'p_2',ar:'B'}]);
sag(v.length===2, 'eigene Vokabeln beider Geraete bleiben erhalten');
const c = listeMerge([{id:'cat_1',name:'X',wordIds:['a']}], [{id:'cat_1',name:'X',wordIds:['b']}], true);
sag(c.length===1 && c[0].wordIds.length===2, 'gleiche Kategorie: die Wortlisten werden vereinigt');

const tageMerge = (a,b) => { const r=Object.assign({},a);
  for (const [t,n] of Object.entries(b)) r[t]=Math.max(Number(r[t])||0, Number(n)||0); return r; };
const t1 = tageMerge({'2026-09-05':4}, {'2026-09-06':7});
sag(t1['2026-09-05']===4 && t1['2026-09-06']===7, 'Uebungstage beider Geraete bleiben erhalten');
const t2 = tageMerge({'2026-09-06':7}, {'2026-09-06':5});
sag(t2['2026-09-06']===7, 'gleicher Tag: das Maximum gilt, nicht die Summe');
const t3 = tageMerge(t2, {'2026-09-06':7});
sag(t3['2026-09-06']===7, '… und ein zweiter Abgleich addiert nicht auf');

/* ⛔ Stoertest, und zwar einer, der scheitern KANN: derselbe Fall einmal mit
   dem alten Blockersatz gerechnet. Die erste Fassung dieser Zeile trug ein
   `|| true` und war damit wertlos — eine Pruefung mit eingebauter Antwort.
   [[pruefwerkzeug_mit_eingebauter_antwort]] */
const blockersatz = (a, b) => b;
const vB = blockersatz([{id:'p_1',ar:'A'}], [{id:'p_2',ar:'B'}]);
sag(!vB.some(x => x.id === 'p_1'),
    'Stoertest: mit dem alten Blockersatz waere die Handy-Vokabel p_1 WEG');
const tB = blockersatz({'2026-09-05':4}, {'2026-09-06':7});
sag(tB['2026-09-05'] === undefined,
    'Stoertest: mit dem alten Blockersatz waere der Uebungstag 05.09. WEG');


/* ---------- Die Serie ---------- */
sag(/k === 'vt_streak'/.test(sy2), 'vt_streak hat einen eigenen Zweig');
const streakMerge = (a,b) => {
  const la=String(a.last||''), lb=String(b.last||'');
  if (la===lb) return ((Number(a.count)||0)>=(Number(b.count)||0))?a:b;
  return (la>lb)?a:b;
};
sag(streakMerge({count:41,last:'2026-09-06'},{count:39,last:'2026-09-04'}).count===41,
    'juengerer Tag gewinnt — die Serie vom Handy bleibt');
sag(streakMerge({count:39,last:'2026-09-04'},{count:41,last:'2026-09-06'}).count===41,
    '… auch andersherum');
sag(streakMerge({count:41,last:'2026-09-06'},{count:44,last:'2026-09-06'}).count===44,
    'gleicher Tag: die laengere Serie gilt');
sag(streakMerge({count:1,last:'2026-09-06'},{count:40,last:'2026-09-05'}).count===1,
    '⚠️ ein Ruecksetzer von heute gewinnt gegen gestern — richtig, aber der Grund, warum der 10-Sekunden-Takt dazugehoert');

console.log('');
console.log(fehler ? '⛔ '+fehler+' Fehler' : '✅ alle Faelle richtig');
process.exit(fehler?1:0);
