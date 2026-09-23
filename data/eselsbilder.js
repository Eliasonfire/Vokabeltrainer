/* data/eselsbilder.js — das Bild an der Eselsbrücke (seit v573, 23.09.2026)
   =========================================================================

   WOZU

   Elias am 23.09.2026, 02:08, nach den Musterkarten:

     „Eselsbrücken-Bild: C · Mischung · die 72 + die 14 Beziehungswörter · nur Rückseite"

   · Mischung: ein EMOJI, wo es das Wort selbst zeigt (72 Wörter), und eine
     kleine ZEICHNUNG bei den 14 Beziehungswörtern — dort erklärt sie, was das
     Wort allein nicht sagt: wo etwas liegt, wohin es geht, auf welcher Seite
     der Familie. Die übrigen Karten bekommen bewusst KEIN Bild: ein loses
     Emoji (🤑 für „reich") prägt eine schiefe Bedeutung ein.
   · Nur Rückseite: 🏠 neben dem arabischen Wort verriete schon „Haus".
     Gezeigt von renderEselsbild() in js/lernen.js, im Element #cardEselsbild
     auf der Rückseite über der Eselsbrücke.

   ⛔ SEINE REGEL FÜR DIE ZEICHNUNGEN, gleich danach:

     „mir ist aber auch wichtig, dass wenn du zeichnungen hast wie oben oder
      unten das du nicht einfach zwei mal die gleiche zeichnung nimmst und
      einmal die katze hoch und einmal unters bett packst weil dann sehen die
      sich viellll zu ähnlich aus. sie sollen immer ein bisschen anders sein
      damit ich sie mir besser eingrägen kann. sie müssen nicht extrem anders
      sein aber ein bisschen reicht schon"

   Deshalb zeigt jede Zeichnung den BEISPIELSATZ IHRER EIGENEN KARTE: der Stift
   auf dem Schreibtisch, das Buch in der Tasche, die Katze unter dem Bett. Jedes
   Wort hat so seine eigene Szene, und die Gegenpaare (auf/unter, hier/dort,
   nah/fern, Osten/Westen, die beiden Onkel) teilen sich keine Zeichnung.
   ⚠️ Wer in vocab-data.js einen dieser Beispielsätze ändert, sieht hier nach,
   ob die Zeichnung noch zum Satz passt.

   AUFBAU
   · ESELSBILD_EMOJI      Kennung → Emoji (72)
   · ESELSBILD_ZEICHNUNG  Kennung → { text, viewBox, inhalt } (14)
       text     wird zum aria-label der Zeichnung
       inhalt   das Innere des <svg> — nur path, rect, circle, ellipse, line,
                text, g; Pfade nur mit großen (absoluten) Befehlen
   · Keine Farben hier, nur Klassen. Die Farben setzt index.html bei
     `.eselsbild` aus den Farbvariablen der App:
       eb-g   Boden und Hilfslinien, leise      eb-r   DAS, worauf es ankommt (rote Kante)
       eb-d   Gegenstand (Fläche, helle Kante)  eb-rl  rote Linie
       eb-dl  helle Linie ohne Fläche           eb-rf  rote Fläche
       eb-m   Gegenstand im Hintergrund         eb-strich  gestrichelt (zusätzlich)
       eb-ml  gedämpfte Linie                   eb-t   Beschriftung, eb-tr rot, eb-ar arabisch
   · ⛔ Kein Arabisch von Hand: wo eine Zeichnung ein arabisches Wort zeigt, steht
     {{ar:<kennung>}}, und renderEselsbild() setzt das Wort aus den Kartendaten
     ein — vokalisiert wie auf der Karte.

   PFLEGE: werkzeuge/pflegeplan.mjs („Bild an der Eselsbrücke").
   Bewacht von werkzeuge/pruefe-eselsbilder.mjs: 72 + 14, jede Kennung gibt es,
   nur auf der Rückseite, nur erlaubte Bausteine, und seine Regel — keine zwei
   Zeichnungen mit fast gleichem Bauplan.
*/

/* Ein Emoji zeigt das Wort selbst. Die Zuordnung ist von Hand, Wort für Wort
   (22./23.09.2026); Elias hat sie als Liste auf der Musterkarten-Seite gesehen
   und „die 72" gewählt. 10 davon sind Flaggen — Windows zeigt dort nur zwei
   Buchstaben, seine Geräte (Pixel, Samsung-Tablet) die Flagge.
   Nachgeschärft am 23.09.2026 nach einer Gegenprüfung (63 von 72 trugen ohne
   Einwand): Arzt, Student, Lehrer und Bauer zeigen die MÄNNLICHE Figur statt
   der neutralen (👨‍⚕️ statt 🧑‍⚕️ usw.) — die Karte lehrt das männliche Wort und
   führt die weibliche Form eigens, wie 👦/👧 bei Junge/Mädchen.
   ⚠️ Offen, als Frage an Elias: 🔒 geschlossen, 📚 Bibliothek, 🍲 Kochtopf und
   🛣️ Straße zeigen eher ein Nachbarwort (abgeschlossen, Bücher, Eintopf,
   Autobahn). Herausnehmen würde seine „72" ändern — das entscheidet er. */
const ESELSBILD_EMOJI = {
  '45751': '🏠', '45752': '🕌', '45753': '🚪', '45754': '📖', '45755': '✏️', '45756': '🔑',
  '45758': '🛏️', '45759': '🪑', '45760': '⭐', '45761': '👨‍⚕️', '45762': '👦', '45763': '👨‍🎓',
  '45764': '👨', '45766': '🐕', '45767': '🐈', '45768': '🫏', '45769': '🐎', '45770': '🐪',
  '45771': '🐓', '45772': '👨‍🏫', '45780': '🪨', '45782': '🥛', '45787': '🥶', '45788': '🥵',
  '45790': '🧍', '45801': '📄', '45802': '💧', '45803': '🍎', '45804': '🏪', '45807': '🤒',
  '45813': '🇵🇭', '45814': '🇯🇵', '45815': '🇨🇳', '45816': '🇮🇳', '45817': '🏫', '45822': '🛁',
  '45826': '🚽', '45831': '🛣️', '45832': '🚗', '45833': '🕋', '45837': '🔒', '45838': '👧',
  '45840': '🎒', '45842': '🐄', '45843': '🚲', '45844': '🥄', '45845': '👨‍🌾', '45849': '🍵',
  '45851': '☕', '45852': '👃', '45853': '👄', '45854': '🍲', '45855': '👂', '45856': '👁️',
  '45857': '✋', '45858': '🦵', '45860': '🪟', '45863': '🦆', '45865': '🥚', '45867': '🐔',
  '45868': '🇺🇸', '45869': '🔪', '45870': '🇩🇪', '45872': '🇮🇶', '45873': '🇨🇭', '45874': '🏥',
  '45877': '🐦', '45885': '🏙️', '45890': '📚', '45894': '🇰🇼', '45898': '🇮🇩',
  '59e30a8a-e400-4380-8adf-89e811852a1d': '🥩'
};

/* Die 14 Beziehungswörter. Rot ist immer das, worauf es beim Wort ankommt. */
const ESELSBILD_ZEICHNUNG = {

  /* ---------- auf · in · unter: drei Sätze, drei Szenen ---------- */

  /* عَلَى — „Der Stift ist auf dem Schreibtisch." */
  '45811': {
    text: 'Zeichnung: Ein Stift liegt auf dem Schreibtisch',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M12 110 H188"/>'
    + '<rect class="eb-d" x="38" y="70" width="8" height="40" rx="2"/>'
    + '<rect class="eb-d" x="154" y="70" width="8" height="40" rx="2"/>'
    + '<rect class="eb-d" x="112" y="70" width="42" height="24" rx="2"/>'
    + '<path class="eb-dl" d="M126 82 H140"/>'
    + '<rect class="eb-d" x="28" y="60" width="144" height="10" rx="2"/>'
    + '<path class="eb-r" d="M58 55 L68 51 H120 Q124 51 124 55 Q124 59 120 59 H68 Z"/>'
    + '<path class="eb-rl" d="M68 51 V59 M110 51 V59"/>'
  },

  /* فِي — „Das Buch ist in der Tasche." Der verdeckte Teil des Buchs ist
     gestrichelt: man sieht, dass es DRIN steckt. */
  '45812': {
    text: 'Zeichnung: Ein Buch steckt in der Tasche',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M12 112 H188"/>'
    + '<path class="eb-dl" d="M72 50 C72 0 128 0 128 50"/>'
    + '<rect class="eb-r" x="82" y="28" width="36" height="50" rx="2"/>'
    + '<path class="eb-rl" d="M88 28 V50"/>'
    + '<path class="eb-d" d="M50 50 H150 L142 112 H58 Z"/>'
    + '<path class="eb-rl eb-strich" d="M82 50 V78 H118 V50"/>'
    + '<rect class="eb-dl" x="92" y="88" width="16" height="10" rx="2"/>'
  },

  /* تَحْتَ — „Die Katze ist unter dem Bett." Dieselbe Zeichnung wie auf der
     Musterkarten-Seite, die Elias gesehen hat. */
  '45828': {
    text: 'Zeichnung: Eine Katze liegt unter dem Bett',
    viewBox: '0 0 160 104',
    inhalt:
      '<path class="eb-g" d="M8 94 H152"/>'
    + '<rect class="eb-d" x="16" y="18" width="8" height="76" rx="2"/>'
    + '<rect class="eb-d" x="136" y="34" width="8" height="60" rx="2"/>'
    + '<rect class="eb-d" x="22" y="40" width="116" height="16" rx="3"/>'
    + '<rect class="eb-m" x="30" y="29" width="26" height="11" rx="5"/>'
    + '<ellipse class="eb-r" cx="82" cy="84" rx="19" ry="8"/>'
    + '<circle class="eb-r" cx="60" cy="78" r="7.5"/>'
    + '<path class="eb-rl" d="M54.5 73 L55.5 65.5 L60 71 M61 71 L65 65.5 L66 73"/>'
    + '<path class="eb-rl" d="M100 82 C112 80 115 69 107 66"/>'
  },

  /* ---------- von/aus · nach/zu: Herkunft gegen Ziel ---------- */

  /* مِنْ — „Der Student ist aus Japan." Rot ist der AUSGANGSPUNKT: die Flagge,
     von der der Weg weggeht. */
  '45808': {
    text: 'Zeichnung: Ein Weg führt von der Flagge Japans zu einem Studenten',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M12 108 H188"/>'
    + '<path class="eb-dl" d="M34 108 V24"/>'
    + '<rect class="eb-r" x="34" y="24" width="48" height="32" rx="1"/>'
    + '<circle class="eb-rf" cx="58" cy="40" r="9"/>'
    + '<text class="eb-t" x="58" y="72" text-anchor="middle">Japan</text>'
    + '<path class="eb-rl eb-strich" d="M50 98 C80 114 118 112 138 100"/>'
    + '<path class="eb-rl" d="M128 100 L138 100 L133 109"/>'
    + '<path class="eb-d" d="M147 108 C147 72 177 72 177 108 Z"/>'
    + '<circle class="eb-d" cx="162" cy="64" r="9"/>'
    + '<path class="eb-d" d="M148 56 L162 49 L176 56 L162 63 Z"/>'
    + '<path class="eb-dl" d="M176 56 V66"/>'
  },

  /* إِلَى — „Vom Haus zur Universität." Rot ist das ZIEL, und der Pfeil zeigt
     hinein. Das Haus ist nur Startpunkt und deshalb gedämpft. */
  '45809': {
    text: 'Zeichnung: Ein Pfeil führt vom Haus zur Universität',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M10 104 H190"/>'
    + '<rect class="eb-m" x="18" y="68" width="38" height="36"/>'
    + '<path class="eb-m" d="M13 70 L37 48 L61 70 Z"/>'
    + '<rect class="eb-m" x="32" y="86" width="10" height="18"/>'
    + '<path class="eb-rl" d="M66 92 H116"/>'
    + '<path class="eb-rl" d="M108 85 L118 92 L108 99"/>'
    + '<path class="eb-r" d="M126 57 L158 40 L190 57 Z"/>'
    + '<rect class="eb-r" x="130" y="57" width="56" height="6"/>'
    + '<rect class="eb-r" x="135" y="63" width="6" height="33"/>'
    + '<rect class="eb-r" x="149" y="63" width="6" height="33"/>'
    + '<rect class="eb-r" x="163" y="63" width="6" height="33"/>'
    + '<rect class="eb-r" x="177" y="63" width="6" height="33"/>'
    + '<rect class="eb-r" x="126" y="96" width="64" height="8"/>'
  },

  /* ---------- hier · dort ---------- */

  /* هُنَا — „Der Lehrer ist jetzt hier." Er steht auf dem roten Fleck und
     zeigt mit dem Stock darauf: genau diese Stelle. */
  '45834': {
    text: 'Zeichnung: Der Lehrer steht hier und zeigt auf die Stelle, an der er steht',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M12 106 H188"/>'
    + '<rect class="eb-m" x="16" y="24" width="52" height="34" rx="2"/>'
    + '<path class="eb-ml" d="M24 36 H50 M24 45 H58"/>'
    + '<ellipse class="eb-r" cx="102" cy="106" rx="36" ry="7"/>'
    + '<path class="eb-d" d="M86 104 L89 62 Q102 54 115 62 L118 104 Z"/>'
    + '<circle class="eb-d" cx="102" cy="42" r="11"/>'
    + '<path class="eb-dl" d="M114 66 L128 84"/>'
    + '<path class="eb-rl" d="M128 84 L140 104"/>'
  },

  /* هُنَاكَ — „Die Bibliothek ist dort." Klein und weit weg, und ein Arm zeigt
     hin — die Eselsbrücke nennt das كَ den Zeigefinger in die Ferne. */
  '45836': {
    text: 'Zeichnung: Jemand zeigt auf eine Bibliothek weit weg',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M8 112 H74"/>'
    + '<path class="eb-g" d="M96 88 Q140 78 192 86"/>'
    + '<path class="eb-d" d="M20 112 L23 70 Q36 61 49 70 L52 112 Z"/>'
    + '<circle class="eb-d" cx="36" cy="48" r="11"/>'
    + '<path class="eb-dl" d="M46 72 L84 56"/>'
    + '<path class="eb-rl eb-strich" d="M92 56 L148 70"/>'
    + '<path class="eb-r" d="M148 71 L167 60 L186 71 Z"/>'
    + '<rect class="eb-r" x="152" y="71" width="30" height="15"/>'
    + '<rect class="eb-rl" x="164" y="77" width="6" height="9"/>'
    + '<text class="eb-t eb-tr" x="167" y="102" text-anchor="middle">Bibliothek</text>'
  },

  /* ---------- nah · fern: zwei ganz verschiedene Blicke ---------- */

  /* قَرِيبٌ — „Die Schule ist nahe am Haus." So nah, dass ein Kind mit
     ausgestreckten Armen beide Wände berührt. */
  '45793': {
    text: 'Zeichnung: Ein Kind berührt mit ausgestreckten Armen das Haus und die Schule zugleich',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M8 108 H192"/>'
    + '<rect class="eb-d" x="26" y="64" width="44" height="44"/>'
    + '<path class="eb-d" d="M20 66 L48 42 L76 66 Z"/>'
    + '<rect class="eb-dl" x="42" y="86" width="12" height="22"/>'
    + '<rect class="eb-d" x="122" y="54" width="56" height="54"/>'
    + '<rect class="eb-d" x="141" y="36" width="18" height="18"/>'
    + '<path class="eb-d" d="M137 37 L150 26 L163 37 Z"/>'
    + '<circle class="eb-dl" cx="150" cy="68" r="7"/>'
    + '<path class="eb-dl" d="M150 68 V63 M150 68 H154"/>'
    + '<rect class="eb-dl" x="128" y="80" width="10" height="10"/>'
    + '<rect class="eb-dl" x="162" y="80" width="10" height="10"/>'
    + '<rect class="eb-dl" x="144" y="88" width="12" height="20"/>'
    + '<circle class="eb-r" cx="96" cy="60" r="8"/>'
    + '<path class="eb-r" d="M88 108 L90 74 Q96 69 102 74 L104 108 Z"/>'
    + '<path class="eb-rl" d="M91 78 L70 82 M101 78 L122 82"/>'
    + '<circle class="eb-rf" cx="70" cy="82" r="3"/>'
    + '<circle class="eb-rf" cx="122" cy="82" r="3"/>'
  },

  /* بَعِيدٌ — „Die Universität ist weit vom Haus entfernt." Das Haus vorn,
     die Straße läuft bis an den Horizont, dort steht die Universität winzig. */
  '45794': {
    text: 'Zeichnung: Eine lange Straße führt vom Haus zu einer winzigen Universität am Horizont',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M8 50 H192"/>'
    + '<path class="eb-g" d="M60 50 Q80 42 100 50 M146 50 Q166 40 190 50"/>'
    + '<path class="eb-ml" d="M62 120 L128 50 M154 120 L136 50"/>'
    + '<path class="eb-rl eb-strich" d="M108 120 L132 50"/>'
    + '<path class="eb-r" d="M124 44 L132 38 L140 44 Z"/>'
    + '<rect class="eb-r" x="126" y="44" width="12" height="7"/>'
    + '<path class="eb-g" d="M4 114 H58"/>'
    + '<rect class="eb-d" x="10" y="80" width="42" height="34"/>'
    + '<path class="eb-d" d="M5 82 L31 60 L57 82 Z"/>'
    + '<rect class="eb-dl" x="26" y="96" width="10" height="18"/>'
  },

  /* ---------- Osten · Westen: Morgen gegen Abend ---------- */

  /* شَرْقٌ — „Die Moschee ist im Osten." Dazu seine Eselsbrücke: morgens der
     Tee in der Hand, und die Sonne kommt hoch. */
  '45861': {
    text: 'Zeichnung: Morgens geht neben der Moschee die Sonne im Osten auf, vorn ein Glas Tee',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M40 86 H192"/>'
    + '<path class="eb-r" d="M130 86 A24 24 0 0 1 178 86 Z"/>'
    + '<path class="eb-rl" d="M154 54 V46 M134 62 L128 56 M174 62 L180 56 M124 76 L116 74 M184 76 L192 74"/>'
    + '<path class="eb-rl" d="M154 38 V22 M148 28 L154 20 L160 28"/>'
    + '<text class="eb-t eb-tr" x="154" y="102" text-anchor="middle">Osten</text>'
    + '<rect class="eb-d" x="44" y="64" width="52" height="22"/>'
    + '<path class="eb-d" d="M50 64 Q70 32 90 64 Z"/>'
    + '<path class="eb-dl" d="M70 48 V38"/>'
    + '<rect class="eb-d" x="102" y="42" width="8" height="44"/>'
    + '<path class="eb-d" d="M100 42 L106 32 L112 42 Z"/>'
    + '<path class="eb-dl" d="M64 86 V76 Q70 68 76 76 V86"/>'
    + '<path class="eb-d" d="M14 96 H32 L29 116 H17 Z"/>'
    + '<path class="eb-ml" d="M19 90 Q16 85 19 80 M27 90 Q24 85 27 80"/>'
  },

  /* غَرْبٌ — „Das Haus ist im Westen." Dazu seine Eselsbrücke: dieselbe Wurzel
     wie مَغْرِب, die Zeit des Sonnenuntergangs — Mond und Sterne sind schon da. */
  '45850': {
    text: 'Zeichnung: Abends geht die Sonne im Westen hinter dem Haus unter, Mond und Sterne stehen schon am Himmel',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M8 86 H192"/>'
    + '<path class="eb-r" d="M22 86 A24 24 0 0 1 70 86 Z"/>'
    + '<path class="eb-rl" d="M46 30 V50 M40 44 L46 52 L52 44"/>'
    + '<text class="eb-t eb-tr" x="46" y="102" text-anchor="middle">Westen</text>'
    + '<path class="eb-m" d="M178 14 A12 12 0 1 0 189.1 30.6 A10 10 0 0 1 178 14 Z"/>'
    + '<path class="eb-ml" d="M144 18 V26 M140 22 H148 M124 38 V44 M121 41 H127"/>'
    + '<rect class="eb-d" x="64" y="60" width="46" height="26"/>'
    + '<path class="eb-d" d="M58 62 L87 40 L116 62 Z"/>'
    + '<rect class="eb-m" x="72" y="67" width="10" height="9"/>'
    + '<rect class="eb-dl" x="92" y="70" width="10" height="16"/>'
  },

  /* ---------- die beiden Onkel: ZWEI verschiedene Zeichnungen ----------
     ⛔ Auf der Musterkarten-Seite stand: „Dieselbe Zeichnung trägt auch das
     Gegenstück, dann mit der Mutterseite in Rot." Genau das ist nach seiner
     Regel falsch — derselbe Stammbaum, nur die Farbe woanders. Der Onkel
     mütterlicherseits hat deshalb ein eigenes Bild. */

  /* عَمٌّ — „Dies ist der Onkel des Jungen (väterlicherseits)." Der Stammbaum
     von der Musterkarte: die Seite des Vaters rot. */
  '45829': {
    text: 'Zeichnung: Stammbaum, der Bruder des Vaters ist hervorgehoben',
    viewBox: '0 0 240 132',
    inhalt:
      '<text class="eb-t" x="50" y="10" text-anchor="middle">Seite des Vaters</text>'
    + '<text class="eb-t" x="190" y="10" text-anchor="middle">Seite der Mutter</text>'
    + '<path class="eb-g" d="M30 26 V18 H70 V26 M170 26 V18 H210 V26"/>'
    + '<circle class="eb-r" cx="30" cy="34" r="8"/>'
    + '<path class="eb-r" d="M19 58 C19 44 41 44 41 58 Z"/>'
    + '<circle class="eb-d" cx="70" cy="34" r="8"/>'
    + '<path class="eb-d" d="M59 58 C59 44 81 44 81 58 Z"/>'
    + '<circle class="eb-d" cx="170" cy="34" r="8"/>'
    + '<path class="eb-d" d="M159 58 C159 44 181 44 181 58 Z"/>'
    + '<circle class="eb-m" cx="210" cy="34" r="8"/>'
    + '<path class="eb-m" d="M199 58 C199 44 221 44 221 58 Z"/>'
    + '<text class="eb-ar eb-tr" x="30" y="78" text-anchor="middle">{{ar:45829}}</text>'
    + '<text class="eb-t" x="70" y="74" text-anchor="middle">Vater</text>'
    + '<text class="eb-t" x="170" y="74" text-anchor="middle">Mutter</text>'
    + '<text class="eb-ar" x="210" y="78" text-anchor="middle">{{ar:45835}}</text>'
    + '<path class="eb-g" d="M70 82 V90 H170 V82 M120 90 V96"/>'
    + '<circle class="eb-d" cx="120" cy="104" r="7"/>'
    + '<path class="eb-d" d="M110 126 C110 113 130 113 130 126 Z"/>'
    + '<text class="eb-t" x="137" y="124">Junge</text>'
  },

  /* خَالٌ — „Dies ist der Onkel des Mädchens (mütterlicherseits)." Kein Baum,
     sondern ein Bild: die Mutter und ihr Bruder als Geschwister, das Mädchen
     an der Hand der Mutter. */
  '45835': {
    text: 'Zeichnung: Die Mutter und ihr Bruder, das Mädchen hält die Hand der Mutter',
    viewBox: '0 0 200 130',
    inhalt:
      '<text class="eb-t" x="110" y="11" text-anchor="middle">Geschwister</text>'
    + '<path class="eb-g" d="M76 28 V18 H144 V28"/>'
    + '<path class="eb-g" d="M8 106 H192"/>'
    + '<circle class="eb-d" cx="26" cy="68" r="7"/>'
    + '<path class="eb-d" d="M16 106 L21 78 Q26 75 31 78 L36 106 Z"/>'
    + '<path class="eb-dl" d="M32 84 L64 78"/>'
    + '<circle class="eb-d" cx="76" cy="40" r="10"/>'
    + '<path class="eb-d" d="M60 106 L68 56 Q76 51 84 56 L92 106 Z"/>'
    + '<circle class="eb-r" cx="144" cy="40" r="10"/>'
    + '<path class="eb-r" d="M128 106 L130 60 Q144 51 158 60 L160 106 Z"/>'
    + '<text class="eb-t" x="26" y="121" text-anchor="middle">Mädchen</text>'
    + '<text class="eb-t" x="76" y="121" text-anchor="middle">Mutter</text>'
    + '<text class="eb-ar eb-tr" x="144" y="125" text-anchor="middle">{{ar:45835}}</text>'
  },

  /* ---------- sitzend ---------- */

  /* جَالِسٌ — „Der Student sitzt auf dem Stuhl." Die Person ganz in Rot: es
     geht um sie, nicht um den Stuhl. */
  '45789': {
    text: 'Zeichnung: Jemand sitzt auf einem Stuhl',
    viewBox: '0 0 200 120',
    inhalt:
      '<path class="eb-g" d="M12 110 H188"/>'
    + '<rect class="eb-d" x="120" y="30" width="7" height="80" rx="2"/>'
    + '<rect class="eb-d" x="78" y="70" width="49" height="7" rx="2"/>'
    + '<rect class="eb-d" x="80" y="77" width="7" height="33" rx="2"/>'
    + '<circle class="eb-rf" cx="104" cy="22" r="9"/>'
    + '<path class="eb-rf" d="M95 36 Q104 31 113 36 L115 70 H93 Z"/>'
    + '<rect class="eb-rf" x="62" y="59" width="53" height="11" rx="5"/>'
    + '<rect class="eb-rf" x="62" y="62" width="11" height="44" rx="5"/>'
    + '<rect class="eb-rf" x="50" y="100" width="23" height="8" rx="3"/>'
  }
};
