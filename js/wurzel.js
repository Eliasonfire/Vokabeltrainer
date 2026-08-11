/* wurzel.js -- Wurzelmodus: Wortfamilien üben
   Teil der App-Logik; wird in index.html in fester Reihenfolge geladen und
   teilt sich mit den uebrigen js/-Dateien den globalen Namensraum.

   ⭐ WARUM DAS EINE UEBUNG IST UND KEINE ANSICHT

   Der erste Entwurf war eine Ansicht: die Wortfamilie gestapelt, die Wurzel
   hervorgehoben. Elias hat ihn abgelehnt, und zwar mit dem Grund, der alles
   entscheidet: "bei der wurzelmodus da brauche ich noch irgendwie etwas
   interaktives sonst gucke ich mir das einfach nur an ... ich hab halt adhs
   und ich brauche so spiele artig mein lernen".

   Deshalb drei Schritte je Familie, in dieser Reihenfolge:

     1 Erinnern - abrufen, was schon da ist            (Auswendiglernen)
     2 Finden   - die Wurzel IM Wort antippen          (Fertigkeit, produktiv)
     3 Erraten  - ein neues Wort aus derselben Wurzel  (der Ertrag)

   Die gestapelte Familie kommt erst DANACH, als Abschluss. Drei Familien sind
   eine Sitzung - eine kurze Einheit mit sichtbarem Ende statt endlosem
   Blaettern. Dazu das Mini-Spiel: Woerter in Wurzel-Koerbe sortieren.

   Abgesegnet am 11.08.2026: "die wurzelübungen sind alle abgesegnet so wie sie
   jetzt sind." Uebernommen aus vorschau-wurzelmodus.html.

   ⛔ Der Wurzelmodus schreibt NICHTS in den Lernstand. Er hat keine eigene
   Leitner-Box und verschiebt keine Karten. Elias' Vorschlag einer zweiten Box
   ist bewusst nicht gebaut: gemessen haben 102 von 171 Woertern Verwandte, und
   automatisch aufgenommen waeren das +247 Woerter an einem Tag. */

/* ================= Buchstaben und Vokalzeichen ================= */

var WZ_HARAKA = /[ً-ْٰٓ-ٕ]/;

/* Grundform eines Buchstabens. Hamza-Traeger und schwache Buchstaben werden
   zusammengefasst, sonst faende man أ nicht ueber ا wieder. */
function wzGrundform(b){
  if ('أإآٱا'.indexOf(b) >= 0) return 'ا';
  if (b === 'ى') return 'ي';
  if (b === 'ؤ') return 'و';
  if (b === 'ئ') return 'ي';
  if (b === 'ة') return 'ه';
  return b;
}
/* Ein Wort in Buchstaben mit ihren Vokalzeichen zerlegen. Die Zeichen bleiben
   am Buchstaben haengen - beim Einfaerben duerfen sie nicht abreissen. */
function wzZerlege(wort){
  var t = [], i, z;
  for (i = 0; i < wort.length; i++){
    z = wort[i];
    if (WZ_HARAKA.test(z)){ if (t.length) t[t.length-1].d += z; }
    else t.push({ b: z, d: '' });
  }
  return t;
}
function wzEsc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function wzOhneZeichen(s){ return String(s).replace(/[ً-ْٰٓ-ٕ]/g,'').trim(); }
function wzVergleichsform(s){
  return String(s).replace(/[ً-ْٰٓ-ٕ]/g,'')
                  .replace(/[^ء-ي]/g,'').split('').map(wzGrundform).join('');
}

/* ⚠️ Lehnwoerter tragen im Abzug eine Wurzel, die reiner Zufall der Buchstaben
   ist: أَمْرِيكَا bekaeme أ م ر - davon kommt أَمَرَ "befehlen". Sie hier
   mitlaufen zu lassen hiesse, einen Zusammenhang zu behaupten, den es nicht
   gibt (E.1). Deshalb bewusst raus.
   ⚠️ Ob الْعِرَاقُ dazugehoert, ist umstritten und hier NICHT entschieden -
   das ist eine offene Frage an Elias, keine stille Entscheidung. */
var WZ_LEHNWORT = ['الفليبين','اليابان','الصين','الهند','امريكا',
                   'المانيا','انجلترا','سويسرا','اندونيسيا','انجليزية'].map(wzVergleichsform);

/* ================= Markieren =================
   Die Wurzelbuchstaben werden der Reihe nach in der vokalisierten Form
   gesucht. Geht das nicht auf - schwache Wurzel wie ب و ب in بَابٌ,
   verdoppelte wie أ م م in أُمٌّ -, wird BEWUSST nicht markiert statt geraten.
   Eine falsch gesetzte Markierung waere schlimmer als gar keine: sie brächte
   ihm einen falschen Zusammenhang bei. */
function wzMarkiere(wort, wurzel){
  if (!wort) return { html:'', ok:false };
  if (!wurzel || !String(wurzel).trim()) return { html: wzEsc(wort), ok:false, grund:'keine Wurzel' };
  if (WZ_LEHNWORT.indexOf(wzVergleichsform(wort)) >= 0)
    return { html: wzEsc(wort), ok:false, grund:'Lehnwort' };
  var teile = wzZerlege(wort);
  var wz = String(wurzel).trim().split(/\s+/);
  var wi = 0, idx = {}, i;
  for (i = 0; i < teile.length && wi < wz.length; i++)
    if (wzGrundform(teile[i].b) === wzGrundform(wz[wi])){ idx[i] = true; wi++; }
  if (wi < wz.length) return { html: wzEsc(wort), ok:false, grund:'Wurzel steckt nicht sichtbar im Wort' };

  var html = '', aktuell = null, puffer = '';
  function schliesse(){
    if (puffer === '') return;
    html += '<span class="' + (aktuell ? 'wz' : 'fm') + '">' + wzEsc(puffer) + '</span>';
    puffer = '';
  }
  for (i = 0; i < teile.length; i++){
    var ist = !!idx[i];
    if (aktuell === null) aktuell = ist;
    if (ist !== aktuell){ schliesse(); aktuell = ist; }
    puffer += teile[i].b + teile[i].d;
  }
  schliesse();
  return { html: html, ok:true };
}

/* Dieselbe Zuordnung, aber als Liste - fuer Schritt 2, wo einzelne Buchstaben
   antippbar sein muessen. */
function wzEinheiten(wort, wurzel){
  var teile = wzZerlege(String(wort));
  var wz = String(wurzel).trim().split(/\s+/);
  var wi = 0, istWz = [], i;
  for (i = 0; i < teile.length; i++) istWz.push(false);
  for (i = 0; i < teile.length && wi < wz.length; i++)
    if (wzGrundform(teile[i].b) === wzGrundform(wz[wi])){ istWz[i] = true; wi++; }
  return { teile: teile, istWz: istWz, ok: wi >= wz.length };
}

function wzMische(a){
  var b = a.slice(), i, j, t;
  for (i = b.length - 1; i > 0; i--){ j = Math.floor(Math.random()*(i+1)); t=b[i]; b[i]=b[j]; b[j]=t; }
  return b;
}

/* ================= Welche Woerter duerfen vorkommen? =================

   Elias' Vorgabe: "es sollten auch wirklich nur neue wörter dabei sein die sich
   mit meinem aktuellen wissenstand decken also stand jetzt bis kapitel 9".

   ⚠️ Gemessen war das Ergebnis unbrauchbar: auf genau diesem Stand gibt es
   NULL neue Woerter - seine Kartei enthaelt dort schon alles, was eine Wurzel
   hat. Eine still gesetzte Grenze haette also Schritt 3 dauerhaft
   verschwinden lassen, ohne dass irgendwo stuende warum. Deshalb ein
   Schalter mit drei Stufen und ein Hinweis, der die Zahl nennt. */
function wzNiveau(){ return SETTINGS.wurzelNiveau || 'stand'; }
function wzVorrat(){
  var n = wzNiveau();
  if (n === 'alles') return VOCAB_DATA;
  if (n === 'buch')  return (typeof buchVokabeln === 'function') ? buchVokabeln() : VOCAB_DATA;
  /* 'stand': was er nach den freigeschalteten Kapiteln kennen kann. */
  return (typeof bekannteVokabeln === 'function') ? bekannteVokabeln() : VOCAB_DATA;
}

/* ================= Familien bauen ================= */
var WZ_FAMILIEN = [];

function wzBaueFamilien(){
  var nachWurzel = {};
  var eigenIds = (typeof LERNBESTAND_IDS !== 'undefined') ? LERNBESTAND_IDS : null;
  /* ⚠️ Ein Set, kein indexOf. Der Vorrat kann alle 4433 Woerter des Abzugs
     umfassen; ein indexOf je Wort waere quadratisch und laege im zweistelligen
     Millionenbereich an Vergleichen - spuerbar auf dem Handy. */
  var vorrat = new Set(wzVorrat());
  /* Die eigenen Lernwoerter sind IMMER dabei - sie sind ja sein Stand.
     Gefiltert wird nur, was zusaetzlich aus den Buechern dazukaeme. */
  var liste = VOCAB_DATA.filter(function(w){
    return (eigenIds && eigenIds.has(w.id)) || vorrat.has(w);
  });

  liste.forEach(function(w){
    var r = w.root && String(w.root).trim();
    if (!r) return;
    if (WZ_LEHNWORT.indexOf(wzVergleichsform(w.ar)) >= 0) return;
    var k = wzOhneZeichen(w.ar);
    var f = nachWurzel[r] || (nachWurzel[r] = { wurzel:r, woerter:[], gesehen:{}, eigene:0 });
    if (f.gesehen[k]) return;
    f.gesehen[k] = true;
    var kennst = !!(eigenIds && eigenIds.has(w.id));
    if (kennst) f.eigene++;
    f.woerter.push({ ar:w.ar, de:w.de || '', kennst:kennst });
  });

  /* Nur Familien, in denen mindestens ein eigenes Wort steckt - sonst waere es
     kein Wiedererkennen, sondern eine Vokabelliste. */
  WZ_FAMILIEN = Object.keys(nachWurzel).map(function(r){ return nachWurzel[r]; })
    .filter(function(f){ return f.eigene > 0 && f.woerter.length >= 2; });

  WZ_FAMILIEN.forEach(function(f){
    /* Eigene zuerst - daran erklaert sich die Familie. Danach die neuen.
       Mehr als sieben Zeilen sind kein Stapel mehr, sondern eine Liste. */
    f.woerter.sort(function(a,b){ return (b.kennst?1:0) - (a.kennst?1:0); });
    if (f.woerter.length > 7) f.woerter = f.woerter.slice(0, 7);
  });
  WZ_FAMILIEN.sort(function(a,b){
    if (b.eigene !== a.eigene) return b.eigene - a.eigene;
    return b.woerter.length - a.woerter.length;
  });
}

/* ================= Die gestapelte Familie ================= */
function wzZeigeStapel(f){
  var stapel = document.getElementById('wzStapel');
  if (!stapel) return;
  stapel.innerHTML = f.woerter.map(function(x){
    var m = wzMarkiere(x.ar, f.wurzel);
    return '<div class="wz-zeile' + (x.kennst ? ' kennst' : '') + (m.ok ? '' : ' nichtok') + '">' +
           '<div class="wz-ar">' + (m.ok ? m.html : wzEsc(x.ar)) + '</div>' +
           '<div class="wz-de">' + wzEsc(x.de) + '</div>' +
           '<div class="wz-mrk">' + (x.kennst ? 'kennst du' : 'neu')
             + (m.ok ? '' : ' · Wurzel nicht sichtbar, deshalb unmarkiert') + '</div>' +
           '</div>';
  }).join('');
  wzAusrichten();
}

/* Die Wurzel in eine Spalte bringen.
   Gemessen wird die rechte Kante des ERSTEN Wurzel-Spans; im RTL-Satz ist das
   die Stelle, an der der erste Wurzelbuchstabe sitzt. Alle Zeilen werden so
   weit nach links geschoben, dass diese Kanten uebereinanderliegen.
   ⚠️ Eine transform, keine Aenderung am Textfluss - an der Verbindung der
   Buchstaben aendert sich dadurch nichts. */
function wzAusrichten(){
  var zeilen = [].slice.call(document.querySelectorAll('#wzStapel .wz-ar'));
  zeilen.forEach(function(z){ z.style.transform = 'none'; });
  if (SETTINGS.wurzelAusrichten === false || !zeilen.length) return;
  var messwerte = zeilen.map(function(z){
    var erst = z.querySelector('.wz');
    if (!erst) return null;
    return z.getBoundingClientRect().right - erst.getBoundingClientRect().right;
  });
  var max = 0;
  messwerte.forEach(function(v){ if (v !== null && v > max) max = v; });
  zeilen.forEach(function(z, i){
    var v = messwerte[i];
    if (v === null) return;                 /* unmarkierte Zeile bleibt stehen */
    z.style.transform = 'translateX(' + (-(max - v)).toFixed(2) + 'px)';
  });
}

/* ================= Die Uebung ================= */
var WZ_SITZUNG = { reihe: [], i: 0, richtig: 0, gesamt: 0 };
var WZ_S1_REST = [];
var WZ_S2_ZIEL = 0, WZ_S2_TREFFER = 0;

function wzSchrittZeigen(nr){
  ['wzSchritt1','wzSchritt2','wzSchritt3','wzSchrittFertig','wzSchluss']
    .forEach(function(id, k){
      var el = document.getElementById(id);
      if (el) el.hidden = (k !== nr);
    });
  var p = '', k;
  for (k = 0; k < 3; k++) p += '<i class="' + (k < nr ? 'an' : '') + '"></i>';
  var pk = document.getElementById('wzPunkte');
  if (pk) pk.innerHTML = nr < 3 ? p : '<i class="an"></i><i class="an"></i><i class="an"></i>';
}

/* Bevorzugt Familien, die alle drei Schritte hergeben. */
function wzTaugt(f){
  return f.woerter.some(function(x){ return x.kennst && wzMarkiere(x.ar, f.wurzel).ok; });
}
function wzStarteSitzung(){
  var gut = WZ_FAMILIEN.filter(wzTaugt);
  var mitNeu = gut.filter(function(f){ return f.woerter.some(function(x){ return !x.kennst; }); });
  var quelle = mitNeu.length >= 3 ? mitNeu : gut;
  /* Mindestens eine Familie, in der er schon ZWEI Woerter hat - mit einem
     einzigen ist Schritt 1 ("welche kennst du?") keine Uebung. Gemessen gibt es
     davon im Bestand nur neun, deshalb wird mit dem Rest aufgefuellt. */
  var stark = wzMische(quelle.filter(function(f){ return f.eigene >= 2; }));
  var rest  = wzMische(quelle.filter(function(f){ return f.eigene <  2; }));
  var reihe = wzMische(stark.slice(0, 2).concat(rest).slice(0, 3));
  WZ_SITZUNG.reihe = reihe.map(function(f){ return WZ_FAMILIEN.indexOf(f); });
  WZ_SITZUNG.i = 0; WZ_SITZUNG.richtig = 0; WZ_SITZUNG.gesamt = 0;
  wzStarteFamilie();
}
function wzFamilie(){ return WZ_FAMILIEN[WZ_SITZUNG.reihe[WZ_SITZUNG.i]]; }

function wzStarteFamilie(){
  var f = wzFamilie();
  if (!f){ wzSchluss(); return; }
  document.getElementById('wzFortschritt').textContent =
    'Familie ' + (WZ_SITZUNG.i + 1) + ' von ' + WZ_SITZUNG.reihe.length;
  document.getElementById('wzKopfWurzel').textContent = f.wurzel;
  document.getElementById('wzKopfZahl').textContent =
    f.eigene + ' kennst du · ' + (f.woerter.length - f.eigene) + ' neu';
  wzSchritt1();
}

/* --- 1 Erinnern --- */
function wzSchritt1(){
  var f = wzFamilie();
  WZ_S1_REST = f.woerter.filter(function(x){ return x.kennst; });
  document.getElementById('wzS1Liste').innerHTML = '';
  document.getElementById('wzS1Frage').innerHTML =
    'Du kennst <b>' + WZ_S1_REST.length + '</b> Wort' + (WZ_S1_REST.length === 1 ? '' : 'e')
    + ' aus dieser Wurzel.<br>Welche? Erst überlegen, dann aufdecken.';
  document.getElementById('wzS1Knopf').textContent = 'Aufdecken';
  wzSchrittZeigen(0);
}

/* --- 2 Finden --- */
function wzSchritt2(){
  var f = wzFamilie();
  /* Mehrwortige Eintraege ("قَلَمُ حِبْرٍ" = Fueller) taugen nicht als Aufgabe. */
  var alle = f.woerter.filter(function(x){
    return x.kennst && !/\s/.test(String(x.ar).trim()) && wzMarkiere(x.ar, f.wurzel).ok;
  });
  /* Bevorzugt ein Wort, das AUCH Formbuchstaben hat. Sonst lautet die Aufgabe
     "tippe alle drei an" und traegt nichts - gemessen bestehen 32 von 113
     Woertern restlos aus ihrer Wurzel. */
  var mitForm = alle.filter(function(x){
    return wzEinheiten(x.ar, f.wurzel).istWz.some(function(v){ return !v; });
  });
  var kandidaten = mitForm.length ? mitForm : alle;
  if (!kandidaten.length){ wzSchritt3(); return; }
  var x = wzMische(kandidaten)[0];
  var e = wzEinheiten(x.ar, f.wurzel);
  var nurWurzel = !e.istWz.some(function(v){ return !v; });
  WZ_S2_ZIEL = e.istWz.filter(Boolean).length;
  WZ_S2_TREFFER = 0;
  document.getElementById('wzS2Wort').innerHTML = e.teile.map(function(t, i){
    return '<span class="wz-ein" data-i="' + i + '" data-wz="' + (e.istWz[i] ? 1 : 0) + '">'
         + wzEsc(t.b + t.d) + '</span>';
  }).join('');
  document.getElementById('wzS2De').textContent = x.de;
  /* Der Sonderfall ist kein Fehler, sondern eine Lehre: manche Woerter SIND
     ihre Wurzel. Dann wird das auch so gesagt. */
  document.getElementById('wzS2Frage').innerHTML = nurWurzel
    ? 'Dieses Wort <b>ist</b> seine Wurzel — nichts kommt dazu.<br>Tippe die ' + WZ_S2_ZIEL + ' Buchstaben an.'
    : 'Tippe die <b>' + WZ_S2_ZIEL + '</b> Buchstaben an, die zur Wurzel gehören.';
  document.getElementById('wzS2Meldung').innerHTML = '&nbsp;';
  document.getElementById('wzS2Weiter').hidden = true;
  wzSchrittZeigen(1);
}

/* --- 3 Erraten --- */
function wzSchritt3(){
  var f = wzFamilie();
  var neu = f.woerter.filter(function(x){
    return !x.kennst && x.de && !/\s/.test(String(x.ar).trim());
  });
  if (!neu.length){ wzFertig(); return; }
  var x = wzMische(neu)[0];
  var m = wzMarkiere(x.ar, f.wurzel);
  document.getElementById('wzS3Wort').innerHTML = m.ok ? m.html : wzEsc(x.ar);

  /* Ablenker aus ANDEREN Wurzeln - aus derselben koennten sie zufaellig auch
     stimmen, und dann waere die Aufgabe unfair. */
  var fremd = [];
  WZ_FAMILIEN.forEach(function(g){
    if (g.wurzel === f.wurzel) return;
    g.woerter.forEach(function(y){ if (y.de && y.de !== x.de) fremd.push(y.de); });
  });
  var auswahl = wzMische([x.de].concat(wzMische(fremd).slice(0, 2)));
  var feld = document.getElementById('wzS3Auswahl');
  feld.innerHTML = auswahl.map(function(t){
    return '<button class="wz-wahl" data-de="' + wzEsc(t) + '">' + wzEsc(t) + '</button>';
  }).join('');
  feld.dataset.richtig = x.de;
  feld.dataset.fertig = '';
  document.getElementById('wzS3Meldung').innerHTML = '&nbsp;';
  document.getElementById('wzS3Weiter').hidden = true;
  wzSchrittZeigen(2);
}

function wzFertig(){
  wzZeigeStapel(wzFamilie());
  wzSchrittZeigen(3);
}
function wzNaechsteFamilie(){
  WZ_SITZUNG.i++;
  if (WZ_SITZUNG.i >= WZ_SITZUNG.reihe.length) wzSchluss(); else wzStarteFamilie();
}
function wzSchluss(){
  document.getElementById('wzSchlussZahl').innerHTML =
    '<b>' + WZ_SITZUNG.richtig + ' von ' + WZ_SITZUNG.gesamt + '</b> auf Anhieb richtig.<br>'
    + WZ_SITZUNG.reihe.length + ' Wurzelfamilien durchgearbeitet.';
  wzSchrittZeigen(4);
  document.getElementById('wzFortschritt').textContent = 'Sitzung beendet';
}

/* ================= Mini-Spiel =================
   Spielsteine muessen markierbar sein - eine schwache Wurzel waere nicht
   loesbar und damit unfair. Deshalb der Filter auf wzMarkiere().ok. */
var WZ_SPIEL = { stuecke:[], i:0, richtig:0, wurzeln:[], offen:true, erste:true };

function wzSpielbar(){
  return WZ_FAMILIEN.filter(function(f){
    return f.woerter.some(function(x){ return wzMarkiere(x.ar, f.wurzel).ok; });
  });
}
function wzNeueRunde(){
  var spielbar = wzSpielbar();
  /* Die allererste Runde nimmt die staerksten Familien und daraus die Woerter,
     die er schon kennt - WZ_FAMILIEN ist nach eigenen Woertern sortiert. Sonst
     startet das Spiel mit drei wildfremden Wurzeln und wirkt beliebig. */
  var erste = WZ_SPIEL.erste; WZ_SPIEL.erste = false;
  var pool = erste ? spielbar.slice(0, 3) : wzMische(spielbar).slice(0, 3);
  if (pool.length < 2){
    document.getElementById('wzSpielMeldung').textContent =
      'Zu wenig Material für eine Runde.';
    document.getElementById('wzKoerbe').innerHTML = '';
    document.getElementById('wzSpielAr').textContent = '—';
    return;
  }
  WZ_SPIEL.wurzeln = pool.map(function(f){ return f.wurzel; });
  var stuecke = [];
  pool.forEach(function(f){
    var loesbar = f.woerter.filter(function(x){ return wzMarkiere(x.ar, f.wurzel).ok; });
    var wahl = erste ? loesbar.slice(0, 2) : wzMische(loesbar).slice(0, 2);
    wahl.forEach(function(x){ stuecke.push({ ar:x.ar, de:x.de, wurzel:f.wurzel }); });
  });
  WZ_SPIEL.stuecke = wzMische(stuecke);
  WZ_SPIEL.i = 0; WZ_SPIEL.richtig = 0; WZ_SPIEL.offen = true;
  document.getElementById('wzKoerbe').innerHTML = WZ_SPIEL.wurzeln.map(function(r){
    return '<button class="wz-korb" data-wurzel="' + wzEsc(r) + '">' + wzEsc(r) + '</button>';
  }).join('');
  wzZeigeStueck();
}
function wzZeigeStueck(){
  var s = WZ_SPIEL.stuecke[WZ_SPIEL.i];
  var ar = document.getElementById('wzSpielAr');
  [].forEach.call(document.querySelectorAll('.wz-korb'), function(k){
    k.classList.remove('richtig','falsch');
  });
  document.getElementById('wzSpielStand').textContent =
    'Wort ' + Math.min(WZ_SPIEL.i + 1, WZ_SPIEL.stuecke.length) + ' von ' + WZ_SPIEL.stuecke.length
    + ' · richtig: ' + WZ_SPIEL.richtig;
  if (!s){
    ar.innerHTML = '<span class="roh">✓</span>';
    document.getElementById('wzSpielDe').textContent = '';
    document.getElementById('wzSpielMeldung').innerHTML =
      '<b>' + WZ_SPIEL.richtig + ' von ' + WZ_SPIEL.stuecke.length + '</b> richtig zugeordnet.';
    WZ_SPIEL.offen = false;
    return;
  }
  /* Ohne Hervorhebung - das Finden ist ja die Aufgabe.
     ⚠️ NICHT class="fm" nehmen: die wird im Normalfall gedimmt, dann stuende
     das Raetselwort grau da. Hier braucht es eine neutrale Klasse. */
  ar.innerHTML = '<span class="roh">' + wzEsc(s.ar) + '</span>';
  /* Die Uebersetzung steht schon VOR der Antwort da - Elias' Wunsch, damit das
     Spiel nebenbei Vokabeln zeigt. Sie verraet die Wurzel nicht direkt, macht
     den semantischen Loesungsweg aber gangbar. Das ist gewollt. */
  document.getElementById('wzSpielDe').textContent = s.de;
  document.getElementById('wzSpielMeldung').textContent = 'Welche drei Buchstaben tragen dieses Wort?';
  WZ_SPIEL.offen = true;
}

/* ================= Hinweis zum Niveau ================= */
function wzNiveauInfo(){
  var el = document.getElementById('wzNiveauInfo');
  if (!el) return;
  var mitNeu = WZ_FAMILIEN.filter(function(f){
    return f.woerter.some(function(x){ return !x.kennst; });
  }).length;
  if (!WZ_FAMILIEN.length){
    el.innerHTML = 'Zu deiner Auswahl gibt es keine Wortfamilie mit mindestens '
      + 'zwei Wörtern. Wähle oben auf der Startseite mehr Kapitel oder Bücher.';
    return;
  }
  if (!mitNeu){
    el.innerHTML = '⚠️ Auf diesem Stand gibt es <b>kein einziges neues Wort</b> — '
      + 'deine Kartei enthält alles, was hier eine Wurzel hat. Es bleiben <b>'
      + WZ_FAMILIEN.length + ' Familien</b> aus deinen eigenen Wörtern, und '
      + '<b>Schritt 3 (Erraten) entfällt</b>. Eine Stufe weiter in den '
      + 'Einstellungen bringt ihn zurück.';
  } else {
    el.innerHTML = WZ_FAMILIEN.length + ' Familien, davon <b>' + mitNeu
      + '</b> mit mindestens einem neuen Wort für Schritt 3.';
  }
}

/* ================= Einstieg ================= */
function oeffneWurzeln(){
  document.body.dataset.wurzelfarbe = SETTINGS.wurzelFarbe || 'normal';
  wzBaueFamilien();
  wzNiveauInfo();
  if (!WZ_FAMILIEN.length){
    wzSchrittZeigen(-1);
    document.getElementById('wzFortschritt').textContent = '—';
    document.getElementById('wzKopfWurzel').textContent = '—';
    document.getElementById('wzKopfZahl').textContent = '';
    document.getElementById('wzKoerbe').innerHTML = '';
    document.getElementById('wzSpielAr').textContent = '—';
    return;
  }
  WZ_SPIEL.erste = true;
  wzStarteSitzung();
  wzNeueRunde();
}

/* ================= Ereignisse =================
   Alles ueber einen Zuhoerer am Dokument. Die Bildschirme werden neu
   aufgebaut, einzeln angehaengte Zuhoerer waeren danach weg. */
document.addEventListener('click', function(e){
  var t = e.target;

  if (t.closest && t.closest('#wzS1Knopf')){
    var f1 = wzFamilie();
    if (!WZ_S1_REST.length){ wzSchritt2(); return; }
    var x = WZ_S1_REST.shift();
    var m = wzMarkiere(x.ar, f1.wurzel);
    var d = document.createElement('div');
    d.className = 'wz-karte';
    d.innerHTML = '<div class="wz-ar">' + (m.ok ? m.html : wzEsc(x.ar)) + '</div>' +
                  '<div class="wz-de">' + wzEsc(x.de) + '</div>';
    document.getElementById('wzS1Liste').appendChild(d);
    document.getElementById('wzS1Knopf').textContent =
      WZ_S1_REST.length ? ('Noch ' + WZ_S1_REST.length + ' aufdecken') : 'Weiter';
    return;
  }

  var ein = t.closest && t.closest('#wzS2Wort .wz-ein');
  if (ein){
    if (ein.classList.contains('tr')) return;
    if (ein.dataset.wz === '1'){
      ein.classList.add('tr'); WZ_S2_TREFFER++;
      WZ_SITZUNG.gesamt++; WZ_SITZUNG.richtig++;
      if (WZ_S2_TREFFER >= WZ_S2_ZIEL){
        document.getElementById('wzS2Meldung').innerHTML = '<b>Alle gefunden.</b>';
        document.getElementById('wzS2Weiter').hidden = false;
      }
    } else {
      WZ_SITZUNG.gesamt++;
      ein.classList.add('fl');
      document.getElementById('wzS2Meldung').textContent = 'Der gehört zur Form, nicht zur Wurzel.';
      setTimeout(function(){ ein.classList.remove('fl'); }, 600);
    }
    return;
  }
  if (t.closest && t.closest('#wzS2Weiter')){ wzSchritt3(); return; }

  var wahl = t.closest && t.closest('#wzS3Auswahl .wz-wahl');
  if (wahl){
    var feld = document.getElementById('wzS3Auswahl');
    if (feld.dataset.fertig === '1') return;
    feld.dataset.fertig = '1';
    var richtig = feld.dataset.richtig;
    WZ_SITZUNG.gesamt++;
    if (wahl.dataset.de === richtig){ WZ_SITZUNG.richtig++; wahl.classList.add('richtig'); }
    else {
      wahl.classList.add('falsch');
      [].forEach.call(feld.querySelectorAll('.wz-wahl'), function(x){
        if (x.dataset.de === richtig) x.classList.add('richtig');
      });
    }
    document.getElementById('wzS3Meldung').innerHTML =
      'Das Wort gehört zu <b>' + wzEsc(wzFamilie().wurzel) + '</b> — deshalb passt es dazu.';
    document.getElementById('wzS3Weiter').hidden = false;
    return;
  }
  if (t.closest && t.closest('#wzS3Weiter')){
    document.getElementById('wzS3Auswahl').dataset.fertig = '';
    wzFertig(); return;
  }

  if (t.closest && (t.closest('#wzNaechste') || t.closest('#wzUeberspringen'))){ wzNaechsteFamilie(); return; }
  if (t.closest && (t.closest('#wzNochmal') || t.closest('#wzNeueSitzung'))){ wzStarteSitzung(); return; }
  if (t.closest && t.closest('#wzNeueRunde')){ wzNeueRunde(); return; }

  var korb = t.closest && t.closest('.wz-korb');
  if (korb){
    if (!WZ_SPIEL.offen) return;
    var s = WZ_SPIEL.stuecke[WZ_SPIEL.i];
    if (!s) return;
    WZ_SPIEL.offen = false;
    var stimmt = korb.dataset.wurzel === s.wurzel;
    if (stimmt){ WZ_SPIEL.richtig++; korb.classList.add('richtig'); }
    else {
      korb.classList.add('falsch');
      [].forEach.call(document.querySelectorAll('.wz-korb'), function(x){
        if (x.dataset.wurzel === s.wurzel) x.classList.add('richtig');
      });
    }
    /* Aufloesung: dasselbe Wort, jetzt markiert. Das ist der Lernmoment. */
    var mm = wzMarkiere(s.ar, s.wurzel);
    document.getElementById('wzSpielAr').innerHTML = mm.ok ? mm.html : wzEsc(s.ar);
    document.getElementById('wzSpielDe').textContent = s.de;
    document.getElementById('wzSpielMeldung').innerHTML = stimmt
      ? 'Richtig — <b>' + wzEsc(s.wurzel) + '</b>'
      : 'Das gehört zu <b>' + wzEsc(s.wurzel) + '</b>';
    setTimeout(function(){ WZ_SPIEL.i++; wzZeigeStueck(); }, 1500);
    return;
  }
});

/* Die Faerbung haengt an einem Attribut am <body> und muss stehen, bevor der
   Wurzelmodus zum ersten Mal geoeffnet wird - sonst zeigt die Einstellung
   "umgekehrt" beim ersten Aufruf noch die Voreinstellung. */
document.addEventListener('DOMContentLoaded', function(){
  document.body.dataset.wurzelfarbe = SETTINGS.wurzelFarbe || 'normal';
});

/* Die Ausrichtung haengt an gemessenen Breiten - nach einer Groessenaenderung
   stimmt sie nicht mehr. */
window.addEventListener('resize', function(){
  if (document.querySelector('[data-screen="wurzeln"].active')) wzAusrichten();
});
