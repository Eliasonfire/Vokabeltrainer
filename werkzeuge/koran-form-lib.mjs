/* koran-form-lib.mjs — steht in einem Verswort GENAU die Form einer Karte? (24.10.2026)
 *
 * Für die Koransätze von „Koran häufigste". Elias, 23.10.2026, 23:25: „für die koranwörter von den
 * häufigsten gibt es keinen beispielsatz, da kannst du ruhig aus dem koran die nehmen vorallem wenn ich
 * sie bereits kenne".
 *
 * wortPasst() in koran-haeufig-bauen.mjs vergleicht nur Buchstaben, bei einem Verb sogar nur die Wurzel in
 * ihrer Reihenfolge. Das reicht, um eine falsch gezählte Wortnummer an einer Stelle zu fangen, die vorher
 * am Wort gelesen wurde. Zum SUCHEN im ganzen Koran reicht es nicht: min und man, ʿalima und ʿilm haben
 * dieselben Buchstaben. Hier zählen deshalb auch die Vokale. MEINE Bauart.
 *
 * Verglichen wird Einheit für Einheit (ein Buchstabe mit seinen Zeichen):
 *   - die Buchstaben müssen gleich sein — jedes Hamza gleich, alif maqṣūra wie yāʾ, tāʾ marbūṭa wie tāʾ,
 *     das Verbindungs-Alif als Alif;
 *   - ein kurzer Vokal, ein Tanwīn oder ein Sukūn muss gleich sein, wo BEIDE Seiten eines tragen (die
 *     Koranschrift lässt den Sukūn vor einer Angleichung weg — fehlt ein Zeichen, gilt es als offen);
 *   - eine Shadda muss auf beiden Seiten stehen oder auf keiner, außer am ersten Buchstaben (Artikel vor
 *     einem Sonnenbuchstaben, Angleichung an das Wort davor);
 *   - bei Nomen und Adjektiven zählt der letzte Buchstabe ohne Vokal (die Fallendung).
 * Am Verswort dürfen vorn wa, fa, bi, li, la, ka stehen (bei einem Verb auch sa), dazu der Artikel, hinten
 * ein Besitz- oder Objektsuffix. Was die Koranschrift anders schreibt als die Karte, gilt in beiden
 * Lesarten: das Dolch-Alif als Alif oder als nichts, Wāw und Yāʾ mit Dolch-Alif als Alif (ṣalāh), das
 * Trägeralif des Tanwīn Fatḥ am Wortende, das Madda-Zeichen über Alif als langes ā oder als Hamza mit ā.
 *
 * Was es NICHT kann: zwei Wörter trennen, die gleiche Buchstaben UND gleiche Vokale haben (al-malaka „den
 * Engel" gegen malaka „besaß"). Deshalb wird jede gewählte Stelle am Wort gelesen
 * (werkzeuge/koran-stellen-zeigen.mjs), bevor sie in die Vorlage kommt.
 *
 * Kein arabisches Zeichen ist getippt: alles über Codepunkte. */
const HAMZA = 0x621, ALIF = 0x627, TA_M = 0x629, TA = 0x62A, LAM = 0x644, WAW = 0x648, ALIF_M = 0x649, YA = 0x64A;
const TATWEEL = 0x640, WASLA = 0x671;
const FATHA = 0x64E, DAMMA = 0x64F, KASRA = 0x650, SHADDA = 0x651, SUKUN = 0x652;
const AN = 0x64B, UN = 0x64C, IN = 0x64D, MADDA = 0x653, HAMZA_O = 0x654, HAMZA_U = 0x655, DOLCH = 0x670;
const VOKAL = new Map([[FATHA, 'a'], [DAMMA, 'u'], [KASRA, 'i'], [AN, 'A'], [UN, 'U'], [IN, 'I'], [SUKUN, '0']]);
const SITZ = new Set([ALIF, WAW, YA, ALIF_M, TATWEEL]);
const istBuchstabe = c => (c >= 0x621 && c <= 0x63A) || (c >= 0x641 && c <= 0x64A) || c === WASLA || c === TATWEEL;
/* So wird ein Buchstabe verglichen: ى wie ي, ة wie ت. */
const vergleichsBuchstabe = b => b === ALIF_M ? YA : b === TA_M ? TA : b;

/** Ein Wort als Einheiten { b, v, s }: b = Buchstabe (Codepunkt), v = '' | a u i | A U I (Tanwīn) | 0 (Sukūn),
    s = Shadda. Dazu die Merker d (Dolch-Alif) und m (Madda über Alif) für die Lesarten. */
function einheitenRoh(wort){
  const out = [];
  for (const ch of String(wort).normalize('NFD')){
    const c = ch.codePointAt(0);
    if (istBuchstabe(c)){ out.push({ b: c, v: '', s: false, d: false, m: false, h: false }); continue; }
    const e = out[out.length - 1];
    if (!e) continue;
    if (VOKAL.has(c)) e.v = VOKAL.get(c);
    else if (c === SHADDA) e.s = true;
    else if (c === DOLCH) e.d = true;
    else if (c === MADDA) e.m = true;
    else if (c === HAMZA_O || c === HAMZA_U) e.h = true;
    /* alle übrigen Zeichen (Pausen, kleines Wāw/Yāʾ, kleines Mīm …) tragen keine Form */
  }
  const r = [];
  for (const e of out){
    if (e.h && SITZ.has(e.b)){ e.b = HAMZA; e.h = false; }
    if (e.b === TATWEEL){
      /* Ein Tatwīl ohne Hamza ist nur ein Strich: sein Dolch-Alif gehört zum Buchstaben davor. */
      if (e.d && r.length) r[r.length - 1].d = true;
      continue;
    }
    if (e.b === WASLA) e.b = ALIF;
    r.push(e);
  }
  return r;
}

/* Alle Lesarten eines Wortes (höchstens 32), je { e: Einheiten, unsicher }.
   ⛔ Ein Dolch-Alif „als nichts" zu lesen braucht man für die Wörter, die auch die Karte ohne Alif schreibt
   (hādhā, dhālika, lākin, ilāh). Es ist aber gefährlich: aus māliki (1:4) würde malik „König", aus jannātin
   „Gärten" jannatun „Garten". Deshalb (gemessen am ersten Suchlauf, 24.10.2026: jannāt und āyāt kamen als
   Einzahl heraus): vor einem tāʾ am Wortende nie — das ist die Mehrzahl auf -āt —, und sonst trägt die Lesart
   den Merker `unsicher`, damit die Durchsicht genau hinsieht. Auf alif maqṣūra und Wāw/Yāʾ ist das
   Dolch-Alif nur die Schreibung des langen ā (ʿalā, mūsā) und nicht unsicher. */
function lesarten(einh){
  let varianten = [{ e: [], unsicher: false }];
  const n = einh.length;
  einh.forEach((e, i) => {
    const neu = [];
    const basis = { b: e.b, v: e.v, s: e.s };
    const vorTaEnde = i === n - 2 && (einh[n - 1].b === TA || einh[n - 1].b === TA_M);
    for (const v of varianten){
      const wege = [];
      if (e.d){
        if (e.b === ALIF_M){
          wege.push({ t: [basis], u: false });                                 /* ʿalā, mūsā */
          wege.push({ t: [{ b: ALIF, v: '', s: false }], u: false });          /* tawrāh */
        } else if ((e.b === WAW || e.b === YA) && !e.v){
          wege.push({ t: [{ b: ALIF, v: '', s: false }], u: false });          /* ṣalāh: das Wāw trägt nur das ā */
        } else {
          /* jeder andere Buchstabe, auch ein Wāw oder Yāʾ mit eigenem Vokal (āyāt: ya + ā) */
          wege.push({ t: [basis, { b: ALIF, v: '', s: false }], u: false });   /* Dolch-Alif als Alif */
          if (!vorTaEnde) wege.push({ t: [basis], u: true });                  /* Dolch-Alif als nichts */
        }
      } else if (e.m && e.b === ALIF){
        wege.push({ t: [{ b: ALIF, v: e.v, s: e.s }], u: false });             /* Madda als langes ā */
        wege.push({ t: [{ b: HAMZA, v: 'a', s: false }, { b: ALIF, v: '', s: false }], u: false });   /* ʾā */
      } else if (i === n - 1 && n > 1 && e.b === ALIF && !e.v && einh[i - 1].v === 'A'){
        wege.push({ t: [basis], u: false }); wege.push({ t: [], u: false });   /* Trägeralif des Tanwīn Fatḥ */
      } else wege.push({ t: [basis], u: false });
      for (const w of wege) if (neu.length < 32) neu.push({ e: v.e.concat(w.t), unsicher: v.unsicher || w.u });
    }
    varianten = neu;
  });
  return varianten;
}

const SUFFIXE = [[0x647, 0x645, 0x627], [0x643, 0x645, 0x627], [0x647, 0x645], [0x647, 0x646], [0x643, 0x645], [0x643, 0x646],
  [0x646, 0x627], [0x647, 0x627], [0x646, 0x64A], [0x647], [0x643], [0x64A]];     /* -humā -kumā -hum -hunna -kum -kunna -nā -hā -nī -hu -ka -ī */
const VORSILBEN = [[WAW, 'a'], [0x641, 'a'], [0x628, 'i'], [LAM, 'i'], [LAM, 'a'], [0x643, 'a']];   /* wa fa bi li la ka */
const SA = [0x633, 'a'];

/** Die Stämme eines Verswortes: ohne Vorsilben, Artikel, Suffix — jede Kombination, die das Wort hergibt.
    Jeder Stamm trägt `artikel` (true, wenn ein Artikel abgenommen wurde). */
export function verswortStaemme(wort, typ){
  const staemme = [];
  const vors = typ === 'verb' ? VORSILBEN.concat([SA]) : VORSILBEN;
  for (const { e: l, unsicher } of lesarten(einheitenRoh(wort))){
    const anfaenge = [{ e: l, vor: 0 }];
    for (let k = 0; k < anfaenge.length && k < 12; k++){
      const { e, vor } = anfaenge[k];
      if (vor >= 2 || e.length < 3) continue;
      for (const [b, v] of vors) if (e[0].b === b && e[0].v === v) anfaenge.push({ e: e.slice(1), vor: vor + 1 });
    }
    for (const { e, vor } of anfaenge){
      const mitArtikel = [{ e, artikel: false }];
      if (typ !== 'verb'){
        if (e.length > 3 && e[0].b === ALIF && e[1].b === LAM && !['a', 'u', 'i'].includes(e[1].v)) mitArtikel.push({ e: e.slice(2), artikel: true });
        /* nach li- oder la- fällt das Alif des Artikels weg: li-n-nās */
        if (vor > 0 && e.length > 2 && e[0].b === LAM && !['a', 'u', 'i'].includes(e[0].v)) mitArtikel.push({ e: e.slice(1), artikel: true });
      }
      for (const { e: s, artikel } of mitArtikel){
        staemme.push({ e: s, artikel, unsicher });
        for (const suf of SUFFIXE){
          if (s.length <= suf.length + 1) continue;
          const ende = s.slice(s.length - suf.length);
          if (ende.every((x, i) => vergleichsBuchstabe(x.b) === vergleichsBuchstabe(suf[i]))) staemme.push({ e: s.slice(0, s.length - suf.length), artikel, suffix: true, unsicher });
        }
      }
    }
  }
  return staemme;
}

/** Die Formen einer Karte: das Wort selbst, bei Nomen und Adjektiven auch ohne Artikel. */
export function kartenFormen(ar, typ){
  const formen = [];
  for (const { e: l, unsicher } of lesarten(einheitenRoh(ar))){
    formen.push({ e: l, artikel: false, unsicher });
    if (typ !== 'verb' && typ !== 'particle' && l.length > 3 && l[0].b === ALIF && l[1].b === LAM) formen.push({ e: l.slice(2), artikel: true, unsicher });
  }
  return formen;
}

export const skelett = e => e.map(x => String.fromCodePoint(vergleichsBuchstabe(x.b))).join('');

/** Gleich? `ohneEndung`: der letzte Buchstabe zählt ohne Vokal (Nomen, Adjektiv, Partikel; Präsens ohne
    Modus). `verb`: ein alif maqṣūra der Karte ist ein langes ā und kein ay — ātā „gab" ist nicht ātaynā
    „wir gaben" (beim ersten Suchlauf am 24.10.2026 so herausgekommen). Bei einer Partikel bleibt ʿalayhi
    das ʿalā der Karte. */
export function einheitenGleich(k, w, ohneEndung, verb){
  if (k.length !== w.length) return false;
  for (let i = 0; i < k.length; i++){
    if (vergleichsBuchstabe(k[i].b) !== vergleichsBuchstabe(w[i].b)) return false;
    if (i > 0 && k[i].s !== w[i].s) return false;
    if (verb && k[i].b === ALIF_M && w[i].v === '0') return false;
    if (ohneEndung && i === k.length - 1) continue;
    if (k[i].v && w[i].v && k[i].v !== w[i].v) return false;
  }
  return true;
}

/** Ohne Endung verglichen wird bei Nomen und Adjektiven (Fallendung) und bei Partikeln (Hilfsvokal:
    min wird vor dem Artikel zu mina). Ein Verb behält seine Endung: qāla ist nicht qulnā. */
export const ohneEndungFuer = typ => typ === 'noun' || typ === 'adjective' || typ === 'particle';

/** Steht im Verswort die Form `ar` (Wortart `typ`)? */
export function formImWort(ar, typ, verswort, opt = {}){
  const ohneEndung = opt.ohneEndung !== undefined ? opt.ohneEndung : ohneEndungFuer(typ);
  const formen = kartenFormen(ar, typ);
  const staemme = verswortStaemme(verswort, typ);
  for (const f of formen) for (const s of staemme)
    if (einheitenGleich(f.e, s.e, ohneEndung, typ === 'verb')) return true;
  return false;
}
