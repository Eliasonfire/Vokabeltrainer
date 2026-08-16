# Maintenance Log

## 2026-07-24 13:00 – Wöchentliche Wartung (So-Check)

**Check 1 - Neue Aufzeichnung/Grammatik:**
- `get_recordings` liefert 12 Folgen; bisher bekannt (grammar-data.js +
  transcripts/) war nur Folge 01, Folge 02 stand als fehlgeschlagener
  Versuch vor (leeres Transkript-Panel laut vorherigem Backfill-Lauf).
  Einziger erlaubter Abrufversuch dieses Laufs: Folge 02 - diesmal
  **erfolgreich** (deutsche Auto-Untertitel vollständig geladen).
- Transkript gespeichert unter `transcripts/folge-02.md` (Kapitel 2 & 3,
  Madina Buch 1).
- 3 neue Grammatikregeln konservativ extrahiert und in `grammar-data.js`
  ergänzt: مَنْ (Fragewort "wer"), ذَلِكَ (Demonstrativpronomen "jenes",
  Ferne-Pendant zu هَذَا), اَلْ (bestimmter Artikel + Tanwin-Regel).
  1 von 3 Regeln (اَلْ) konnte mit einem sentAr-Beispielsatz getaggt werden
  (Vokabel-ID 45787, "الْمَاءُ بَارِدٌ الْيَوْمَ."). Für مَنْ und ذَلِكَ
  existiert aktuell kein passender Beispielsatz in VOCAB_DATA - nicht
  getaggt, als Kandidaten in `folge-02.md` unter "Flagged/skipped" vermerkt.
  Weitere nicht übernommene Passagen (Hamzatul-Wasl-Erklärung zu unklar,
  kalligraphische Dammatain-Variante, Wortherkunfts-Exkurse) ebenfalls dort
  dokumentiert.
- Folgen 03-12 bleiben offen (laut vorherigem Log-Eintrag wurde auch Folge 12
  bereits erfolglos versucht) - Backlog wird weiter von der Backfill-Routine
  abgearbeitet, nicht Teil dieses wöchentlichen Laufs (Rate-Limiting: nur ein
  Abrufversuch pro Lauf).

**Check 2 - Abgleich mit Samsung Notes:**
- `list_export_status` liefert eine leere Liste - weder "Grammatik Heft
  Medina Buch 1" noch "Madina Buch 1 (Beschriftet)" sind exportiert.
- Abgleich mit eigenen Notizen übersprungen - Notiz noch nicht exportiert.

**Check 3 - Neue freigeschaltete Kapitel/Vokabeln:**
- `get_unlocked_chapters` liefert Kapitel 1-9 (Madina Buch 1). VOCAB_DATA
  enthält bereits Einträge für alle Kapitel 1-9. Keine neuen Kapitel,
  keine Aktion nötig.

**Abschluss:**
- `grammar-data.js` und `sw.js` geändert (CACHE_NAME v7 → v8).
- `transcripts/folge-02.md` liegt nur lokal (per .gitignore ausgeschlossen).
- Änderungen committet und zu origin/main gepusht.

## 2026-07-24 22:00 – Wöchentliche Wartung (Mi-Check)

- **Check 1 (neue Aufzeichnung):** Neueste Aufzeichnung laut `get_recordings` ist **Folge 12** (https://youtu.be/tQKdcsNcc0c, "MB1 Kapitel 8 (2)") - höher als der bisher bekannte Stand (Folge 01 in `grammar-data.js`, Folge 01/02 unter `transcripts/`). Einziger erlaubter Abrufversuch durchgeführt: "Transkript anzeigen" geklickt, 5s gewartet - Panel blieb leer (kein Text geladen). Kein weiterer Versuch in diesem Lauf; die 6h-Backfill-Routine übernimmt Folge 02 ff. automatisch weiter. Keine Änderungen an `grammar-data.js`.
- **Check 2 (neue Kapitel/Vokabeln):** `get_unlocked_chapters` liefert Kapitel 1-9 (Madina Buch 1) - alle bereits vollständig in `vocab-data.js` vertreten (chapter 1-9 geprüft). Keine neu freigeschalteten Kapitel, keine Änderungen.
- Keine Datei-Änderungen außer diesem Log-Eintrag; kein `CACHE_NAME`-Bump nötig.

## 2026-07-24 – Grammatik-Transkript-Backfill (Folge 02)

- Bearbeitete Folge: **Folge 02** (https://youtu.be/FBd6oYJ7q04, "MB1 Kapitel 2 & 3")
- Transkript-Panel auf YouTube ist trotz zwei Versuchen (Klick auf "Transkript anzeigen", je 5s Wartezeit) leer geblieben - vermutlich das bekannte Rate-Limiting-Problem beim automatisierten Laden.
- Es wurde `transcripts/folge-02.md` mit nur dem Kopf-Abschnitt und einem Hinweis auf den fehlgeschlagenen Versuch angelegt (nicht committet, da `transcripts/` ohnehin per `.gitignore` ausgeschlossen ist).
- Keine Änderungen an `grammar-data.js` in diesem Lauf.
- Abgleich mit Samsung-Notes-Notizen: übersprungen, da kein Transkript zum Abgleichen vorlag.
- Nächster Versuch für Folge 02 beim nächsten geplanten Lauf.

## 2026-07-27 08:04 – Wöchentliche Wartung (So/Mi-Check)

Erster Lauf der lokalen Routine `vokabeltrainer-wartung` (Windows-Aufgabenplanung,
umgestellt am 27.07.26). Ergebnis vorweg: **keine inhaltliche Änderung nötig**,
aber ein blockierender Befund an der Routine selbst (siehe Schritt 0/7).

**Schritt 0 – Repo aktualisieren: FEHLGESCHLAGEN (Berechtigung).**
`git -C G:\1. Workspace\Vokabeltrainer pull --ff-only` wurde abgelehnt. Ursache: die
`allowedTools`-Liste in `G:\1. Workspace\Automation\routines.json` erlaubt
`Bash(git pull:*)`, `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(git push:*)` —
diese Muster greifen aber nur, wenn der Befehl *wörtlich* mit `git pull` / `git add`
usw. beginnt. Alle Befehle im Prompt beginnen mit `git -C <pfad> …` und passen
deshalb auf kein einziges Muster. Ohne `cd` (ebenfalls nicht erlaubt) und mit
`cwd = G:\1. Workspace` (kein Git-Repo) ist Git in diesem Lauf **komplett unbenutzbar**.
Gegengeprüft: `git pull --ff-only` ohne `-C` wird zwar erlaubt, scheitert aber mit
`fatal: not a git repository`. Der Arbeitsstand konnte also weder aktualisiert noch
committet werden — alle folgenden Prüfungen liefen gegen den lokal vorliegenden
Stand von `vocab-data.js`.

**Schritt 1 – Neue Aufzeichnungen:** `get_recordings` liefert 13 Folgen, höchste ist
**Folge 13 „MB1 Kapitel 9"** (https://youtu.be/17i1khFi7GY, 2026-07-26). Das
entspricht exakt dem Stand in `transcripts/backlog.md` — **keine neue Folge**.
`backlog.md` nur im Kopf aktualisiert (Prüfdatum), Tabelle unverändert; offen
bleiben weiterhin Folgen 03–13. Es wurde **kein** Transkript abgerufen und **keine**
Grammatikregel bestätigt — in dieser Umgebung technisch nicht möglich (kein
Browser, kein WebFetch); `get_recordings` liefert nur Metadaten.

**Schritt 2 – Neu freigeschaltete Kapitel:** `get_unlocked_chapters` liefert
`madina-1-chapter-1` bis `-9`. `vocab-data.js` deckt Kapitel 1–9 vollständig ab.
**Keine neu freigeschalteten Kapitel, nichts einzupflegen.**

**Schritt 3 – Wort-Diff innerhalb Kapitel 1–9 (`get_vocabulary_by_book("madina-1")`):**
Vollständiger Abgleich Feld für Feld, nicht nur auf Kapitelebene.
- arabicroots, Kapitel 1–9: **149 Einträge** (IDs 45751–45898 lückenlos + der
  Nachzügler 48402 in Kapitel 9).
- `vocab-data.js`: **149 Einträge mit `source: "vocabulary"`** — exakt dieselben IDs
  in derselben Reihenfolge, dazu 11 Einträge `source: "personal_vocabulary"`
  (= 160 gesamt).
- **Fehlende Wörter: keine (0).**
- **Wörter in der App, die es in arabicroots nicht mehr gibt: keine (0).**
- **Inhaltliche Änderungen (Übersetzung / Plural / Verbformen): keine (0).**
  Alle 149 Paare `german`↔`de`, `plural`↔`pl`, `word_type`↔`type`, `gender`,
  `feminine_singular`↔`femSg`, `feminine_plural`↔`femPl` stimmen überein.
  Verbfelder sind in Kapitel 1–9 durchgehend `null` (der erste Verb-Eintrag in
  madina-1 liegt in Kapitel 10+, also außerhalb des freigeschalteten Bereichs).
- Wegen des GATE wären neue Vokabeln ohnehin nicht eingepflegt worden — es gab aber
  schlicht keine. Die Liste „was einzupflegen wäre, sobald der PROGRESS-Bug behoben
  ist" ist für Kapitel 1–9 damit **leer**.

**Schritt 3b – Prüfpunkte für Elias (bewusst NICHT geändert):**
Beim Feldabgleich sind drei systematische Abweichungen aufgefallen, die *keine*
arabicroots-Änderungen sind, sondern Eigenheiten des ursprünglichen Imports. Da
weder Übersetzung noch Plural noch Verbform betroffen sind und „im Zweifel
konservativ" gilt, wurde nichts angefasst:
1. **`sg` fehlt bei 23 Einträgen**, die in arabicroots ein `singular` haben:
   سُكَّرٌ, لَبَنٌ, مَاءٌ, الفِلِيبِّينُ, اليَابَانُ, الصِّينُ, الهِنْدُ, كَعْبَةٌ,
   شَايٌ, غَرْبٌ, قَهْوَةٌ, شَرْقٌ, أَمْرِيكَا, أَلْمَانِيَا, إِنْجِلْتَرَا,
   العِرَاقُ, سُويسْرَا, عَرَبِيَّةٌ, إِنْجِلِيزِيَّةٌ, القَاهِرَةُ, الكُوَيْتُ,
   إِنْدُونِيسِيَا, الْيَوْمُ. Muster: bei 22 davon ist auch `pl` leer, `sg` wäre
   dort nur eine Dublette von `ar` — vermutlich Absicht des Generators. Einziger
   echter Ausreißer: **لَبَنٌ** hat `pl: "أَلْبَان"`, aber `sg: null`. Gegenprobe in
   die andere Richtung: **مِكْوَاةٌ** hat `sg` gesetzt, aber kein `pl`. Die Regel ist
   also nicht sauber durchgehalten — beim Validierungsskript (E.2) als
   Konsistenzregel mit aufnehmen.
2. **`root` fehlt bei 10 Partikeln**, die in arabicroots eine Wurzel tragen:
   مِنْ „م ن", إِلَى „ا ل ى", أَيْنَ „ا ي ن", عَلَى „ع ل و", فِي „ف ي",
   تَحْتَ „ت ح ت", هُنَا „ه ن ا", هُنَاكَ „ه ن ك", لِمَاذَا „ل م ذ", الآنَ „ا ن".
   **Bewusst nicht übernommen**: mehrere dieser „Wurzeln" sind offensichtlich
   maschinell aus den Buchstaben erzeugt (م ن für مِنْ, ا ن für الآنَ) und keine
   echten Wurzeln. Sie in die App zu kopieren wäre eine Qualitätsverschlechterung
   und stünde gegen E.1 (keine ungeprüften Sprachdaten). Entscheidung für Elias:
   entweder dauerhaft leer lassen oder pro Partikel einzeln prüfen.
   (Die fünf Partikel نَعَمْ, لَا, أَ, مَا, وَ haben auch in arabicroots `root: null` —
   dort stimmen App und Quelle überein.)
3. **Plural-Trennzeichen**: arabicroots trennt Mehrfachplurale mit `|`
   (`بَقَرٌ|بَقَرَاتٌ`), die App mit ` / ` (`بَقَرٌ / بَقَرَاتٌ`). Betrifft 6 Einträge
   (بَقَرَةٌ, عَيْنٌ, يَدٌ, بَطَّةٌ, بَيْضَةٌ, دَجَاجَةٌ) und ist eine bewusste
   Anzeige-Normalisierung — **kein** Diff, hier nur festgehalten, damit künftige
   Läufe das nicht als Änderung melden.
   Randnotiz zur Quelldatenqualität: arabicroots führt bei لَبَنٌ den Plural als
   `أَلْبَان` ohne Tanwin (erwartbar wäre أَلْبَانٌ). Die App spiegelt das 1:1 —
   nicht eigenmächtig korrigiert, da es eine Quellenfrage ist.

**Schritt 4 – Samsung Notes:** `list_export_status` liefert weiterhin eine **leere
Liste**. Handschrift-Abgleich übersprungen, kein Export erzeugt (in dieser Umgebung
nicht möglich). Ursache ist unverändert die im Goal-Prompt beschriebene: nur eine
der drei PDFs in `G:\1. Workspace\SamsungNotes-Export\` trägt den erwarteten
UUID-Dateinamen, und `export-index.json` stammt vom 22.07. Solange das nicht
korrigiert ist, fällt der Handschrift-Abgleich in **jedem** Lauf aus.

**Schritt 5 – Lernstand (nur Beobachtung, keine Code-Änderung):**
- `get_weak_vocabulary` (<50%) ist weiterhin klar von **bayna-yadayk-2** dominiert,
  gefolgt von bayna-yadayk-1 und madina-2 — also durchweg Bücher, die die App gar
  nicht abdeckt. Das bestätigt die Scope-Entscheidung erneut mit frischen Zahlen.
- Aus dem tatsächlich abgedeckten Bereich (madina-1, Kapitel 1–9) sind nur **6**
  Wörter schwach: مِرْوَحَةٌ (K9, 36%), قَصِيرٌ (K3, 44%), شَرْقٌ (K6, 47%),
  جَالِسٌ (K3, 48%), عُصْفُورٌ (K9, 48%), نَاقَةٌ (K7, 49%). Auffällig: **Kapitel 3
  und Kapitel 9 stellen je zwei davon**, und قَصِيرٌ (165 Versuche) sowie جَالِسٌ
  (130 Versuche) sind echte Dauerbrenner mit sehr hoher Wiederholungszahl, keine
  Ausreißer aus wenigen Durchläufen.
- `get_personal_vocabulary` liefert **11 Einträge — alle 11 sind bereits in
  `vocab-data.js`** (IDs identisch, `chapter: "personal"`). Keine neue eigene
  Vokabel. Vier davon sind gleichzeitig schwach: أَلْمُهَنْدِسٌ (0%), لَحْمٌ (0%),
  إِثْنَانِ (17%), اِسْمٌ مَجْرُورٌ (33%) — bei أَلْمُهَنْدِسٌ und لَحْمٌ **0 von 7
  bzw. 0 von 5** Treffern, also noch nie richtig beantwortet.

**Schritt 6 – QS:** Entfällt. Weder `vocab-data.js` noch `grammar-data.js` wurden
geändert, daher **kein `CACHE_NAME`-Bump** (bleibt v8). Beim Lesen von
`vocab-data.js` wurde trotzdem geprüft: keine doppelten `id`-Werte (149 numerische
IDs streng aufsteigend + 11 eindeutige UUIDs), Datei endet sauber mit `];`.

**Schritt 7 – Commit/Push: NICHT AUSGEFÜHRT (Berechtigung, siehe Schritt 0).**
Dieser Log-Eintrag liegt nur lokal. Die Änderung an `transcripts/backlog.md` wäre
ohnehin nicht committet worden (per `.gitignore` ausgeschlossen).

**GATE-Status:** Der Satz in `Automation\prompts\vokabeltrainer-wartung.md` steht
unverändert — der **PROGRESS-Bug (Goal-Prompt A.1) gilt weiter als nicht behoben**.
In diesem Lauf hatte das keine praktische Auswirkung, weil es nichts einzupflegen gab.

**Vorschläge für die nächste interaktive Session (priorisiert):**
1. **Zuerst: `routines.json` reparieren.** Ohne das committet und pullt *keine* der
   Routinen jemals — der Befund trifft `vokabeltrainer-wartung` und
   `arabicroots-backfill-retry` gleichermaßen, beide nutzen `git -C`. Sauberste
   Variante: die vier Git-Muster durch
   `"Bash(git -C G:\\1. Workspace\\Vokabeltrainer:*)"` ersetzen — eng auf das eine Repo
   begrenzt und passt zum bestehenden Prompt-Wortlaut. Alternativen: `"Bash(git:*)"`
   (bequem, aber weit) oder die Prompts auf ein vorangestelltes `cd` umstellen und
   `Bash(cd:*)` freigeben. Reihenfolge ist wichtig: solange das offen ist, ist jeder
   weitere automatisierte Lauf reine Buchführung ohne Wirkung nach außen.
2. **Danach unverändert: PROGRESS-Bug (A.1) + Lernmodus-Bug (A.2).** Der Wort-Diff
   zeigt, dass die Datenseite für Kapitel 1–9 vollständig und aktuell ist — der
   Engpass ist zu 100% die App-Logik, nicht die Datenbeschaffung. Solange Kapitel
   1–9 komplett sind und keine neuen Kapitel freigeschaltet werden, bringt diese
   Wartungsroutine inhaltlich nichts Neues; die Zeit ist in A.1/A.2 besser investiert.
3. **Klein und lohnend, weil datengetrieben:** die 6 schwachen madina-1-Wörter aus
   Schritt 5 haben durchweg sehr hohe Versuchszahlen. Sobald A.2 gefixt ist, wäre ein
   „Dauerbrenner"-Filter im Lernmodus (Wörter mit vielen Versuchen und <50% Quote
   bevorzugt zeigen) ein sehr billiges Feature mit direktem Nutzen — deutlich
   günstiger als die Kasus-Engine und mit sofort messbarem Effekt.
4. **Nicht dringend:** Samsung-Notes-Export. Der Abgleich fällt zwar bei jedem Lauf
   aus, liefert aber auch bei funktionierendem Export nur Grammatik-Input — und
   Grammatik-Input ist derzeit ohnehin durch die fehlenden Transkripte (Folgen
   03–13) limitiert. Ehrlich priorisiert: erst 1 und 2, danach werden 3 und 4
   relevant.

## 2026-07-27 13:00 – Wöchentliche Wartung (So-Check)

(Zeitangabe = geplanter Slot der Aufgabenplanung; die Routine hat in dieser
Umgebung keinen erlaubten Weg, die Systemuhr zu lesen.)

Ergebnis vorweg: **inhaltlich keine Änderung nötig** — aber der blockierende
Befund des Vormittagslaufs ist behoben, dieser Lauf konnte erstmals wirklich
pullen und committen.

**Schritt 0 – Repo aktualisieren: ERFOLGREICH.** `git pull --ff-only` →
`Already up to date.` Der im 08:04-Eintrag beschriebene Berechtigungs-Blocker
(`git -C <pfad> …` passte auf kein `allowedTools`-Muster) **tritt nicht mehr
auf**: der Prompt schreibt Git-Befehle jetzt schlicht ohne `-C`, und das
Arbeitsverzeichnis ist bereits `G:\1. Workspace\Vokabeltrainer`. Vorschlag 1 des
letzten Laufs ist damit erledigt.

**Schritt 1 – Neue Aufzeichnungen:** `get_recordings` liefert 13 Folgen, höchste
weiterhin **Folge 13 „MB1 Kapitel 9"** (https://youtu.be/17i1khFi7GY,
2026-07-26). Deckt sich exakt mit `transcripts/backlog.md` — **keine neue
Folge**. Nur die Kopfzeile („Zuletzt geprüft") aktualisiert, Tabelle unverändert;
offen bleiben Folgen 03–13. Es wurde **kein** Transkript abgerufen und **keine**
Grammatikregel bestätigt — in dieser Umgebung technisch unmöglich (kein Browser,
kein WebFetch); `get_recordings` liefert nur Metadaten.

**Schritt 2 – Neu freigeschaltete Kapitel:** `get_unlocked_chapters` liefert
`madina-1-chapter-1` bis `-9`, unverändert. `vocab-data.js` deckt Kapitel 1–9
vollständig ab. **Keine neu freigeschalteten Kapitel, nichts einzupflegen.**

**Schritt 3 – Wort-Diff innerhalb Kapitel 1–9 (`get_vocabulary_by_book("madina-1")`):**
Vollständig neu durchgeführt (nicht aus dem Vormittagslauf übernommen): die
arabicroots-Antwort wurde Eintrag für Eintrag gelesen bis Kapitel 10 beginnt,
`vocab-data.js` komplett von Zeile 1 bis `];` gegengelesen.
- arabicroots, Kapitel 1–9: **149 Einträge** (45751–45898 lückenlos + der
  Nachzügler 48402 in Kapitel 9, `vocab_position` 25).
- `vocab-data.js`: **149 Einträge mit `source: "vocabulary"`**, dieselben IDs in
  derselben Reihenfolge, dazu 11 `personal_vocabulary`-Einträge (160 gesamt).
- **Fehlende Wörter: keine (0).**
- **Wörter in der App, die es in arabicroots nicht mehr gibt: keine (0).**
- **Inhaltliche Änderungen (Übersetzung / Plural / Verbformen): keine (0).**
  `german`↔`de`, `plural`↔`pl`, `word_type`↔`type`, `gender`,
  `feminine_singular`↔`femSg`, `feminine_plural`↔`femPl` stimmen bei allen 149
  Paaren überein. Verbfelder in Kapitel 1–9 durchgehend `null` (erster
  Verb-Eintrag in madina-1 ist 45903 أَحَبَّ in Kapitel 11, außerhalb des
  freigeschalteten Bereichs).
- Zusatzbeleg, dass sich quellseitig nichts bewegt hat: alle 149 Einträge tragen
  weiterhin `created_at` vom 2026-05-12.
- Wegen des GATE wären neue Vokabeln ohnehin nicht eingepflegt worden — es gab
  aber schlicht keine. **Die Liste „was einzupflegen wäre, sobald der
  PROGRESS-Bug behoben ist" ist für Kapitel 1–9 weiterhin leer.**

**Schritt 3b – Prüfpunkte für Elias (unverändert, bewusst NICHT angefasst):**
Die drei im 08:04-Eintrag beschriebenen systematischen Abweichungen bestehen
fort und sind erneut bestätigt — es sind Eigenheiten des ursprünglichen Imports,
keine arabicroots-Änderungen: (1) `sg` fehlt bei 23 Einträgen mit echtem
`singular` in der Quelle, echter Ausreißer bleibt لَبَنٌ (`pl: "أَلْبَان"`, aber
`sg: null`) sowie die Gegenprobe مِكْوَاةٌ (`sg` gesetzt, `pl` leer); (2) `root`
fehlt bei 10 Partikeln, deren „Wurzeln" in arabicroots teils maschinell aus den
Buchstaben erzeugt wirken (م ن für مِنْ, ا ن für الآنَ) — weiter **nicht**
übernommen, das wäre gegen E.1; (3) Plural-Trennzeichen `|` (arabicroots) vs.
` / ` (App) bei 6 Einträgen — bewusste Anzeige-Normalisierung, kein Diff.
Neu ergänzt zu Punkt 3: dasselbe ` / `-Muster steht auch bei بَيْتٌ, dort liefert
arabicroots es allerdings schon selbst als `بُيُوتٌ / أَبْيَاتٌ` — die Quelle ist
in der Wahl des Trennzeichens also selbst uneinheitlich. Für das
Validierungsskript (E.2) heißt das: beide Trennzeichen tolerieren, nicht auf eins
normieren wollen.

**Schritt 4 – Samsung Notes:** `list_export_status` liefert weiterhin eine
**leere Liste**. Handschrift-Abgleich übersprungen, kein Export erzeugt (in
dieser Umgebung nicht möglich). Ursache unverändert wie im Goal-Prompt
beschrieben: nur eine der drei PDFs in `G:\1. Workspace\SamsungNotes-Export\` trägt
den erwarteten UUID-Dateinamen, `export-index.json` stammt vom 22.07.

**Schritt 5 – Lernstand (nur Beobachtung, keine Code-Änderung):**
- `get_weak_vocabulary` (<50%) ist weiterhin klar von **bayna-yadayk-2**
  dominiert, gefolgt von bayna-yadayk-1 und madina-2 — durchweg Bücher, die die
  App nicht abdeckt. Bestätigt die Scope-Entscheidung erneut.
- Aus dem abgedeckten Bereich (madina-1, Kapitel 1–9) sind unverändert **6**
  Wörter schwach — und alle sechs haben sehr hohe Versuchszahlen:
  قَصِيرٌ (K3, 44% / 165 Versuche), جَالِسٌ (K3, 48% / 130), شَرْقٌ (K6, 47% / 93),
  نَاقَةٌ (K7, 49% / 80), عُصْفُورٌ (K9, 48% / 56), مِرْوَحَةٌ (K9, 36% / 44).
  Kapitel 3 und Kapitel 9 stellen wieder je zwei davon. Keine Verbesserung
  gegenüber dem Vormittagslauf; مِرْوَحَةٌ wurde zuletzt heute früh (04:44) geübt
  und liegt trotzdem bei 36% — der schwächste Wert im gesamten App-Bestand.
- Zusatzbefund am Rand: **مُفَتِّشٌ** (madina-1, **Kapitel 12**, 44%) taucht
  ebenfalls in der Schwachliste auf. Elias übt auf arabicroots also bereits
  Kapitel über die in der App freigeschalteten 1–9 hinaus. Das ist kein
  Handlungsauftrag für diese Routine (Kapitel 12 ist laut
  `get_unlocked_chapters` nicht freigeschaltet, und das GATE steht), aber ein
  Hinweis, dass die App dem tatsächlichen Lernstand hinterherhängt.
- `get_personal_vocabulary` liefert **11 Einträge — alle 11 bereits in
  `vocab-data.js`** (IDs identisch, `chapter: "personal"`). Keine neue eigene
  Vokabel (jüngster `created_at`: 2026-07-12). Vier davon sind gleichzeitig
  schwach: أَلْمُهَنْدِسٌ (0 von 7), لَحْمٌ (0 von 5), إِثْنَانِ (3 von 18),
  اِسْمٌ مَجْرُورٌ (1 von 3). أَلْمُهَنْدِسٌ und لَحْمٌ wurden **noch nie richtig
  beantwortet**.

**Schritt 6 – QS:** Entfällt inhaltlich. Weder `vocab-data.js` noch
`grammar-data.js` geändert, daher **kein `CACHE_NAME`-Bump** (bleibt v8). Beim
vollständigen Lesen von `vocab-data.js` trotzdem geprüft: keine doppelten
`id`-Werte (149 numerische IDs streng aufsteigend + 11 eindeutige UUIDs), keine
kaputten Anführungszeichen oder Kommas aufgefallen, Datei endet sauber mit `];`.

**Schritt 7 – Commit/Push: AUSGEFÜHRT.** Nur dieser Log-Eintrag; `.gitignore`
bewusst nicht mitcommittet (dort liegt Elias' unabhängige offene Änderung). Die
Änderung an `transcripts/backlog.md` ist per `.gitignore` ausgeschlossen und
bleibt lokal.

**GATE-Status:** Der Satz in `Automation\prompts\vokabeltrainer-wartung.md` steht
unverändert — der **PROGRESS-Bug (Goal-Prompt A.1) gilt weiter als nicht
behoben**. Praktische Auswirkung in diesem Lauf: keine, es gab nichts
einzupflegen.

**Vorschläge für die nächste interaktive Session (priorisiert):**
1. **PROGRESS-Bug (A.1) + Lernmodus-Bug (A.2) — jetzt ohne Ausrede.** Der
   Git-Blocker aus dem Vormittagslauf ist weg, die Datenseite für Kapitel 1–9 ist
   zum zweiten Mal in Folge nachweislich vollständig und aktuell. Der Engpass ist
   zu 100% App-Logik. Solange keine neuen Kapitel freigeschaltet werden, liefert
   diese Wartungsroutine inhaltlich nichts Neues — jede weitere Stunde ist in
   A.1/A.2 besser investiert als hier.
2. **„Dauerbrenner"-Filter im Lernmodus (klein, datengetrieben, direkt nach A.2).**
   Die sechs schwachen madina-1-Wörter haben zusammen **568 Versuche** bei
   durchgehend <50% Trefferquote — قَصِيرٌ allein 165. Ein Filter „viele Versuche
   UND <50% bevorzugt zeigen" ist ein paar Zeilen Code, braucht keine neuen Daten
   und wirkt sofort messbar. Deutlich billiger als die Kasus-Engine (C.1/C.2) und
   der beste Kandidat für „kleiner Gewinn nach den Bugfixes".
3. **Wenn A.1 steht: Kapitel 10–12 nachziehen, bevor die volle Spiegelung
   angegangen wird.** مُفَتِّشٌ aus Kapitel 12 in der Schwachliste zeigt, dass
   Elias auf arabicroots schon weiter ist als die App. Kapitel 10–12 sind
   zusammen nur ~8 Vokabeln (45899–45906) — ein sehr kleiner Schritt, der
   zugleich den **ersten Verb-Eintrag** ins Datenmodell bringt (45903 أَحَبَّ,
   Kapitel 11) und damit die Felder `verb_past`/`verb_present`/
   `verb_imperative`/`verbal_noun` das erste Mal echt testet, bevor madina-2/3
   mit hunderten Verben kommen. Achtung: diese Kapitel sind laut
   `get_unlocked_chapters` **nicht** freigeschaltet — das ist eine bewusste
   Entscheidung für Elias, keine Aufgabe für diese Routine.
4. **Weiterhin nicht dringend: Samsung-Notes-Export.** Der Abgleich fällt in
   jedem Lauf aus, liefert aber auch bei funktionierendem Export nur
   Grammatik-Input — und der ist ohnehin durch die fehlenden Transkripte
   (Folgen 03–13) limitiert. Ehrlich: erst 1 und 2.

## 2026-07-27 – Abschnitt A vollständig behoben (interaktive Session)

Alle sechs Punkte aus [[Vokabeltrainer-Goal-Prompt]] Abschnitt A umgesetzt, dazu
das bisher fehlende Validierungsskript aus E.2. Geändert: `app.js`, `index.html`,
`sw.js`, neu `validate.js`.

**A.1 – PROGRESS-Bug (der wichtigste).** `initProgress()` stieg bei vorhandenem
Speicherstand sofort aus (`if (progress) return progress;`) — Vokabeln, die
später zu `VOCAB_DATA` dazukamen, bekamen dadurch nie einen PROGRESS-Eintrag und
tauchten nie in „Jetzt lernen" auf. Jetzt werden fehlende Einträge bei jedem
Start nachgetragen, ohne bestehenden Fortschritt anzufassen.
*Nachgewiesen:* im Browser 5 Einträge künstlich aus `vt_progress` gelöscht (155
statt 160), neu geladen → alle 5 wieder da, alle 5 in `dueWords()`. Zusätzlich
geprüft, dass eine über das Formular neu angelegte eigene Vokabel sofort einen
Eintrag hat und in „Jetzt lernen" erscheint.

**A.2 – Lernmodus zeigte nur Kapitel 1.** Ursache war nicht der Filter, sondern
die Reihenfolge: `dueWords()` sortierte nur nach Box, und da anfangs alle Wörter
in derselben Box liegen, blieb die `VOCAB_DATA`-Reihenfolge erhalten — die ersten
20 Karten waren damit immer Kapitel 1. Jetzt wird vor dem Sortieren gemischt
(Fisher-Yates) und anschließend **stabil** nach Box sortiert: die
Leitner-Priorität bleibt erhalten, innerhalb einer Box ist die Reihenfolge
zufällig. `weakWords()` (Modus „nur falsche") genauso.
*Nachgewiesen:* 5 Sitzungen hintereinander gestartet, jede enthielt 4–5
verschiedene Kapitel, und die Zusammensetzung unterschied sich zwischen den
Läufen.

**A.3 – Karten-Flip-Spoiler.** Beim Wechsel zur nächsten Vokabel wurde nur die
Klasse `flipped` entfernt — die Karte drehte sichtbar zurück, und weil der neue
Inhalt zu dem Zeitpunkt schon gesetzt war, blitzte dabei die Rückseite der
*nächsten* Karte auf. Jetzt werden die Übergänge vor dem Zurücksetzen abgeschaltet,
der Zustand per Reflow festgeschrieben und erst danach wieder freigegeben. Dabei
auch die Reihenfolge korrigiert: vorher wurde `transform` zurückgesetzt, während
die Swipe-Transition noch aktiv war.
*Nachgewiesen:* Karte umgedreht, Drehung vollständig abgewartet
(`matrix3d(-1,…)` = rotateY(180°)), dann `renderCard()` → Transform sofort und
eine Frame später `none`. Gegenprobe mit dem alten, naiven Weg steht direkt danach
noch bei rotateY(180°), würde also sichtbar zurückdrehen.

**A.4 – Plural-Anzeige zu klein.** War `.85rem` in arabischer Schrift, inklusive
des deutschen Labels „Plural:" — das lief mit in RTL-Richtung. Label und Form sind
jetzt getrennt: Label klein und lateinisch (11,2 px, Inter), die arabische Form
groß (24,8 px statt vorher 13,6 px).
*Nachgewiesen:* an طَبِيبٌ mit allen drei Formen gemessen; alle Chips passen in die
420 px breite Karte, Umbruch aktiv.

**A.5 – `lang="ar"` blieb am deutschen Kartentext hängen.** Im Zweig `ar-de` wurde
nur `dir` entfernt, `lang` nicht — nach einem `de-ar`-Durchgang stand am deutschen
Text weiterhin `lang="ar"`, was Schriftwahl und Sprachausgabe verfälscht. Jetzt
werden `lang` und `dir` auf beiden Seiten in beiden Zweigen explizit gesetzt.
*Nachgewiesen:* Richtung umgeschaltet und zurück; Rückseite trägt danach
`lang="de"` / `dir="ltr"` beim deutschen Text.

**A.6 – Kapitelnamen 2 und 9.** Beide waren Platzhalter („Kapitel 2" / „Kapitel 9").
Nichts geraten: Kapitel 2 heißt jetzt **ذَلِكَ (jenes)** — belegt durch
`grammar-data.js`, Regel `ismul-isara-dhalika-01` mit `source.chapter: 2` aus
Folge 02. Für Kapitel 9 existiert noch keine kuratierte Regel (Folge 13 ist
unverarbeitet), deshalb wurde der Name wie schon bei Kapitel 8 („Länder") aus dem
tatsächlichen Wortschatz abgeleitet: **Sprachen & Eigenschaften**
(عَرَبِيَّةٌ, إِنْجِلِيزِيَّةٌ, لُغَةٌ, سَهْلٌ, صَعْبٌ, مُجْتَهِدٌ, مَشْهُورٌ).
Sobald Folge 13 ausgewertet ist, kann der Name auf das Grammatikthema umgestellt
werden. Der Grund für die Namenswahl steht als Kommentar über `CHAPTER_NAMES`.

**E.2 – Validierungsskript (neu: `validate.js`).** Läuft mit `node validate.js`,
ohne Abhängigkeiten, Exitcode 1 bei Fehlern. Prüft: doppelte Vokabel-IDs,
Pflichtfelder, Kapitel im gültigen Bereich, Box 1–5, Quran-Referenzen vollständig,
Platzhalter in `CHAPTER_NAMES`, doppelte Regel-IDs, Quellenpflicht aus E.1,
`SENTENCE_TAGS` in beide Richtungen (Vokabel existiert, Regel existiert, `matchText`
kommt im Satz wirklich vor), 114 Suren mit eindeutigen IDs, `QURAN_FREQ`-Struktur
inkl. Sura-Bereich 1–114, Existenz aller in `index.html` und `sw.js` referenzierten
Dateien, und gültiges JSON in `manifest.json`.
*Nicht nur „läuft durch", sondern gegengeprüft:* mit absichtlich kaputten Daten
(doppelte ID, leeres `de`, Kapitel 99, toter Tag-Verweis) getestet — alle vier
Fehlerklassen wurden gemeldet, Exitcode 1, danach sauber zurückgesetzt.
Aktueller Lauf: 160 Vokabeln / 160 eindeutige IDs, 5 Regeln, 3 Markierungen,
114 Suren, 92 Wurzeln — alles sauber.

**E.6 – Regressionstest.** Gegen einen lokalen Server im echten Browser
durchgespielt, nicht nur überflogen: Home (160 fällig, 5 Boxen, 11 Kapitel-Chips),
Lernen (Karte, Umdrehen, Richtig stuft Box hoch, Falsch setzt auf Box 1 zurück,
Zähler läuft), Kategorien (10 Kapitel, 10 Wurzelgruppen, 160 Pool-Wörter),
Wortliste inkl. Box-Drilldown, Satz-Modus (Blättern, Grammatik-Markierung und
Popover mit Quellenangabe), Quran-Bezug (13 Vokabeln), Quran lesen (114 Suren,
Suche, Al-Fatiha live von quran.com mit 7 Versen, Hifz-Häkchen), Statistik
(4 Kacheln, 5 Balken), Einstellungen, PWA (Manifest + Service-Worker-Registrierung).
Zusätzlich Kapitelfilter (nur Kapitel 3 → 25 Wörter) und „nur falsche" geprüft.

**Sonstiges:** `CACHE_NAME` in `sw.js` auf **v9** erhöht (app.js und index.html
geändert). `.gitignore` bewusst nicht mitcommittet — dort liegt Elias' eigene
offene Änderung.

**Korrektur zum vorigen Eintrag (13:00, Schritt 5, dritter Punkt):** Dort steht,
مُفَتِّشٌ aus Kapitel 12 in der Schwachliste zeige, dass Elias schon über die
freigeschalteten Kapitel hinaus übt. **Das stimmt nicht.** Elias hat am 27.07.
bestätigt, dass ihm diese Wörter nicht bekannt sind — die Versuche aus
bayna-yadayk-1/2, madina-2 und madina-1 Kapitel 12 sind seinem arabicroots-Konto
offenbar falsch zugeordnet. Damit ist auch **Vorschlag 2 des vorigen Eintrags (der
„Dauerbrenner"-Filter) hinfällig**: er würde Wörter priorisieren, die gar nicht
seinem Lernstand entsprechen. Konsequenzen und der offene Klärungspunkt stehen in
[[Vokabeltrainer-Goal-Prompt]], Abschnitt Scope-Entscheidung.

**Nächster sinnvoller Schritt:** Abschnitt F.2 des Goal-Prompts — der
Design-/Animations-Pass (E.8) über alle Screens, bevor die großen Features aus
Abschnitt C draufgesetzt werden. Zwei Dinge sprechen dafür, ihn jetzt zu machen:
die Bugfix-Basis ist frisch regressionsgetestet, und `app.js` ist mit 880 Zeilen
noch übersichtlich genug, dass die in E.7 geforderte Modularisierung im selben
Zug sauber gelingt statt später gegen mehr Code. Aus Abschnitt B liegen zwei
kleine, konkrete Punkte bereit, die gut dazu passen: Swipe-Gesten überall
sicherstellen, wo es Richtig/Falsch-Karten gibt, und im Satz-Modus ein Knopf für
einen anderen Beispielsatz.

## 2026-07-27 – Design-/Animations-Pass über alle Screens (E.8, interaktive Session)

Kompletter visueller Pass gemäß Goal-Prompt E.8. Geändert: `index.html`
(CSS-Schicht neu aufgebaut), `app.js` (generiertes Markup + Mikro-Interaktionen),
`sw.js` (CACHE_NAME v10), `style.css` **gelöscht** (E.7: toter Code seit dem
Inline-CSS-Fix vom 24.07., wurde nirgends mehr geladen).

**Design-System statt Insel-Lösungen — was konkret neu ist:**
- **Design-Tokens** als eine Quelle für alles: Flächen (`--surface-1..4` statt
  wild gemischter Grautöne), Abstände (`--sp-1..8`), Radien (`--r-1..5`),
  Schatten (`--sh-1..3`), Schriftgrößen (`--fs-xs..2xl`) und **Bewegung**
  (`--dur-1..4` + drei Easing-Kurven, u.a. eine Feder-Kurve für Schalter,
  Nav-Indikator und Popover). Regel im Code dokumentiert: keine losen px-Werte
  mehr in Komponenten.
- **Ein SVG-Icon-Set** (20 Symbole, ein Strichstil, 24er-Raster) ersetzt die
  Emoji überall — Kacheln, Nav, Buttons, Badges, Popover, Streak-Flamme.
  Emoji sahen je nach Gerät verschieden aus und waren der deutlichste
  Prototyp-Look. Nachgemessen: 0 Emoji-Reste in interaktiven Elementen,
  37 Sprite-Icons in Verwendung. Icons sind `pointer-events:none`, damit
  Klick-Prüfungen auf `e.target` weiter funktionieren.
- **Durchgängige Interaktions-Muster:** einheitliches Druckfeedback auf allem
  Antippbaren, Hover-Zustände, gestaffeltes Erscheinen von Listen (`.stagger`,
  bewusst nur die ersten ~9 Einträge verzögert), Screen-Übergang mit dezentem
  Hochgleiten, Bottom-Nav mit Feder-Indikator, Toast mit Feder-Einflug,
  Popover-Auf/Abgang, Drag-Ghost im Akzentverlauf.
- **Antwort-Feedback im Lernmodus:** kurzes grünes/rotes Aufleuchten des
  Kartenrahmens vor der nächsten Karte (210 ms, bremst den Fluss nicht).
  Dabei einen echten Robustheitsgewinn eingebaut: `answer()` ist jetzt gegen
  Doppelauslösung geschützt — zwei schnelle Klicks überspringen keine Karte
  mehr (nachgemessen).
- **Zahlen zählen hoch** (Home-Fälligkeit, alle vier Statistik-Kacheln),
  **Box-Balken wachsen** von 0 auf ihren Wert, **Streak-Badge pulst** beim
  Erhöhen.
- **Lade-/Leerzustände vereinheitlicht:** Skeleton-Platzhalter in Versform beim
  Quran-Laden (statt nackter Textzeile), eine `empty-state`-Klasse für alle
  „nichts da"-Fälle (statt Inline-Styles pro Screen). Quran-Bezug-Liste von
  Inline-Styles auf Klassen umgestellt.
- **Zugänglichkeit:** `prefers-reduced-motion` wird überall respektiert (CSS
  global + alle JS-Animationen), `:focus-visible`-Ringe, `aria-label` auf allen
  Icon-Buttons.

**Echter Bug, den der Pass gefunden hat:** Die neuen Zahl-/Balken-Animationen
hingen an `requestAnimationFrame` — das feuert bei unsichtbarer Seite nicht
(Hintergrund-Tab, abgedecktes PWA-Fenster). Die Statistik hätte dann dauerhaft
0 gezeigt. Fix: bei `document.hidden` (und reduzierter Bewegung) wird der
Endwert sofort gesetzt; der korrekte Wert hängt nie von einer Animation ab.
Im versteckten Browser-Pane real reproduziert und nach dem Fix verifiziert
(160/36/67 %/Balken 4-42 % trotz unsichtbarer Seite).

**Regressionstest (E.6), alle neun Bereiche im Browser:** Home (5 Boxen,
11 Chips, 5 Kacheln), Lernen (20 Karten, 5 Kapitel gemischt, Feedback-Klasse
kommt und geht, Weiterschalten, Doppelklickschutz), Kategorien (10/10/160,
Reiterwechsel), Wortliste (Kapitel 3 → 25), Satz-Modus (Blättern,
Grammatik-Markierung, Popover mit Quellenzeile), Quran-Bezug (13 Einträge,
keine Inline-Styles mehr), Quran lesen (114 Suren, Skeleton während des Ladens,
Al-Ikhlas mit 4 Versen live), Statistik (Zahlen + Balken korrekt), Einstellungen
(alle Schalter/Selects), PWA (Manifest + SW). Keine Laufzeitfehler in der
Konsole. `validate.js` sauber, Exit 0.

**Bewusst NICHT in diesem Pass:** die Modularisierung von `app.js` (E.7).
Ehrlich begründet: der Pass hat `index.html` komplett neu geschrieben und
`app.js` an ~15 Stellen angefasst — beides gleichzeitig mit einem Datei-Split
hätte die Regressionsfläche unnötig vergrößert. Die Datei ist mit ~950 Zeilen
weiter überschaubar; der Split ist der erste Schritt, BEVOR ein Feature aus
Abschnitt C begonnen wird (so verlangt es E.7 ohnehin).

**Nächster sinnvoller Schritt:** Die zwei kleinen UI-Punkte aus Abschnitt B
(Swipe überall, wo Richtig/Falsch existiert; Knopf für anderen Beispielsatz im
Satz-Modus) — beide profitieren direkt vom neuen Motion-System. Danach als
eigener Block: `app.js` in Module aufteilen (E.7) und erst dann C.1/C.2
(Kasus-Engine) beginnen.

## 2026-07-27 – Zurück-Navigation, neues Logo, zwei Layout-Fixes

Alles auf Elias' Meldungen am Gerät zurückgehend, nicht aus einer Routine.

**BUG (von Elias gemeldet): Zurück-Taste warf aus der Lernrunde bzw. aus der App.**
Sein Ablauf: mitten in einer Runde in die Einstellungen wechseln, dann zurück.
Mit dem App-Pfeil landete er auf der Startseite, die Runde war weg; mit der
Zurück-Taste des Handys verließ er die App komplett.

Ursache war für beide Symptome dieselbe: **die App führte überhaupt keine
Navigationshistorie.** `showScreen()` schaltete nur CSS-Klassen um, der Browser
kannte nur einen einzigen Zustand. Für die Gerätetaste bedeutete „zurück"
deshalb „Seite verlassen", und der App-Pfeil war fest auf `data-nav="home"`
verdrahtet statt auf „einen Schritt zurück".

Behoben durch eine echte Historie:
- Jeder Bildschirmwechsel legt einen `history.pushState`-Eintrag mit Tiefenzähler
  an; ein `popstate`-Empfänger navigiert innerhalb der App statt sie zu verlassen.
- Alle Zurück-Pfeile in den Kopfzeilen nutzen jetzt `data-back` und gehen einen
  echten Schritt zurück, statt stur zur Startseite zu springen.
- Der Lernbildschirm setzt eine laufende Runde an derselben Karte fort, statt sie
  neu zu starten. Dafür trägt `SESSION` jetzt ein `fertig`-Kennzeichen.
- Das X im Lernbildschirm beendet die Runde bewusst — danach startet „Lernen"
  wieder von vorn. Eine beendete Runde ersetzt ihren Historieneintrag, damit die
  Zurück-Taste nicht auf einer Runde landet, die es nicht mehr gibt.
- Gleiches Verhalten im Quran-Reader: die Versliste ist eine eigene Ebene, erst
  danach verlässt man den Bildschirm.

*Gemessen nachgewiesen:* Runde starten → zwei Karten beantworten → Einstellungen →
zurück (einmal per App-Pfeil, einmal per `history.back()` wie die Hardware-Taste)
→ beide Male zurück im Lernbildschirm, Position 2, identische Karte, App nicht
verlassen. Dazu Mehrfach-Verschachtelung (Home → Kategorien → Wortliste → zweimal
zurück, Tiefenzähler 2→1→0), beendete Runde (Zurück führt nicht auf eine tote
Runde), X beendet wirklich, und Fortsetzen nach einem Abstecher in die Statistik.

**Neues App-Icon: عِلْم („Wissen") in Amiri.**
Das alte Icon war ein `<text>`-Element mit `font-family="Amiri"` — ohne
eingebettete Schrift, also auf jedem Gerät ohne diese Schrift ein anderer
Buchstabe. Das neue besteht aus reinen Vektorpfaden.

Technisch interessant: Arabische Buchstaben ändern je nach Position ihre Form.
Statt eine Shaping-Engine zu brauchen, greifen die Pfade direkt auf die
Unicode-Presentation-Forms (U+FE70–FEFF) zu, wo jede Position einen eigenen
Codepoint hat; mit den echten Vorschubbreiten aus der `hmtx`-Tabelle
nebeneinandergesetzt verbinden sich die Buchstaben korrekt. Der TTF-Parser dafür
liegt im Scratchpad, nicht im Repo — im Repo landen nur die fertigen Pfade.

Die Wortwahl ist kein Zufall: عِلْم ist gleichzeitig die Wurzel ع-ل-م, die in
تَعَلَّمْ steckt und die die App als Wortstämme-Ansicht schon abbildet.

Zwei Dateien statt einer: `icon.svg` ist rund mit durchsichtigen Ecken (purpose
`any`), `icon-maskable.svg` vollflächig (purpose `maskable`), weil Launcher dort
selbst eine Form ausschneiden und Löcher in den Ecken sonst sichtbar wären. Die
Wortgröße ist nicht geschätzt, sondern aus dem tatsächlich äußersten Punkt der
Buchstaben berechnet: exakt Radius 205, die Sicherheitszone maskierbarer Icons.

**Layout-Fix 1 (von Elias gemeldet): Quran-Badge hing neben der Karte.**
Auf 575 px stand „241× im Quran" 44 px rechts *neben* der Lernkarte. `.card-stage`
spannte die volle Breite, die Karte ist aber auf 420 px begrenzt und zentriert —
absolut positionierte Kinder richteten sich deshalb am Bildschirm aus. Bühne auf
Kartenbreite begrenzt; gemessen bei 575 und 360 px sitzt das Badge jetzt 12 px
innerhalb der Kartenkante, kein Querüberstand auf irgendeinem Screen.

**Layout-Fix 2 (von Elias gemeldet): Streak-Badge nicht zentriert.**
Zwei getrennte Ursachen. Senkrecht: die Textzeile war höher als die Glyphe, das
SVG daneben nicht — `line-height:1` gesetzt, und die Flamme als Strich-Icon neu
gezeichnet (sie war als einzige gefüllt und überlagerte sich zu einem Klumpen).
Waagerecht: `justify-content:space-between` verteilt nach Inhaltsbreite, und der
Schriftzug links ist mit 116 px fast dreimal so breit wie das Zahnrad rechts —
das Badge saß 38 px rechts der Mitte. Kopfzeile auf ein Dreispalten-Raster
umgestellt, Abweichung jetzt 0 bei 360 und 575 px.

`validate.js` sauber (prüft mit, dass die neue Icon-Datei existiert),
`CACHE_NAME` auf v12.

**Nächster sinnvoller Schritt:** unverändert Abschnitt B (Swipe überall,
Beispielsatz-Knopf), danach E.7. Offen aus dieser Session: die Wortmarke
طالِب العِلْم für den App-Kopf ist gebaut, aber noch nicht eingebaut — Elias hat
bisher nur über das Icon entschieden.

## 2026-07-28 – Nachtschicht/Vormittag (interaktiv, nicht die Routine)

Sechs Commits, alle gepusht und live geprüft. `CACHE_NAME` steht bei **v38**.

| Commit | Inhalt |
|---|---|
| `8645b97` | 26 Beispielsätze aus Madina Buch 1 → 71 von 73 Regeln in der App erreichbar (vorher 51) |
| `2ed3c40` | alle acht Lehrwerke, 4433 Vokabeln, nachgeladen pro Buch |
| `597cb92` | `pruefe-transkripte.js` — jede Regel gegen zwei unabhängige Tonspur-Lesarten |
| `702adf4` | I'rab-Erklärer (`js/irab.js`) + `pruefe-saetze.js` |
| `cff3b35` | Quran-Vorkommen für 1038 Wurzeln statt 92 |
| `9a804b3` | Vers-Hifz: einzelne Verse abhaken, Selbsttest durch Verdecken |
| `48283b3` | Hörverstehen-Modus |
| `dbfc712` | App kommt ohne die Buchdateien aus; Abzug bleibt vorerst lokal |

**Für künftige Wartungsläufe wichtig — drei Dinge haben sich grundlegend
geändert:**

1. **`vocab-data.js` ist kein Vokabelspeicher mehr**, sondern die
   Anreicherungsschicht (Beispielsätze + Quran-Belege zu Madina 1, Kap. 1–9).
   Die eigentlichen Vokabeln stehen in `data/vokabeln-<buch>.js`, erzeugt von
   `node werkzeuge/hole-vokabeln.mjs`. **`vocab-data.js` niemals aus dem Abzug
   neu erzeugen** — die Sätze wären weg.
2. **`data/vokabeln-*.js` ist per `.gitignore` ausgeschlossen.** Es sind die
   Daten aus Elias' bezahltem arabicroots-Zugang, und das Repo ist öffentlich;
   die Entscheidung steht bei ihm. Die App kommt ohne die Dateien zurecht: sie
   blendet die Buchauswahl aus und arbeitet mit Madina 1, Kap. 1–9 weiter.
3. **Der Service Worker liefert Netz zuerst** (vorher Cache zuerst). Das
   Ritual „SW abmelden und Caches leeren vor jedem Test" ist damit erledigt.
   Einmalig gilt noch: der erste Aufruf nach dem Update kommt aus dem alten
   Cache, ein zweiter Aufruf zeigt den neuen Stand.

**Vier Prüfskripte laufen jetzt zusätzlich zu `validate.js`** und sind in
`routines.json` freigeschaltet: `pruefe-markierungen.js` (Pflicht nach jeder
Änderung an `SENTENCE_TAGS`), `pruefe-saetze.js`, `pruefe-transkripte.js`,
`pruefe-sprecher.js`. Aktueller Stand: 0 Verstöße gegen die Regelbedingung,
0 Wortgrenzen-Fehler, 0 Überschneidungen, 0 Kasusfehler in 155 Beispielsätzen
und in den 26 Lehrbuchsätzen der Kontrollgruppe.

**Nebenbefund:** Die arabicroots-Datenbank führt **keine Beispielsätze und
keine Quranverse** — die Felder gibt es dort nicht. Die 155 Sätze in der App
sind also verfasst, nicht belegt. Sie sind aber kasusgeprüft (0 Fehler); was
ihnen fehlt, ist die Quelle, nicht die Grammatik.

## 2026-07-28 – Nachmittag: Lernstrategie-Ideen umgesetzt

Weiter aus der Ideenliste in `Vokabeltrainer-Generalcheck.md` (Goal-Prompt G
verlangt eigene Vorschläge, nicht nur Abarbeiten):

| Idee | Stand |
|---|---|
| 1 Abgestufte Selbsteinschätzung | ✅ `c39ceab` — vier Stufen, mit Vorschau wann die Karte wiederkommt |
| 2 Lücken-Test im Satz-Modus | ✅ `f7d07f1` — 170 von 186 Sätzen haben ein eindeutiges Zielwort |
| 6 Hör-Modus ohne Schrift | ✅ `48283b3` |
| 7 Fällige Karten nach Vergessens-Nähe | ✅ `83fea64` |
| 8 Eigene Eselsbrücke | ✅ `3a758ef` (27./28.07.) |
| 9 Streak mit Gnadentag | ✅ `83fea64` |

### Drei Vorschläge, die NICHT umgesetzt wurden — mit Begründung

**Idee 3, Verwechslungs-Duelle (Minimalpaare).** Wäre der stärkste verbliebene
Hebel und ist mechanisch ableitbar: 285 Skelette in Elias' Wortschatz haben
mehrere Vokalisierungen (رَجُلٌ/رِجْلٌ, وَضَعَ/وَضْعٌ, فَعَلَ/فِعْلٌ), davon betreffen 55
Wörter aus Madina 1. **Blockiert:** Die Paare entstehen erst aus dem vollen
Vokabelabzug, und der liegt wegen der offenen Push-Frage nicht im Repo. Mit
nur `vocab-data.js` (160 Wörter) gäbe es praktisch keine Paare — der Modus
wäre live leer. Sobald Elias entschieden hat, ist das ein halber Arbeitstag.

**Idee 4, Wurzelfamilien als aktiver Modus.** Laut Generalcheck der größte
ungenutzte Hebel. Hängt an derselben Frage: mit 160 Wörtern sind die
Wurzelfamilien zu dünn, mit 4433 tragen sie.

**Idee 5, Produktion statt Wiedererkennung ab Box 4.** Tippen statt Umdrehen —
technisch machbar (die Eingabelogik gibt es seit dem Lückentext). Bewusst
zurückgestellt: das ändert den Kernablauf des Lernens ein zweites Mal am
selben Tag, nachdem schon die vier Antwortstufen dazugekommen sind. Erst
sehen, wie sich die Stufen anfühlen.

### Zum Stand der Prüfwerkzeuge

`pruefe-oberflaeche.js` ist neu (`502f907`) und prüft 28 Punkte, inklusive der
vier Antwortstufen aus allen fünf Boxen. Aufruf in der Browserkonsole:

```
fetch('pruefe-oberflaeche.js').then(r=>r.text()).then(eval)
```

---

## 28.07.2026 (Fortsetzung) — Zweiter Whisper-Durchlauf, Abgleich abgeschlossen

Der vollständige zweite Durchlauf über alle 13 Folgen (10,2 h Ton, whisper-cli
large-v3-turbo, greedy) ist durch. Jede SRT-Datei reicht bis auf wenige
Sekunden an das Ende ihrer Tonspur heran — nichts wurde abgeschnitten.
Gegengeprüft an den Endzeiten aus der Sprechertrennung.

### Ergebnis des Drei-Spuren-Abgleichs (Fenster ±180 s)

| | Regeln |
|---|---|
| von **beiden** Lesarten belegt | 62 |
| nur vom eigenen Whisper-Lauf belegt | 9 |
| nur von den YouTube-Untertiteln | 0 |
| von keiner Lesart gefunden | 0 |
| maschinell unsichtbar, von Hand nachgelesen | 2 |
| **insgesamt belegt** | **73 von 73** |

Die neun, die nur der eigene Durchlauf belegt, sind genau der Fall, für den er
gemacht wurde: YouTube verstümmelt die arabischen Fachbegriffe.

### Drei Fehler im Abgleichskript, gefunden durch Nachlesen im Volltext

Der Lauf meldete zunächst vier unbelegte Regeln. Alle vier waren im Transkript
wörtlich vorhanden — es lag jedes Mal am Sucher, nicht am Beleg:

1. **Verdopplung.** Die arabische Schrift schreibt die Verdopplung als Schadda
   über *einen* Buchstaben (رَبِّي), die Umschrift schreibt sie aus: „Rabbi".
   Das Muster suchte r-b-y und fand r-b-b-i nie. Betraf nicht nur `possessiv-ya-01`:
   auch **محمد wurde nie gefunden** — weder „Muhammad" noch „Mohammed", nur das
   falsch geschriebene „Muhamad". Konsonanten dürfen jetzt doppelt stehen.
2. **Vorangestelltes Ein-Buchstaben-Wort.** Der Lehrer spricht „Li Muhammadin"
   als zwei Wörter, geschrieben wird لِمُحَمَّدٍ. Genau eine Lücke im Muster —
   die hinter لِ بِ كَ وَ فَ bzw. hinter dem Artikel الـ — darf jetzt ein
   Leerzeichen enthalten. Nur dort: ein global erlaubtes Leerzeichen würde ein
   Muster über drei deutsche Wörter hinweg zusammensuchen. An einer
   Kontrollgruppe aus deutschem Fließtext geprüft, kein einziger Fehlalarm.
3. **Zu kurze Kernform wurde nur gezählt, nie genannt.** `fragepartikel-alif-01`
   (Kernform هل, zwei Buchstaben) stand als Zahl im Bericht, ohne dass die Regel
   dahinter je sichtbar wurde. Jetzt wird sie aufgeführt.

Beide verbliebenen Regeln sind von Hand nachgelesen und in
`transcripts/quellen/handgepruefte-regeln.json` mit Fundstelle festgehalten,
damit sie nicht bei jedem Lauf erneut als unbelegt erscheinen. Bei
`ismul-isara-dhalika-01` hilft kein Umschriftmuster mehr: Whisper bildet die
arabischen Wörter dort auf deutsche ab — ذَلِكَ wird durchgängig „Välika",
هَذَا wird „Herde". ذ zusätzlich auf v/w abzubilden wurde geprüft und
**verworfen**: dann treffen die deutschen Wörter „Volk" und „Wolke" das Muster.
Ein Fehlalarm wäre hier schlimmer als eine Lücke — er würde eine Regel als
belegt ausweisen, die es nicht ist.

### Ein Verdacht, der sich nicht bestätigt hat

Auffällig war, dass **keine einzige Regel auf Folge 6 zeigt** und nur eine auf
Folge 11, obwohl beide dicht mit Fachbegriffen sind (Folge 6: 19,2 Treffer je
1000 Wörter gegenüber 6,3 in Folge 1, die acht Regeln trägt). Das sah nach einer
Lücke beim Ableiten aus. Beide Folgen im Volltext nachgelesen: **es ist keine.**
Folge 6 ist eine reine Wiederholungs- und Ermahnungsstunde und endet mit „wir
machen für heute nicht weiter"; Folge 11 ist Hausaufgabenkontrolle zu Kapitel
6/7, deren grammatische Punkte alle schon als Regeln stehen.

Die Kennzahl trog, weil Begriffsdichte misst, wie viel Fachvokabular
*gesprochen* wird — und in einer Abfragestunde ist das genau deshalb hoch. Sie
schlägt dort am stärksten aus, wo am wenigsten zu holen ist. Verteilungen zu
zählen bleibt richtig, um Lücken zu suchen (so wurde der هَذَا-Fehler im I'rab
gefunden), aber jeder so gefundene Verdacht muss am Volltext geprüft werden,
bevor man ihn glaubt.

## 29.07.2026 — Ein Werkzeug statt eines Umbaus: `werkzeuge/vers.mjs`

`quran-text.js` ist 2,3 MB gross und kostet beim vollstaendigen Einlesen rund
635.000 Tokens. Ueberlegt wurde deshalb, sie in 114 Einzeldateien je Sure zu
zerlegen, damit niemand mehr aus Versehen alles liest.

**Verworfen, und zwar wegen des Offline-Betriebs.** Heute cacht `sw.js` genau
eine Datei vorab. Scheitert das, fehlt der Quran ganz und man merkt es sofort.
Bei 114 Dateien wuerde daraus ein **stiller Teilausfall**: Der Worker nutzt
`Promise.allSettled` und schreibt bei einzelnen Fehlschlaegen nur eine
Konsolenwarnung. Man merkt nichts, bis unterwegs eine Sure leer bleibt — genau
in der Lage, fuer die die Datei ueberhaupt angelegt wurde. Dazu haette der Lader
in `js/quran.js` (Z. 88–99) von „einmal laden, fertig" auf Zustandsverwaltung je
Sure umgebaut werden muessen.

**Die Groesse war fuer die App nie ein Problem** — 2,3 MB sind fuer eine PWA
normal, gehostet gehen davon rund 0,63 MB ueber die Leitung. Das Problem lag
ausschliesslich im Werkzeug drumherum. Also wurde das Werkzeug geaendert.

`werkzeuge/vers.mjs` liest die Datei selbst und gibt nur das Verlangte aus:

    node werkzeuge/vers.mjs 2:255            ein Vers
    node werkzeuge/vers.mjs 2:255-257        ein Bereich
    node werkzeuge/vers.mjs 112              kurze Sure ganz (ab 21 Versen --alles noetig)
    node werkzeuge/vers.mjs --suche "هذا"    im Text suchen, --max fuer mehr Treffer

Die Suche vergleicht **ohne Vokalzeichen** und vereinheitlicht Alif-Varianten
sowie Ta marbuta — noetig, weil der Uthmani-Text durchgehend vokalisiert ist und
eine Suche nach هذا sonst nichts faende. Gemessen: 208 Fundstellen, darunter
هَٰذَا und بِهَٰذَا. Der deutsche Text wird mitdurchsucht. Umschrift trifft sie
bewusst nicht — „hada" liefert nur deutsche Treffer, alles andere waere geraten.

Geprueft: Einzelvers, Bereich, Suche, der Schutz vor Riesenausgabe (Sure 2 mit
286 Versen bricht mit Hinweis ab) und der Fehlerfall (Sure 115 existiert nicht).

**Der eigentliche Gewinn ist struktureller Art.** Die Regel „grosse Dateien
nicht in Subagenten einlesen" steht seit dem Vorfall mit 4,16 Mio. Tokens in
`CLAUDE.md` — aber Regeln, die auf Disziplin beruhen, werden irgendwann
uebergangen. Wer den Vers bequem einzeln bekommt, oeffnet die grosse Datei gar
nicht erst. Der Aufruf steht jetzt in `CLAUDE.md` und ist **ausdruecklich auch
fuer Subagenten freigegeben**, weil die Ausgabe klein bleibt, egal wie gross die
Quelle ist.

Nebenbei berichtigt: Die Kopfzeile von `surah-data.js` behauptete noch
„Verstext wird live von quran.com API geladen". Das stimmt seit dem 27./28.07.
nicht mehr — quran.com ist nur noch Rueckfallebene.

## 2026-08-02 13:16 – Wöchentliche Wartung (So-Check)

Ergebnis vorweg: **eine einzige echte Neuigkeit — Folge 14 ist erschienen.**
Sonst nichts zu tun: Vokabelabzug unverändert, Vokabelpaket unverändert, alle
sieben Prüfskripte ohne neuen Befund. Am Code wurde nichts geändert, `CACHE_NAME`
bleibt bei **v85**.

**Schritt 0 – Repo aktualisieren:** `git pull --ff-only` → `Already up to date.`
Arbeitsverzeichnis sauber (`git status --short` leer).

**Schritt 1 – Neue Aufzeichnungen: 🆕 Folge 14.** `get_recordings` liefert jetzt
**14** statt 13 Einträge. Neu:

| Folge | Titel | URL | eingestellt |
|---|---|---|---|
| 14 | Folge 14 \| MB1 Kapitel 9 (B) | https://youtu.be/5c9ckLbGvas | 2026-08-02, 09:56 UTC |

In `transcripts/backlog.md` nachgetragen (Tabellenzeile + Hinweis, dass der Satz
„alle 13 Folgen sind ausgewertet" damit nicht mehr vollständig ist). Der Ordner
ist per `.gitignore` ausgeschlossen — kein Commit daraus. **Es wurde kein
Transkript abgerufen und keine Regel bestätigt**; das Nachziehen macht die
Routine `arabicroots-backfill-retry` (eine Folge pro Lauf). Folge 14 ist damit
die erste offene Folge seit dem 27.07.

**Schritt 2 – Vokabelabzug (`node werkzeuge/hole-vokabeln.mjs`):** 4433 Einträge,
**Zahl je Buch identisch mit dem letzten Lauf**, keine einzige Abweichung:

| Buch | Vokabeln | Kapitel | KB | Δ zum letzten Lauf |
|---|---|---|---|---|
| bayna-yadayk-1 | 231 | 17 | 90 | – |
| bayna-yadayk-2 | 552 | 17 | 216 | – |
| bayna-yadayk-3 | 445 | 17 | 174 | – |
| bayna-yadayk-4 | 881 | 16 | 344 | – |
| madina-1 | 298 | 24 | 112 | – |
| madina-2 | 445 | 29 | 169 | – |
| madina-3 | 1238 | 35 | 484 | – |
| quran | 343 | 23 | 122 | – |

`data/buecher.js` blieb dadurch unverändert (nach dem Lauf steht `git status`
weiter auf leer) — es gibt also nichts zu committen.

**Vokabelpaket (`node werkzeuge/baue-vokabelpaket.mjs`):** 8 Bücher, 4433
Vokabeln, 1382 KB → **`UNVERAENDERT` — dasselbe Paket wie beim letzten Lauf.**
Kein Handlungsbedarf, Elias muss auf seinen Geräten nichts neu einlesen.

`get_unlocked_chapters`: `madina-1-chapter-1` bis `-9`, **unverändert seit dem
27.07.** Der Kurs steht also weiter bei Kapitel 9 — was zu Folge 14 („Kapitel 9,
Teil B") passt.

**Schritt 3 – `vocab-data.js`:** nicht angefasst. Stand laut `validate.js`
171 Einträge / 342 Markierungen; die 11 eigenen Vokabeln aus arabicroots sind
alle enthalten (Abgleich über die UUIDs, 11 von 11 gefunden). Zur Beobachtung
aus dem Routinen-Prompt: Quran-Belege fehlen weiterhin für die Kapitel 6, 7
und 8 — **nicht eigenmächtig aufgefüllt** (E.1), bleibt Elias' Entscheidung.

**Schritt 4 – Samsung Notes:** `list_export_status` meldet alle drei Notizen mit
Cache, eine davon als `stale` („Madina Buch 1 (Beschriftet)"). Deshalb wie
vorgeschrieben `node werkzeuge/export-index.mjs --pruefen`:

```
Madina Buch 1 (Beschriftet)   pageCount 142 = PDF   geaendert 2026-07-28T01:19:20Z
Grammatik Heft Medina Buch 1  pageCount  14 = PDF   geaendert 2026-07-27T20:57:42Z
Madina Buch 1 Vokabelheft     pageCount  17 = PDF   geaendert 2026-07-27T01:21:48Z
=== 0 Beanstandung(en) bei 3 Eintraegen ===
```

Alle drei nur „zur Info": die Notiz wurde nach dem Export **angefasst**, was
nichts über neuen Inhalt sagt — von Elias am 29.07. geklärt. Die Seitenzahlen
stimmen mit den PDFs überein. **Der Index ist also in Ordnung, der stille
Ausfall vom 28./29.07. wiederholt sich nicht.** Ein Handschrift-Abgleich stand
diesmal inhaltlich nicht an: keine neuen Vokabeln, keine neuen Kapitel, keine
neue ausgewertete Folge. Der Index wurde nicht von Hand angefasst.

**Schritt 5 – Lernstand (ohne Buch-/Kapitelfilter, Sperre seit 28.07. aufgehoben):**
`get_weak_vocabulary` liefert 92 Einträge unter 50 % Trefferquote.

- **Elias hat zwischen dem 31.07. und heute viel geübt**, und zwar breit: 41 der
  92 schwachen Wörter tragen einen `lastSeenAt` vom **01.08.**, weitere 12 vom
  31.07., zwei von **heute, 02.08.** (قَصِيرٌ 10:32, مِرْوَحَةٌ 10:41).
- **Schwerpunkt liegt klar auf bayna-yadayk-2** (rund zwei Drittel der Liste),
  gefolgt von bayna-yadayk-1 und madina-2. Das deckt sich mit Elias'
  Richtigstellung vom 28.07. („das sind meine") — er übt über die neun
  freigeschalteten Kapitel hinaus.
- **Die schwächsten drei:** أَهْمَلَ (vernachlässigen, 6/42 = 14 %),
  مُهْمِلٌ (nachlässig, 6/28 = 21 %), وَقَعَ (geschehen, 7/27 = 26 %) — alle drei
  aus bayna-yadayk-2. Auffällig: أَهْمَلَ und مُهْمِلٌ sind **dieselbe Wurzel
  ه‑م‑ل** und liegen beide ganz unten. Das ist genau das Muster, das ein
  Wurzelfamilien- oder Verwechslungs-Modus abfangen würde (siehe Vorschlag unten).
- **Aus Madina 1 nur zwei Einträge** in der ganzen Liste: قَصِيرٌ (85/178 = 48 %,
  weiterhin das meistgeübte Wort überhaupt) und مِرْوَحَةٌ (32/66 = 48 %). Sein
  eigener Kernstoff sitzt also deutlich besser als der Rest.
- **Vier eigene Vokabeln stehen unter 50 %:** أَلْمُهَنْدِسٌ (0/7), لَحْمٌ (0/5),
  إِثْنَانِ (3/18), اِسْمٌ مَجْرُورٌ (1/3). أَلْمُهَنْدِسٌ und لَحْمٌ wurden **noch nie
  richtig beantwortet**.
- `get_personal_vocabulary`: **11 Einträge, unverändert**, jüngste Änderung
  18.07. **Keine neue eigene Vokabel, in der App fehlt keine.**

**Schritt 6 – Qualitätssicherung:**

| Skript | Ergebnis |
|---|---|
| `validate.js` | **Exit 0** – „Alles sauber (3 Hinweise)". 171 Vokabeln, 73 Regeln (alle mit Quelle, 51 mit gedrucktem Beleg), 342 Markierungen, 114 Suren, 1038 Wurzeln, `CACHE_NAME = vokabeltrainer-v85` |
| `pruefe-markierungen.js` | 196 von 342 Markierungen prüfbar, **0** Verstöße gegen die Regelbedingung, **0** Wortgrenzen-Fehler, **0** Überschneidungen |
| `pruefe-saetze.js` | 155 verfasste Sätze: **0 unpassende Endungen**, 10 mit unvokalisiertem Wort. Kontrollgruppe 27 Lehrbuchsätze: **0 Endungsfehler**, 1 mit unvokalisiertem Wort |
| `pruefe-transkripte.js` | 73 von 73 Regeln belegt: 59 von beiden Lesarten, 11 nur vom eigenen Whisper-Lauf, 2 von Hand nachgelesen, **1** von keiner Lesart im Fenster (`ismul-isara-hadha-01`, F1 10:07 — steht bei ±120 s doch da, der Zeitstempel zeigt auf den Anfang der Erklärung) |
| `pruefe-sprecher.js` | 73 Regeln gegen die Sprecherspur, durchschnittlich **85 %** Lehreranteil; 9 Regeln unter 60 % (Nachhör-Kandidaten), 4 weitere aus Folge 12, die keinen klaren Hauptsprecher hat |
| `pruefe-taschkil.js` | **7 Befunde in 6 Wörtern** (Exit 1, aber kein Push-Tor) — siehe unten |
| `pruefe-wortfelder.js` | Tabelle in Ordnung, 27 Felder. **Lernbestand: 131 von 171 (77 %) mit Bedeutungsfeld, 40 nur mit Wortart — davon 0 Nomen.** Also keine echte Lücke: es sind Partikeln und Adjektive, bei denen die Wortart schon die Kategorie ist. **Kein Suchwort ergänzt** |

**Die drei `validate.js`-Hinweise sind unverändert bekannt:** لَبَنٌ hat Plural
ohne `sg` (unkritisch), مِكْوَاةٌ / أَخٌ / أُخْتٌ haben `sg` ohne Plural (im Abzug
nachsehen, nicht selbst bilden), und zwei Satz-Schlüssel (45878, 45883) haben ein
leeres Markierungs-Array.

**`pruefe-taschkil.js` im Einzelnen — nichts davon ist neu, und nichts davon
wurde selbst gesetzt:**

| Wort | Stelle | Feld | Herkunft |
|---|---|---|---|
| أَيْضاً | ض (4) | `ar` + `sentAr` | Elias' eigene arabicroots-Notiz |
| الإِسْمُ | ل (1) | `ar` | Elias' eigene arabicroots-Notiz |
| أَلْبَان | ن (7) | `pl` | Datenabzug (id 45782) |
| اسْمُ / اسْمُكِ / اسْمِي | ا (0), Hamzat al-wasl | `sentAr` | `lehrbuch-saetze.js`, mb1-42-2 und mb1-63-1 |

Das sind exakt die Punkte, die seit dem 31.07. auf Elias warten („drei Wörter mit
unbelegter Vokalisierung" + „die drei اسم-Zitate"). **Eine Ḥaraka ohne Beleg ist
genauso erfunden wie eine erfundene Regel (E.1)** — deshalb unverändert gelassen.
Zwei Anmerkungen zur Einordnung, damit Elias schneller entscheiden kann:
أَيْضاً ist eine gängige Schreibvariante von أَيْضًا (Tanwīn auf dem Alif statt auf
dem ض) und dürfte kein Fehler sein; bei den drei اسم-Zitaten geht es um die
Hamzat al-wasl, die im Lehrbuch traditionell ohne Kasra steht.

**Schritt 7 – Commit:** nur dieser Log-Eintrag. Am Code, an `vocab-data.js`,
`grammar-data.js` und `sw.js` wurde nichts geändert, also **kein CACHE_NAME-Bump**
(bleibt v85). `data/vokabeln-*.js`, `vokabelpaket.json` und `transcripts/` sind
per `.gitignore` ausgeschlossen und wurden **nicht** mit `-f` erzwungen.

**Nichts war blockiert.** Kein abgelehnter Befehl, keine Datei, die sich nicht
schreiben ließ.

### Vorschläge für den nächsten Schritt (ehrlich priorisiert)

1. **Folge 14 auswerten** — der einzige Punkt mit echtem Zeitbezug. Sie behandelt
   Kapitel 9 (Teil B), also genau das Kapitel, an dem Elias gerade steht, und die
   Regeln daraus könnten `نَعْت` in der App noch belegter machen. Läuft
   automatisch über `arabicroots-backfill-retry`; wenn das Fenster geschlossen
   bleibt, in einer interaktiven Session mit `yt-dlp` + `whisper-cli` nachholen.
2. **Verwechslungs-Duelle (Generalcheck-Idee 3) sind reif geworden.** Sie waren
   am 28.07. blockiert, weil der Vokabelabzug nicht im Repo liegt — das gilt
   weiterhin, **aber das Paket liegt jetzt auf Elias' Geräten**, der Modus wäre
   dort also nicht leer. Der heutige Lernstand liefert das Argument gleich mit:
   أَهْمَلَ und مُهْمِلٌ, dieselbe Wurzel, stehen beide ganz unten in der
   Schwachliste. Das ist eine Entscheidung für Elias, keine Routinen-Änderung.
3. **Nichts Dringendes darüber hinaus.** Die Prüfskripte sind sauber, der Abzug
   steht still, die offenen Ḥarakāt-Fragen sind bewusst offen und brauchen ihn,
   nicht mich. Die höchste Projekt-Priorität bleibt laut Gedächtnis der Umzug auf
   eigene Domain mit Login — und der ist ausdrücklich kein Routinen-Thema.

## 2026-08-05 22:03 – Wöchentliche Wartung (Mi-Check)

Ergebnis vorweg: **eine echte Neuigkeit — Folge 15 ist erschienen, und sie greift
erstmals auf Kapitel 10 vor, das noch gar nicht freigeschaltet ist.** Sonst
nichts zu tun: Vokabelabzug unverändert, Vokabelpaket unverändert, alle sieben
Prüfskripte ohne neuen eigenen Befund. Am Code wurde nichts geändert,
`CACHE_NAME` bleibt bei **v119**.

**Vorbemerkung zum Zwischenstand:** Zwischen diesem und dem letzten Wartungslauf
liegen **36 Commits vom 03./04.08.** aus Elias' interaktiven Sitzungen — fast
alle am Quran-Leser (Lesemodus, Basmala, Juz-Angabe, Ayah-Sprungliste,
Surentitel mit Taschkil, Hifz-Abgleich) plus der Workspace-Umzug von `F:` auf
`G:`. `CACHE_NAME` ist dabei von v85 auf **v119** gestiegen. Das ist Elias'
Arbeit, nicht die der Routine; sie steht hier nur, damit die Zahlen unten
einzuordnen sind.

**Schritt 0 – Repo aktualisieren:** `git pull --ff-only` → `Already up to date.`
Arbeitsverzeichnis sauber (`git status --short` leer), HEAD auf `6639600`.

**Schritt 1 – Neue Aufzeichnungen: 🆕 Folge 15.** `get_recordings` liefert jetzt
**15** statt 14 Einträge. Neu:

| Folge | Titel | URL | eingestellt |
|---|---|---|---|
| 15 | Folge 15 \| MB1 Kapitel 9 & 10 | https://youtu.be/sKoWwoEhqGc | 2026-08-05, 19:04 UTC |

In `transcripts/backlog.md` nachgetragen (Tabellenzeile + Absatz). **Für Folge 15
liegt noch kein Rohmaterial vor** — anders als bei Folge 14, deren Untertitel und
Whisper-Lauf seit dem 02.08. bereitliegen und nur auf die Regelauswertung warten.
Damit stehen jetzt **zwei** Folgen offen. Der Ordner ist per `.gitignore`
ausgeschlossen — kein Commit daraus. **Es wurde kein Transkript abgerufen und
keine Regel bestätigt**; das macht `arabicroots-backfill-retry` (eine Folge pro
Lauf).

⭐ **Der inhaltlich interessante Teil:** Folge 15 heißt „Kapitel 9 **& 10**",
`get_unlocked_chapters` steht aber unverändert bei `madina-1-chapter-1` bis `-9`.
Der Unterricht läuft dem Freischalt-Stand also gerade voraus. Für die App spielt
das keine Rolle (sie zeigt seit dem 28.07. alle Kapitel, die die Datenbank
hergibt), aber es ist der erste Hinweis seit dem 27.07., dass sich die
Freischaltung demnächst bewegen dürfte. Nichts zu tun, nur zu wissen.

**Schritt 2 – Vokabelabzug (`node werkzeuge/hole-vokabeln.mjs`):** 4433 Einträge,
**Zahl je Buch identisch mit den letzten beiden Läufen**, keine einzige
Abweichung:

| Buch | Vokabeln | Kapitel | KB | Δ zum letzten Lauf |
|---|---|---|---|---|
| bayna-yadayk-1 | 231 | 17 | 90 | – |
| bayna-yadayk-2 | 552 | 17 | 216 | – |
| bayna-yadayk-3 | 445 | 17 | 174 | – |
| bayna-yadayk-4 | 881 | 16 | 344 | – |
| madina-1 | 298 | 24 | 112 | – |
| madina-2 | 445 | 29 | 169 | – |
| madina-3 | 1238 | 35 | 484 | – |
| quran | 343 | 23 | 122 | – |

`data/buecher.js` blieb dadurch unverändert (`git status` nach dem Lauf weiter
leer) — nichts zu committen.

**Vokabelpaket (`node werkzeuge/baue-vokabelpaket.mjs`):** 8 Bücher, 4433
Vokabeln, 1382 KB → **`UNVERAENDERT` — dasselbe Paket wie beim letzten Lauf.**
Kein Handlungsbedarf, Elias muss auf seinen Geräten nichts neu einlesen.

`get_unlocked_chapters`: `madina-1-chapter-1` bis `-9`, **unverändert seit dem
27.07.** — siehe die Beobachtung zu Folge 15 oben.

**Schritt 3 – `vocab-data.js`:** nicht angefasst. Stand laut `validate.js`
171 Einträge / 342 Markierungen; die 11 eigenen Vokabeln aus arabicroots sind
alle enthalten (Abgleich über die UUIDs, 11 von 11 gefunden). Quran-Belege fehlen
weiterhin für die Kapitel 6, 7 und 8 — **nicht eigenmächtig aufgefüllt** (E.1),
bleibt Elias' Entscheidung.

**Schritt 4 – Samsung Notes:** `list_export_status` meldet alle drei Notizen mit
Cache, eine davon als `stale` („Madina Buch 1 (Beschriftet)") — dieselbe Lage wie
am 02.08. Deshalb wie vorgeschrieben `node werkzeuge/export-index.mjs --pruefen`:

```
Madina Buch 1 (Beschriftet)   pageCount 142 = PDF   geaendert 2026-07-28T01:19:20Z
Grammatik Heft Medina Buch 1  pageCount  14 = PDF   geaendert 2026-07-27T20:57:42Z
Madina Buch 1 Vokabelheft     pageCount  17 = PDF   geaendert 2026-07-27T01:21:48Z
=== 0 Beanstandung(en) bei 3 Eintraegen ===
```

Alle drei Zeitstempel sind unverändert gegenüber dem 02.08., alle drei nur „zur
Info": die Notiz wurde nach dem Export **angefasst**, was nichts über neuen
Inhalt sagt (von Elias am 29.07. geklärt). Die Seitenzahlen stimmen mit den PDFs.
**Der Index ist in Ordnung, der stille Ausfall vom 28./29.07. wiederholt sich
nicht.** Ein Handschrift-Abgleich stand inhaltlich nicht an: keine neuen
Vokabeln, keine neuen Kapitel, keine neu ausgewertete Folge. Der Index wurde
nicht von Hand angefasst.

**Schritt 5 – Lernstand (ohne Buch-/Kapitelfilter):** `get_weak_vocabulary`
liefert **89 Einträge** unter 50 % — drei weniger als am 02.08. (92).

- **Weiter geübt, aber nicht seit gestern.** Der jüngste Zeitstempel in der ganzen
  Liste ist der **04.08.** (zehn Wörter, meist 12:26–12:30 sowie قَصِيرٌ 05:30 und
  مِرْوَحَةٌ 05:34); vom 05.08. steht nichts drin. Das passt dazu, dass der 04./05.08.
  bei Elias vollständig an der M14-Abgabe hing.
- **Schwerpunkt unverändert bayna-yadayk-2** (rund zwei Drittel der Liste), dann
  bayna-yadayk-1 und madina-2.
- **Die schwächsten drei sind dieselben wie am 02.08.:** أَهْمَلَ (6/42 = 14 %),
  مُهْمِلٌ (6/28 = 21 %), وَقَعَ (7/27 = 26 %) — alle aus bayna-yadayk-2, die ersten
  beiden weiterhin **dieselbe Wurzel ه‑م‑ل**. Keiner der drei hat seit dem 01.08.
  einen neuen Versuch, أَهْمَلَ sogar seit dem 28.07. nicht.
- 🆕 **Aus Madina 1 stehen jetzt drei statt zwei Wörter in der Liste:** neu dazu
  gekommen ist مُفَتِّشٌ (Inspektor, Kapitel 12, 21/45 = 47 %), es ist am 04.08.
  unter die 50-%-Marke gerutscht. Dazu wie gehabt قَصِيرٌ (82/175 = 47 %) und
  مِرْوَحَةٌ (32/67 = 48 %).
- ⚠️ **Eine Zahl, die so nicht entstehen kann, und die ich deshalb nur melde:**
  قَصِيرٌ stand am 02.08. bei **85 richtig / 178 Versuchen**, heute bei **82 / 175**.
  Beide Werte sind um genau **3 gesunken** — durch Üben geht das nicht, Versuche
  werden nur mehr. Entweder hat arabicroots drei Versuche gelöscht oder
  umgebucht. Es ist kein App-Problem (die Zahlen kommen live aus arabicroots, die
  App führt ihren Leitner-Stand getrennt), **es ist auch nichts, was ich hier
  reparieren könnte** — es steht hier, damit die Zahl beim nächsten Lauf nicht als
  Messfehler durchgeht. Bei مِرْوَحَةٌ ist die Bewegung normal (66 → 67 Versuche,
  einer davon falsch).
- **Vier eigene Vokabeln unter 50 %, unverändert:** أَلْمُهَنْدِسٌ (0/7), لَحْمٌ (0/5),
  إِثْنَانِ (3/18), اِسْمٌ مَجْرُورٌ (1/3). Die ersten beiden wurden **noch nie richtig
  beantwortet** und haben seit dem 17.07. bzw. 24.07. keinen Versuch mehr.
- `get_personal_vocabulary`: **11 Einträge, unverändert**, jüngste Änderung
  18.07. **Keine neue eigene Vokabel, in der App fehlt keine.**

**Schritt 6 – Qualitätssicherung:**

| Skript | Ergebnis |
|---|---|
| `validate.js` | **Exit 0** – „Alles sauber (3 Hinweise)". 171 Vokabeln, 73 Regeln (alle mit Quelle, 51 mit gedrucktem Beleg), 342 Markierungen, 114 Suren, 1038 Wurzeln, 1157 Wörter mit Zahl, 18 Module, `CACHE_NAME = vokabeltrainer-v119` |
| `pruefe-markierungen.js` | 196 von 342 Markierungen prüfbar, **0** Verstöße gegen die Regelbedingung, **0** Wortgrenzen-Fehler, **0** Überschneidungen |
| `pruefe-saetze.js` | 155 verfasste Sätze: **0 unpassende Endungen**, 10 mit unvokalisiertem Wort. Kontrollgruppe 27 Lehrbuchsätze: **0 Endungsfehler**, 1 mit unvokalisiertem Wort. Satzlänge: kein verfasster Satz länger als der längste Buchsatz (8 Wörter) |
| `pruefe-transkripte.js` | 73 von 73 Regeln belegt: 59 von beiden Lesarten, 11 nur vom eigenen Whisper-Lauf, 2 von Hand nachgelesen, **1** von keiner Lesart im Fenster (`ismul-isara-hadha-01`, F1 10:07 — steht bei ±120 s doch da) |
| `pruefe-sprecher.js` | 73 Regeln gegen die Sprecherspur, durchschnittlich **85 %** Lehreranteil; 9 Regeln unter 60 %, 4 weitere aus Folge 12 ohne klaren Hauptsprecher |
| `pruefe-taschkil.js` | **15 Befunde in 14 Wörtern** (vorher 7 in 6) — der Zuwachs ist bekannt und dokumentiert, siehe unten |
| `pruefe-wortfelder.js` | Tabelle in Ordnung, 27 Felder. **Lernbestand: 131 von 171 (77 %) mit Bedeutungsfeld, 40 nur mit Wortart — davon 0 Nomen.** Also keine echte Lücke. **Kein Suchwort ergänzt** |

**Die drei `validate.js`-Hinweise sind unverändert bekannt:** لَبَنٌ hat Plural
ohne `sg` (unkritisch), مِكْوَاةٌ / أَخٌ / أُخْتٌ haben `sg` ohne Plural (im Abzug
nachsehen, nicht selbst bilden), und zwei Satz-Schlüssel (45878, 45883) haben ein
leeres Markierungs-Array.

**`pruefe-taschkil.js`: 7 → 15 Befunde, und keiner davon ist neuer Schaden.**
Die acht neuen kommen alle aus `surah-data.js`, Feld `arTaschkil`, das es am
02.08. noch gar nicht gab — es entstand am 04.08. mit Commit `72c649f`
(„Surentitel mit Taschkil, belegt statt geraten"). Dessen Commit-Text sagt es
selbst: *„Stand: 106 von 114 Namen vollständig vokalisiert. Die 8 offenen stehen
in der To-Do für Elias — sie werden NICHT geraten."* Es sind genau diese acht:

| Sure | Name | offene Stelle |
|---|---|---|
| 8 | الْأَنفَال | ن |
| 21 | الْأَنبِيَاء | ن |
| 29 | الْعَنكَبُوت | ن |
| 58 | الْمُجَادلَة | د |
| 60 | الْمُمْتَحنَة | ح |
| 76 | الْإِنسَان | ن |
| 82 | الانفِطَار | ل |
| 84 | الانشِقَاق | ل |

Die sieben alten Befunde stehen unverändert: أَيْضاً (`ar` + `sentAr`) und الإِسْمُ
aus Elias' eigenen arabicroots-Notizen, أَلْبَان aus dem Abzug (id 45782) und die
drei اسم-Zitate in `lehrbuch-saetze.js` (mb1-42-2, mb1-63-1). **Nichts davon
wurde selbst vokalisiert** — eine Ḥaraka ohne Beleg ist genauso erfunden wie eine
erfundene Regel (E.1).

**Schritt 7 – Commit:** nur dieser Log-Eintrag. Am Code, an `vocab-data.js`,
`grammar-data.js` und `sw.js` wurde nichts geändert, also **kein CACHE_NAME-Bump**
(bleibt v119). `data/vokabeln-*.js`, `vokabelpaket.json` und `transcripts/` sind
per `.gitignore` ausgeschlossen und wurden **nicht** mit `-f` erzwungen.

**Nichts war blockiert.** Kein abgelehnter Befehl, keine Datei, die sich nicht
schreiben ließ.

### Vorschläge für den nächsten Schritt (ehrlich priorisiert)

1. **Folge 14 und 15 auswerten — inzwischen ein Rückstand von zwei Folgen.** Am
   02.08. war es eine, jetzt sind es zwei, und Folge 15 greift auf Kapitel 10
   vor. Von Folge 14 liegt das Rohmaterial seit dem 02.08. fertig da (Untertitel,
   Whisper-SRT, Ton), von Folge 15 noch nichts. Das ist der einzige Punkt mit
   echtem Zeitbezug: Der Unterricht läuft weiter, und der Abstand wird größer,
   nicht kleiner. Läuft grundsätzlich über `arabicroots-backfill-retry`; bleibt
   das 24-h-Fenster geschlossen, in einer interaktiven Sitzung mit `yt-dlp` +
   `whisper-cli` nachholen. Die Regelauswertung selbst gehört ohnehin in eine
   echte Sitzung (E.1), nicht in den Stundentakt.
2. **Die acht offenen Surennamen wären in einer halben Stunde zu belegen.** Sie
   sind seit dem 04.08. bewusst offen, und alle acht haben dieselbe Ursache: ein
   Buchstabe, der im Mushaf-Schriftbild kein eigenes Zeichen trägt (ن vor ف/ب,
   Hamzat al-waṣl nach dem Artikel). Das ist keine Wissenslücke, sondern eine
   Belegfrage — es braucht **eine** Entscheidung von Elias, welche Ausgabe als
   Maßstab gilt, danach trägt das Skript den Rest. Kleiner Aufwand, und es macht
   `pruefe-taschkil.js` wieder aussagekräftig: solange acht bekannte Befunde
   mitlaufen, geht ein neunter, echter leicht darin unter.
3. **Verwechslungs-Duelle bleiben der beste Feature-Vorschlag, und das Argument
   ist heute stärker als am 02.08.** أَهْمَلَ und مُهْمِلٌ, dieselbe Wurzel ه‑م‑ل,
   stehen unverändert ganz unten in der Schwachliste — und haben seit dem 28.07.
   bzw. 31.07. **keinen einzigen neuen Versuch** bekommen. Sie werden also nicht
   von allein besser. Entscheidung für Elias, keine Routinen-Änderung.
4. **Nichts Dringendes darüber hinaus.** Die Prüfskripte sind sauber, der Abzug
   steht seit drei Läufen still, die offenen Ḥarakāt-Fragen brauchen Elias, nicht
   mich. Höchste Projekt-Priorität bleibt laut Gedächtnis der Umzug auf eigene
   Domain mit Login — ausdrücklich kein Routinen-Thema.

## 2026-08-12 22:03 – Wöchentliche Wartung (Mi-Check)

Ergebnis vorweg: **der eigentliche Befund dieses Laufs ist ein stiller Ausfall der
Routine selbst.** Der Sonntagslauf vom **09.08. ist mittendrin abgebrochen** — er
hat den Backlog noch geschrieben, aber weder einen Log-Eintrag hinterlassen noch
das 24-h-Fenster geöffnet. Folge davon: `arabicroots-backfill-retry` steht seit
dem **06.08.** still, und **Folge 16 liegt seit dreieinhalb Tagen ohne
Rohmaterial**. Inhaltlich sonst nichts zu tun: Vokabelabzug unverändert,
Vokabelpaket `UNVERAENDERT`, alle sieben Prüfskripte ohne neuen eigenen Befund.
Am Code wurde nichts geändert, `CACHE_NAME` bleibt bei **v135**.

**Vorbemerkung zum Zwischenstand:** Zwischen diesem und dem letzten
*dokumentierten* Lauf (05.08.) liegen Elias' interaktive Sitzungen mit dem Umzug
auf **Cloudflare Pages per Direktupload**, dem Geräteabgleich über Cloudflare KV,
dem Wurzelmodus und zwölf nachgetragenen Beispielsätzen. `CACHE_NAME` ist dabei
von v119 auf **v135** gestiegen. Das ist Elias' Arbeit, nicht die der Routine;
es steht hier nur, damit die Zahlen unten einzuordnen sind.

### ⚠️ Der Ausfall vom 09.08. — belegt, nicht vermutet

Im `maintenance-log.md` fehlt ein Eintrag für Sonntag, den 09.08. Das ist kein
Versäumnis beim Schreiben, sondern ein abgebrochener Lauf. Vier Belege, die
zusammen nur eine Lesart zulassen:

| Beleg | Befund |
|---|---|
| `Automation\logs\vokabeltrainer-wartung_2026-08-09_171443.out.log` | existiert, ist **0 Byte** — ebenso die `.err.log` |
| `Automation\logs\routines.log` | enthält **keine Zeile** für den 09.08.-Wartungslauf (die letzte ist der `mcp-health-check` vom 10.08.) |
| `Automation\.state\backfill-window.txt` | steht auf **`2026-08-06T22:07:14`**, geschrieben nach dem Lauf vom 05.08. — am 09.08. **nicht** neu geschrieben |
| `transcripts\backlog.md` | enthält sehr wohl den Eintrag „Folge 16" mit Datum 09.08. |

Der Lauf ist also gestartet (17:14 statt 13:00 — `StartWhenAvailable` hat ihn
nachgeholt, der PC lief mittags nicht), kam bis Schritt 1 und schrieb den
Backlog, und endete dann, ohne Schritt 7 und 8 zu erreichen. `run-routine.ps1`
schreibt die Abschlusszeile in `routines.log` und das Backfill-Fenster erst
**nach** einem sauber beendeten Lauf — beides fehlt.

**Die teure Folge ist nicht der fehlende Log-Eintrag, sondern das geschlossene
Fenster.** `arabicroots-backfill-retry` prüft als Erstes
`backfill-window.txt`; steht dort eine vergangene Zeit, beendet sie sich in
Millisekunden. Genau das tut sie seit dem **06.08. 22:07**. Der letzte Retry-Lauf
in `routines.log` ist dementsprechend der vom **06.08. 22:05**. Folge 16 kam am
09.08. heraus — und niemand hat sie abgeholt.

✅ **Das heilt sich mit diesem Lauf von selbst**, sofern er sauber durchläuft:
dann schreibt `run-routine.ps1` das Fenster auf jetzt + 24 h, und die
Retry-Routine holt Folge 16 in der Nacht. **Nachsehen lohnt trotzdem** — wenn
`backfill-window.txt` morgen früh immer noch auf dem 06.08. steht, ist es kein
Einzelfall, sondern ein Muster.

⚠️ **Warum der Lauf abbrach, lässt sich von hier aus nicht sagen.** Ein 0-Byte-Log
verrät nichts über die Ursache. Standby, Abmeldung oder Neustart um kurz nach
17:14 wären die naheliegenden Kandidaten — geraten wird hier nichts.

**Schritt 0 – Repo aktualisieren:** `git pull --ff-only` → `Already up to date.`
Arbeitsverzeichnis sauber (`git status --short` leer), HEAD auf `d684871`.

**Schritt 1 – Neue Aufzeichnungen: keine neue Folge, aber die Freischaltung ist
gewachsen.** `get_recordings` liefert **16** Einträge — dieselben wie am 09.08.
Folge 16 („MB1 Kapitel 10 & 11", 09.08.2026, 09:52 UTC,
https://youtu.be/CHc959CPp64) stand bereits im Backlog, eingetragen vom
abgebrochenen Lauf. Nur die Kopfzeile „Zuletzt geprüft" wurde auf den 12.08.
gesetzt und der Grund für das fehlende Rohmaterial ergänzt.

⭐ **`get_unlocked_chapters` steht jetzt auf `madina-1-chapter-1` bis `-11`** —
vorher 1–9, unverändert seit dem 27.07. Die am 05.08. notierte Vermutung („die
Freischaltung dürfte sich demnächst bewegen") hat sich damit bestätigt;
Unterricht und Freischaltung sind wieder gleichauf. Für die App ändert das
nichts, sie zeigt seit dem 28.07. ohnehin alle Kapitel der Datenbank.

**Der Rückstand steht bei drei Folgen (14, 15, 16).** Von 14 und 15 liegt das
Rohmaterial fertig da, von 16 nichts. **Es wurde kein Transkript abgerufen und
keine Regel bestätigt.** `transcripts/` ist per `.gitignore` ausgeschlossen —
kein Commit daraus.

**Schritt 2 – Vokabelabzug (`node werkzeuge/hole-vokabeln.mjs`):** 4433 Einträge,
**Zahl je Buch identisch mit den letzten drei Läufen**, keine einzige Abweichung:

| Buch | Vokabeln | Kapitel | KB | Δ zum letzten Lauf |
|---|---|---|---|---|
| bayna-yadayk-1 | 231 | 17 | 90 | – |
| bayna-yadayk-2 | 552 | 17 | 216 | – |
| bayna-yadayk-3 | 445 | 17 | 174 | – |
| bayna-yadayk-4 | 881 | 16 | 344 | – |
| madina-1 | 298 | 24 | 112 | – |
| madina-2 | 445 | 29 | 169 | – |
| madina-3 | 1238 | 35 | 484 | – |
| quran | 343 | 23 | 122 | – |

⭐ **Bemerkenswert, weil es der Erwartung widerspricht:** Die Freischaltung ist um
zwei Kapitel gewachsen, der Abzug **nicht um eine Vokabel**. Das passt zusammen —
`get_vocabulary_by_book` liefert unabhängig von der Freischaltung alle Kapitel,
madina-1 stand schon immer bei 24 Kapiteln / 298 Vokabeln. Die Freischaltung
sagt etwas über Elias' Kursfortschritt, nichts über den Datenbestand.

`data/buecher.js` blieb unverändert (`git status` nach dem Lauf weiter leer) —
nichts zu committen.

**Vokabelpaket (`node werkzeuge/baue-vokabelpaket.mjs`):** 8 Bücher, 4433
Vokabeln, 1382 KB → **`UNVERAENDERT` — dasselbe Paket wie beim letzten Lauf.**
Kein Handlungsbedarf, Elias muss auf seinen Geräten nichts neu einlesen.

**Schritt 3 – `vocab-data.js`:** von der Routine nicht angefasst. Stand laut
`validate.js` weiterhin 171 Einträge / 342 Markierungen, aber **167 statt 155
Beispielsätze** — die zwölf dazugekommenen sind Elias' Commit `f378ab0` („die
zwölf Lernwörter ohne Beispielsatz haben einen"), nicht die Routine. Sie sind
vollständig vokalisiert: `pruefe-taschkil.js` steht trotz der zwölf neuen Sätze
unverändert bei 15 Befunden. Die 11 eigenen arabicroots-Vokabeln sind alle
enthalten. Quran-Belege fehlen weiterhin für die Kapitel 6, 7 und 8 — **nicht
eigenmächtig aufgefüllt** (E.1), bleibt Elias' Entscheidung.

**Schritt 4 – Samsung Notes:** `list_export_status` meldet alle drei Notizen mit
Cache, eine davon als `stale` („Madina Buch 1 (Beschriftet)") — dieselbe Lage wie
am 02.08. und 05.08. Deshalb wie vorgeschrieben
`node werkzeuge/export-index.mjs --pruefen`:

```
Madina Buch 1 (Beschriftet)   pageCount 142 = PDF   geaendert 2026-07-28T01:19:20Z
Grammatik Heft Medina Buch 1  pageCount  14 = PDF   geaendert 2026-07-27T20:57:42Z
Madina Buch 1 Vokabelheft     pageCount  17 = PDF   geaendert 2026-07-27T01:21:48Z
=== 0 Beanstandung(en) bei 3 Eintraegen ===
```

Alle drei Zeitstempel unverändert gegenüber dem 02.08. und 05.08., alle drei nur
„zur Info": die Notiz wurde nach dem Export **angefasst**, was nichts über neuen
Inhalt sagt (von Elias am 29.07. geklärt). Die Seitenzahlen stimmen mit den PDFs.
**Der Index ist in Ordnung, der stille Ausfall vom 28./29.07. wiederholt sich
nicht.** Ein Handschrift-Abgleich stand inhaltlich nicht an: keine neuen
Vokabeln, keine neu ausgewertete Folge. Der Index wurde nicht von Hand angefasst.

**Schritt 5 – Lernstand (ohne Buch-/Kapitelfilter):** `get_weak_vocabulary`
liefert **88 Einträge** unter 50 % — einer weniger als am 05.08. (89).

- ✅ **Die Zahl vom 05.08., die „so nicht entstehen kann", hat sich nicht
  wiederholt.** قَصِيرٌ war von 85/178 auf 82/175 **gefallen**; heute steht es bei
  **91/184**, also genau +9 Versuche und +9 richtige gegenüber dem 05.08. Das ist
  eine ganz normale Bewegung: neun Versuche, alle richtig. Der Einbruch bleibt
  ein einmaliger Vorfall bei arabicroots und **kein laufender Fehler** — die
  Zählweise selbst arbeitet korrekt weiter.
- 🆕 **Elias hat wieder geübt, und zwar heute.** Der jüngste Zeitstempel der
  ganzen Liste ist der **12.08. 07:52** (قَصِيرٌ). Davor eine deutliche Sitzung am
  **10.08. gegen 15:29** (rund ein Dutzend Wörter im Sekundenabstand) und am
  **06.08. gegen 11:27** (madina-2). Nach der M14-Abgabe ist das Üben also wieder
  angelaufen.
- ✅ **مِرْوَحَةٌ ist aus der Schwachliste heraus.** Am 05.08. stand es bei 32/67
  = 48 %, heute steht es nicht mehr unter der 50-%-Marke. Es ist der einzige
  Abgang, neue Einträge sind keine dazugekommen (89 − 1 = 88).
- **Aus Madina 1 stehen damit nur noch zwei Wörter in der Liste:** قَصِيرٌ
  (91/184 = 49,5 %, knapp unter der Schwelle) und مُفَتِّشٌ (21/45 = 47 %,
  unverändert seit dem 04.08.).
- **Schwerpunkt unverändert bayna-yadayk-2** (rund zwei Drittel der Liste), dann
  bayna-yadayk-1 und madina-2.
- **Die schwächsten drei sind dieselben wie am 02.08. und 05.08.:** أَهْمَلَ
  (6/42 = 14 %), مُهْمِلٌ (6/28 = 21 %), نَالَ (6/23 = 26 %) — die ersten beiden
  weiterhin **dieselbe Wurzel ه‑م‑ل**. ⚠️ **Und sie werden nicht von allein
  besser:** أَهْمَلَ hat seit dem **28.07.** keinen Versuch mehr, مُهْمِلٌ seit dem
  **31.07.** Elias hat am 10.08. eine ganze Runde bayna-yadayk-2 geübt — diese
  beiden waren nicht dabei. Das ist inzwischen das dritte Log in Folge mit
  demselben Befund.
- **Vier eigene Vokabeln unter 50 %, unverändert:** أَلْمُهَنْدِسٌ (0/7), لَحْمٌ (0/5),
  إِثْنَانِ (3/18), اِسْمٌ مَجْرُورٌ (1/3). Die ersten beiden wurden **noch nie richtig
  beantwortet** und haben seit dem 17.07. bzw. 24.07. keinen Versuch mehr.
- `get_personal_vocabulary`: **11 Einträge, unverändert**, jüngste Änderung
  18.07. **Keine neue eigene Vokabel, in der App fehlt keine.**

**Schritt 6 – Qualitätssicherung:**

| Skript | Ergebnis |
|---|---|
| `validate.js` | **Exit 0** – „Alles sauber (3 Hinweise)". 171 Vokabeln, 73 Regeln (alle mit Quelle, 51 mit gedrucktem Beleg), 342 Markierungen, 114 Suren, 1038 Wurzeln, 1157 Wörter mit Zahl, **20 Module** (vorher 18), `CACHE_NAME = vokabeltrainer-v135` |
| `pruefe-markierungen.js` | 196 von 342 Markierungen prüfbar, **0** Verstöße gegen die Regelbedingung, **0** Wortgrenzen-Fehler, **0** Überschneidungen |
| `pruefe-saetze.js` | **167** verfasste Sätze (vorher 155): **0 unpassende Endungen**, 10 mit unvokalisiertem Wort. Kontrollgruppe 27 Lehrbuchsätze: **0 Endungsfehler**, 1 mit unvokalisiertem Wort. Satzlänge: kein verfasster Satz länger als der längste Buchsatz (8 Wörter) |
| `pruefe-transkripte.js` | 73 von 73 Regeln belegt: 59 von beiden Lesarten, 11 nur vom eigenen Whisper-Lauf, 2 von Hand nachgelesen, **1** von keiner Lesart im Fenster (`ismul-isara-hadha-01`, F1 10:07 — steht bei ±120 s doch da) |
| `pruefe-sprecher.js` | 73 Regeln gegen die Sprecherspur, durchschnittlich **85 %** Lehreranteil; 9 Regeln unter 60 %, 4 weitere aus Folge 12 ohne klaren Hauptsprecher |
| `pruefe-taschkil.js` | **15 Befunde in 14 Wörtern — unverändert gegenüber dem 05.08.** |
| `pruefe-wortfelder.js` | Tabelle in Ordnung, 27 Felder. **Lernbestand: 131 von 171 (77 %) mit Bedeutungsfeld, 40 nur mit Wortart — davon 0 Nomen.** Also keine echte Lücke. **Kein Suchwort ergänzt** |

**Die drei `validate.js`-Hinweise sind unverändert bekannt:** لَبَنٌ hat Plural
ohne `sg` (unkritisch), مِكْوَاةٌ / أَخٌ / أُخْتٌ haben `sg` ohne Plural (im Abzug
nachsehen, nicht selbst bilden), und zwei Satz-Schlüssel (45878, 45883) haben ein
leeres Markierungs-Array.

**`pruefe-taschkil.js`: unverändert 15 Befunde, keiner davon neuer Schaden.** Die
acht offenen Surennamen aus `surah-data.js` (الْأَنفَال, الْأَنبِيَاء, الْعَنكَبُوت,
الْمُجَادلَة, الْمُمْتَحنَة, الْإِنسَان, الانفِطَار, الانشِقَاق) stehen seit dem 04.08.
bewusst offen. Dazu wie gehabt أَيْضاً und الإِسْمُ aus Elias' eigenen
arabicroots-Notizen, أَلْبَان aus dem Abzug (id 45782) und die drei اسم-Zitate in
`lehrbuch-saetze.js` (mb1-42-2, mb1-63-1). **Nichts davon wurde selbst
vokalisiert** — eine Ḥaraka ohne Beleg ist genauso erfunden wie eine erfundene
Regel (E.1).

**Schritt 7 – Commit:** nur dieser Log-Eintrag. Am Code, an `vocab-data.js`,
`grammar-data.js` und `sw.js` wurde nichts geändert, also **kein
CACHE_NAME-Bump** (bleibt v135). `data/vokabeln-*.js`, `vokabelpaket.json` und
`transcripts/` sind per `.gitignore` ausgeschlossen und wurden **nicht** mit `-f`
erzwungen.

ℹ️ **Zur Cloudflare-Regel aus `CLAUDE.md`:** Ein `node werkzeuge/veroeffentlichen.mjs`
war hier nicht nötig und wäre auch nicht möglich gewesen — es steht nicht auf der
Werkzeugliste dieser Routine. Nötig ist es auch nicht: `maintenance-log.md` wird
nicht ausgeliefert, und an den ausgelieferten Dateien hat dieser Lauf nichts
geändert. **Für spätere Läufe bleibt das ein offener Punkt** — sobald eine
Wartung einmal etwas Ausgelieferbares ändert, pusht sie ins Repo und die Seite
bleibt alt. Genau der Fehler, vor dem `CLAUDE.md` warnt.

**Nichts war blockiert.** Kein abgelehnter Befehl, keine Datei, die sich nicht
schreiben ließ.

### Vorschläge für den nächsten Schritt (ehrlich priorisiert)

1. ⚠️ **Morgen früh `Automation\.state\backfill-window.txt` ansehen — das ist der
   einzige Punkt mit echtem Zeitbezug.** Steht dort ein Datum vom 12./13.08., hat
   sich der Ausfall von selbst geheilt und Folge 16 wird in der Nacht abgeholt.
   Steht dort weiterhin `2026-08-06T22:07:14`, bricht auch dieser Lauf ab, und
   dann ist es kein Einzelfall, sondern ein Muster — mit der unangenehmen
   Eigenschaft, dass **beide Routinen gleichzeitig verstummen**: die Wartung
   schreibt keinen Log-Eintrag, und der Backfill hält sich für gesperrt. Vier
   Tage sind so unbemerkt vergangen.
2. ⭐ **Das Fenster sollte nicht am Erfolg des ganzen Laufs hängen.** Auch wenn es
   sich diesmal von selbst heilt, bleibt die Bauart heikel: ein Wartungslauf, der
   in Schritt 5 stirbt, legt eine völlig unabhängige Routine für Tage still. Ein
   Fenster, das `run-routine.ps1` gleich **beim Start** öffnet, hätte denselben
   Zweck erfüllt (die Retry-Routine soll rund um die Wartungstermine arbeiten)
   und wäre gegen Abbrüche unempfindlich. Kleine Änderung, außerhalb dieses
   Repos — **Entscheidung für Elias**, keine Routinen-Änderung von hier aus.
3. **Drei Folgen Rückstand, und Folge 16 deckt Kapitel 10 & 11 — genau die beiden
   frisch freigeschalteten.** Die Regelauswertung gehört nach E.1 ohnehin in eine
   echte Sitzung. Der Abstand wächst weiter: am 02.08. war es eine Folge, am
   05.08. zwei, heute drei.
4. **Die acht offenen Surennamen wären in einer halben Stunde zu belegen** —
   unverändert gegenüber dem 05.08. Es braucht **eine** Entscheidung von Elias,
   welche Ausgabe als Maßstab gilt, danach trägt das Skript den Rest. Solange
   acht bekannte Befunde mitlaufen, geht ein neunter, echter leicht darin unter.
5. **Verwechslungs-Duelle: das Argument ist heute am stärksten von allen drei
   Läufen.** أَهْمَلَ und مُهْمِلٌ, dieselbe Wurzel ه‑م‑ل, stehen unverändert ganz
   unten — und Elias hat am 10.08. nachweislich eine Runde bayna-yadayk-2 geübt,
   **ohne dass die beiden dabei waren**. Sie sind nicht vergessen, sie werden
   umgangen. Entscheidung für Elias, keine Routinen-Änderung.

## 2026-08-16 13:00 – Wöchentliche Wartung (So-Check)

Ergebnis vorweg: **ein ruhiger Lauf ohne eigenen Befund — und das erste Mal seit
dem 02.08., dass nichts an der Routine selbst kaputt war.** Der Ausfall vom
09.08. hat sich, wie am 12.08. vorhergesagt, von selbst geheilt: das 24-h-Fenster
wurde geschrieben, `arabicroots-backfill-retry` hat Folge 16 am 13.08. abgeholt.
Vokabelabzug unverändert, Vokabelpaket `UNVERAENDERT`, alle sieben Prüfskripte
ohne neuen eigenen Befund. Am Code wurde von der Routine nichts geändert.

**Vorbemerkung: zwischen dem 12.08. und heute hat Elias viel gearbeitet.**
Dreizehn Commits am 15. und 16.08., alle interaktiv, keiner von der Routine. Der
Reihe nach: Tablet-Layout (breiterer Inhalt und größere Schrift ab 700 px, untere
Leiste auf volle Breite), **297 Eselsbrücken** in zwei Schritten (157 für den
Lernbestand, danach 140 für Madina 1 in der eigenen Datei
`data/eselsbruecken.js`, die Elias ausdrücklich fürs Repo freigegeben hat),
`--text-faint` von `#66666e` auf `#82828a` angehoben (WCAG-AA), und zuletzt fünf
Commits zur Typografie der Kartenrückseite. `CACHE_NAME` ist dabei von **v135 auf
v144** gestiegen, die Modulzahl steht unverändert bei 20. Das steht hier nur,
damit die Zahlen unten einzuordnen sind.

ℹ️ **Ein Nebeneffekt davon ist in den Prüfzahlen sichtbar:** `validate.js` meldet
nur noch **2 statt 3 Hinweise**. Der weggefallene dritte waren die beiden
Satz-Schlüssel 45878 und 45883 mit leerem Markierungs-Array — Elias hat sie am
15.08. entfernt (`2805266`). Ein bekannter Hinweis weniger, der seit dem 28.07.
mitlief.

**Schritt 0 – Repo aktualisieren:** `git pull --ff-only` → `Already up to date.`
Arbeitsverzeichnis sauber (`git status --short` leer), HEAD auf `037213e`.

**Zur Nachschau aus dem letzten Lauf — der Punkt mit echtem Zeitbezug ist
erledigt.** `Automation\.state\backfill-window.txt` steht auf
**`2026-08-13T22:08:44`**, also 12.08. 22:08 plus 24 Stunden. Der Wartungslauf vom
12.08. ist damit sauber zu Ende gelaufen und `run-routine.ps1` hat das Fenster
geöffnet; `arabicroots-backfill-retry` hat es genutzt und **Folge 16 noch am
13.08. abgeholt** (Backlog-Eintrag dort). Der Ausfall vom 09.08. war ein
**Einzelfall, kein Muster** — die am 12.08. formulierte Prüffrage ist damit
beantwortet. Dass das Fenster inzwischen wieder zu ist, ist keine Störung,
sondern die vorgesehene 24-h-Mechanik.

⚠️ **Der zweite Vorschlag vom 12.08. bleibt davon unberührt und gilt weiter:** dass
sich der Ausfall diesmal geheilt hat, macht die Bauart nicht besser. Ein
Wartungslauf, der in Schritt 5 stirbt, legt weiterhin eine völlig unabhängige
Routine für Tage still. Das ist Glück gewesen, kein Schutz.

**Schritt 1 – Neue Aufzeichnungen: keine.** `get_recordings` liefert **16**
Einträge, unverändert seit dem 09.08. Damit liegen **sieben Tage ohne neue Folge**
hinter uns.

Das ist ausdrücklich **kein Anlass zur Sorge, sondern genau der bisherige
Höchstabstand**: 10.06.→17.06. und 26.07.→02.08. lagen ebenfalls sieben Tage
auseinander, der übliche Takt sind drei bis vier. Der Abstand ist damit
eingestellt, nicht überschritten. Im Backlog nachgetragen, damit der nächste Lauf
denselben Vergleich nicht neu anstellen muss.

⭐ `get_unlocked_chapters` steht unverändert auf `madina-1-chapter-1` bis **`-11`**
— dieselbe Lage wie am 13.08. Freischaltung und Unterricht sind weiter gleichauf.

**Der Rückstand steht unverändert bei drei Folgen (14, 15, 16), aber die Lage hat
sich verbessert:** von allen dreien liegt inzwischen Rohmaterial da (Folge 16 seit
dem 13.08.), offen ist nur noch die **Regelauswertung**. Am 12.08. fehlte von
Folge 16 noch alles. **Es wurde kein Transkript abgerufen und keine Regel
bestätigt.** `transcripts/` ist per `.gitignore` ausgeschlossen — kein Commit
daraus.

**Schritt 2 – Vokabelabzug (`node werkzeuge/hole-vokabeln.mjs`):** 4433 Einträge,
**Zahl je Buch identisch mit den letzten vier Läufen**, keine einzige Abweichung:

| Buch | Vokabeln | Kapitel | KB | Δ zum letzten Lauf |
|---|---|---|---|---|
| bayna-yadayk-1 | 231 | 17 | 90 | – |
| bayna-yadayk-2 | 552 | 17 | 216 | – |
| bayna-yadayk-3 | 445 | 17 | 174 | – |
| bayna-yadayk-4 | 881 | 16 | 344 | – |
| madina-1 | 298 | 24 | 112 | – |
| madina-2 | 445 | 29 | 169 | – |
| madina-3 | 1238 | 35 | 484 | – |
| quran | 343 | 23 | 122 | – |

`data/buecher.js` blieb unverändert (`git status` nach dem Lauf weiter leer) —
nichts zu committen.

**Vokabelpaket (`node werkzeuge/baue-vokabelpaket.mjs`):** 8 Bücher, 4433
Vokabeln, 1382 KB → **`UNVERAENDERT` — dasselbe Paket wie beim letzten Lauf.**
Kein Handlungsbedarf, Elias muss auf seinen Geräten nichts neu einlesen.

**Schritt 3 – `vocab-data.js`:** von der Routine nicht angefasst. Stand laut
`validate.js` unverändert **171 Einträge, 167 Beispielsätze, 342 Markierungen**.
Die 11 eigenen arabicroots-Vokabeln sind alle enthalten. Quran-Belege fehlen
weiterhin für die Kapitel 6, 7 und 8 — **nicht eigenmächtig aufgefüllt** (E.1),
bleibt Elias' Entscheidung.

**Schritt 4 – Samsung Notes:** `list_export_status` meldet alle drei Notizen mit
Cache, eine davon als `stale` („Madina Buch 1 (Beschriftet)") — dieselbe Lage wie
am 02.08., 05.08. und 12.08. Deshalb wie vorgeschrieben
`node werkzeuge/export-index.mjs --pruefen`:

```
Madina Buch 1 (Beschriftet)   pageCount 142 = PDF   geaendert 2026-07-28T01:19:20Z
Grammatik Heft Medina Buch 1  pageCount  14 = PDF   geaendert 2026-07-27T20:57:42Z
Madina Buch 1 Vokabelheft     pageCount  17 = PDF   geaendert 2026-07-27T01:21:48Z
=== 0 Beanstandung(en) bei 3 Eintraegen ===
```

Alle drei Zeitstempel unverändert seit dem 02.08., alle drei nur „zur Info": die
Notiz wurde nach dem Export **angefasst**, was nichts über neuen Inhalt sagt (von
Elias am 29.07. geklärt). Die Seitenzahlen stimmen mit den PDFs. **Der Index ist
in Ordnung, der stille Ausfall vom 28./29.07. wiederholt sich nicht.** Ein
Handschrift-Abgleich stand inhaltlich nicht an: keine neuen Vokabeln, keine neu
ausgewertete Folge. Der Index wurde nicht von Hand angefasst.

**Schritt 5 – Lernstand (ohne Buch-/Kapitelfilter):** `get_weak_vocabulary`
liefert **88 Einträge** unter 50 % — dieselbe Zahl wie am 12.08.

⭐ **Die gleiche Zahl verdeckt hier eine Bewegung, und beide Hälften sind
belegbar:** ein Wort ist raus, ein anderes ist rein.

- ✅ **قَصِيرٌ hat es über die 50-%-Marke geschafft.** Am 12.08. stand es bei
  91/184 = 49,5 % und war damit das stärkste Wort der ganzen Liste; heute steht
  es nicht mehr darin. Damit ist **aus Madina 1 nur noch ein einziges Wort in der
  Schwachliste**: مُفَتِّشٌ (21/45 = 46,7 %, unverändert seit dem 04.08.). قَصِيرٌ
  war über Wochen Elias' meistgeübtes Wort überhaupt — dass es jetzt oben raus
  ist, ist der sichtbarste Lernerfolg dieses Logs.
- 🆕 **Neu in der Liste ist سَمَحَ** („erlauben", madina-2 Kapitel 17), heute bei
  **5/11 = 45,5 %**. Es ist nicht schlechter geworden, sondern **knapp unter die
  Schwelle gerutscht**: vor dem heutigen Versuch stand es bei 5/10 = genau 50 %
  und lag damit gerade eben noch außerhalb. Ein falscher Versuch hat gereicht.
  (Hergeleitet, nicht geraten: es ist der einzige Eintrag der Liste, dessen Stand
  ohne den heutigen Versuch nicht unter 50 % läge.)
- 🆕 **Elias hat heute Morgen geübt, aber nur kurz.** Sieben Wörter zwischen
  **09:47 und 09:49 UTC**, davon **zwei richtig** (نَالَ, مُكَافَأَةٌ) und fünf falsch
  (أَدَّى, مَنَحَ, سَابَقَ, شَجَّعَ, سَمَحَ). Das ist eher ein Reinschauen als eine
  Sitzung — zum Vergleich die Runde am 10.08. gegen 15:29 mit rund einem Dutzend
  Wörtern.
- ⚠️ **أَهْمَلَ und مُهْمِلٌ werden weiterhin umgangen — das ist jetzt das vierte Log
  in Folge mit demselben Befund.** أَهْمَلَ (6/42 = 14 %) hat seit dem **28.07.**
  keinen Versuch mehr, مُهْمِلٌ (6/28 = 21 %) seit dem **31.07.** Beide gehören zur
  Wurzel ه‑م‑ل, beide stehen ganz unten, und die heutige Runde aus
  bayna-yadayk-2 hat sie wieder nicht erwischt. Sie sind nicht vergessen, sie
  kommen schlicht nicht dran.
- **Die schwächsten fünf:** أَهْمَلَ (14 %), إِثْنَانِ (17 %, eigene Vokabel),
  مُهْمِلٌ (21 %), أَدَّى (25 %), نَالَ (29 %).
- **Schwerpunkt unverändert bayna-yadayk-2** (rund zwei Drittel der Liste), dann
  bayna-yadayk-1 und madina-2.
- **Vier eigene Vokabeln unter 50 %, unverändert:** أَلْمُهَنْدِسٌ (0/7), لَحْمٌ (0/5),
  إِثْنَانِ (3/18), اِسْمٌ مَجْرُورٌ (1/3). Die ersten beiden wurden **noch nie richtig
  beantwortet** und haben seit dem 17.07. bzw. 24.07. keinen Versuch mehr.
- `get_personal_vocabulary`: **11 Einträge, unverändert**, jüngste Änderung
  18.07. **Keine neue eigene Vokabel, in der App fehlt keine.**

**Schritt 6 – Qualitätssicherung:**

| Skript | Ergebnis |
|---|---|
| `validate.js` | **Exit 0** – „Alles sauber (2 Hinweise)". 171 Vokabeln, 73 Regeln (alle mit Quelle, 51 mit gedrucktem Beleg), 342 Markierungen, 114 Suren, 1038 Wurzeln, 1157 Wörter mit Zahl, 20 Module, **`CACHE_NAME = vokabeltrainer-v144`** |
| `pruefe-markierungen.js` | 196 von 342 Markierungen prüfbar, **0** Verstöße gegen die Regelbedingung, **0** Wortgrenzen-Fehler, **0** Überschneidungen |
| `pruefe-saetze.js` | 167 verfasste Sätze: **0 unpassende Endungen**, 10 mit unvokalisiertem Wort. Kontrollgruppe 27 Lehrbuchsätze: **0 Endungsfehler**, 1 mit unvokalisiertem Wort. Kein verfasster Satz länger als der längste Buchsatz (8 Wörter) |
| `pruefe-transkripte.js` | 73 von 73 Regeln belegt: 59 von beiden Lesarten, 11 nur vom eigenen Whisper-Lauf, 2 von Hand nachgelesen, **1** von keiner Lesart im Fenster (`ismul-isara-hadha-01`, F1 10:07 — steht bei ±120 s doch da) |
| `pruefe-sprecher.js` | 73 Regeln gegen die Sprecherspur, durchschnittlich **85 %** Lehreranteil; 9 Regeln unter 60 %, 4 weitere aus Folge 12 ohne klaren Hauptsprecher |
| `pruefe-taschkil.js` | **15 Befunde in 14 Wörtern — unverändert seit dem 05.08.** |
| `pruefe-wortfelder.js` | Tabelle in Ordnung, 27 Felder. **Lernbestand: 131 von 171 (77 %) mit Bedeutungsfeld, 40 nur mit Wortart — davon 0 Nomen.** Also keine echte Lücke. **Kein Suchwort ergänzt** |

**Die zwei verbliebenen `validate.js`-Hinweise sind unverändert bekannt:** لَبَنٌ
hat Plural ohne `sg` (unkritisch), und مِكْوَاةٌ / أَخٌ / أُخْتٌ haben `sg` ohne Plural
(im Abzug nachsehen, nicht selbst bilden).

**`pruefe-taschkil.js`: unverändert 15 Befunde, keiner davon neuer Schaden.** Die
acht offenen Surennamen aus `surah-data.js` (الْأَنفَال, الْأَنبِيَاء, الْعَنكَبُوت,
الْمُجَادلَة, الْمُمْتَحنَة, الْإِنسَان, الانفِطَار, الانشِقَاق) stehen seit dem 04.08.
bewusst offen. Dazu wie gehabt أَيْضاً und الإِسْمُ aus Elias' eigenen
arabicroots-Notizen, أَلْبَان aus dem Abzug (id 45782) und die drei اسم-Zitate in
`lehrbuch-saetze.js` (mb1-42-2, mb1-63-1). ⭐ **Bemerkenswert: Elias hat seit dem
12.08. 297 Eselsbrücken angelegt, und der Zähler steht trotzdem still.** Das
arabische Material darin ist also durchgehend vollständig vokalisiert — 297 neue
Texte ohne eine einzige neue Lücke. **Nichts wurde selbst vokalisiert** — eine
Ḥaraka ohne Beleg ist genauso erfunden wie eine erfundene Regel (E.1).

**Schritt 7 – Commit:** nur dieser Log-Eintrag. Am Code, an `vocab-data.js`,
`grammar-data.js` und `sw.js` wurde von der Routine nichts geändert, also **kein
CACHE_NAME-Bump** (bleibt bei Elias' v144). `data/vokabeln-*.js`,
`vokabelpaket.json` und `transcripts/` sind per `.gitignore` ausgeschlossen und
wurden **nicht** mit `-f` erzwungen.

⚠️ **Zur Cloudflare-Regel aus `CLAUDE.md` — diesmal ist sie nicht nur theoretisch.**
Für diesen Lauf selbst gilt weiter das Bekannte: `maintenance-log.md` wird nicht
ausgeliefert, die Routine hat an ausgelieferten Dateien nichts geändert, und
`node werkzeuge/veroeffentlichen.mjs` steht ohnehin nicht auf ihrer Werkzeugliste.
**Aber Elias hat heute früh um 06:57 fünf Commits an genau solchen Dateien
gemacht.** Im Repo selbst ist nicht ablesbar, ob danach veröffentlicht wurde — es
gibt kein `.deploy/` und keine Zustandsdatei, und die Seite kann diese Routine
nicht abrufen.

✅ **In [[Vokabeltrainer-Arabisch]] steht die Antwort aber, und sie ist gut:** für
den 16.08. sind **vier Cloudflare-Deployments** protokolliert — `099b6d59`,
`9927881f`, `f632b8ba` und `6def2ab9`, alle **Production** auf `main`, das letzte
zum Stand `037213e` / Cache v144, mit Elias' Abnahme „ja so ist gut." **Die
ausgelieferte Seite ist also aktuell.** Der Fehler, vor dem `CLAUDE.md` warnt, ist
hier nicht eingetreten.

⭐ **Nachtrag, weil es sich erst beim Push gezeigt hat: Elias' fünf Commits von
heute früh waren noch gar nicht auf GitHub.** Der Push ging von `2039026`
(15.08.) auf `5250669` — er hat also `ecbfde0`, `559cd0a`, `9895aac`, `7d9ae96`
und `037213e` **mitgenommen**. Das war nicht beabsichtigt und ist auch nicht
vermeidbar: `git push` schiebt den ganzen Zweig, nicht einzelne Commits. Die
Vorschrift „nur selbst geänderte Dateien, mit explizitem Pfad" bezieht sich auf
`git add` und wurde eingehalten — gestaged war ausschließlich
`maintenance-log.md`.

Schaden entsteht dadurch keiner (es ist Elias' eigene Arbeit auf seinem eigenen
`main`). Zu lernen ist daraus eines: **`git pull --ff-only` → „Already up to date"
ist kein Beleg dafür, dass lokal und GitHub gleichauf sind.** `pull` sagt nichts
darüber, ob man *voraus* ist. Wer das wissen will, braucht `git status` (dort
steht „Your branch is ahead") oder `git log origin/main..main`.

⭐⭐ **Und die Lage ist genau spiegelverkehrt zu der, vor der `CLAUDE.md` warnt.**
Die Warnung dort lautet: „Wer nur pusht, hat ein aktuelles Repo und eine alte
Seite." Heute war es umgekehrt — **die Seite war den ganzen Tag aktuell (vier
Production-Deployments), das Repo hing hinterher.** Das ist die harmlosere der
beiden Richtungen, aber es ist derselbe Riss: seit Repo und Auslieferung
entkoppelt sind, kann jede der beiden Seiten allein vorlaufen, und keine der
beiden merkt es von selbst. Der Wartungslauf hat den Rückstand hier zufällig
eingesammelt, weil er ohnehin pusht — verlassen sollte man sich darauf nicht.

**Nichts war blockiert.** Kein abgelehnter Befehl, keine Datei, die sich nicht
schreiben ließ.

### Vorschläge für den nächsten Schritt (ehrlich priorisiert)

1. ⭐ **Verwechslungs-Duelle — das Argument ist jetzt so stark, wie es aus einem
   Routinenlauf werden kann.** Vierter Lauf in Folge mit demselben Befund: أَهْمَلَ
   und مُهْمِلٌ, dieselbe Wurzel ه‑م‑ل, ganz unten in der Liste, seit dem 28.07.
   bzw. 31.07. ohne einen einzigen Versuch — obwohl Elias am 10.08. **und heute**
   bayna-yadayk-2 geübt hat. Das ist kein Vergessen, das ist ein Auswahlproblem:
   die Wörter kommen bei zufälliger Ziehung schlicht zu selten dran, um sich zu
   bewegen. Ein Modus, der zwei Wörter derselben Wurzel gegeneinander stellt,
   trifft genau diesen Fall. Der frühere Blocker („Dauerbrenner-Filter") ist seit
   dem 28.07. aufgehoben. **Entscheidung für Elias, keine Routinen-Änderung.**
2. **Die acht offenen Surennamen wären in einer halben Stunde zu belegen** —
   unverändert seit dem 05.08. Es braucht **eine** Entscheidung von Elias, welche
   Ausgabe als Maßstab gilt, danach trägt das Skript den Rest. Solange acht
   bekannte Befunde mitlaufen, geht ein neunter, echter leicht darin unter. Der
   Punkt gewinnt dadurch an Gewicht, dass `pruefe-taschkil.js` sonst inzwischen
   sauber ist: 297 neue Eselsbrücken haben keine einzige Lücke erzeugt.
3. **Drei Folgen Rückstand — aber die Dringlichkeit hat abgenommen, nicht
   zugenommen.** Seit dem 13.08. liegt für alle drei das Rohmaterial vollständig
   vor; offen ist allein die Regelauswertung, und die gehört nach E.1 ohnehin in
   eine echte Sitzung. Folge 16 deckt Kapitel 10 & 11 — genau die beiden, die seit
   dem 13.08. freigeschaltet sind. ⚠️ Beim Auswerten die zwei
   Whisper-Wiederholungsschleifen in Folge 16 beachten (ca. 21:34–26:20 und
   40:00–46:57, dort nur die YouTube-Fassung brauchbar), sie stehen im Backlog
   beschrieben.
4. **Kleiner Zusatz zu Schritt 0, kostet nichts:** Der Lauf sollte künftig nicht
   nur `git pull --ff-only`, sondern auch `git log origin/main..main` machen. Heute
   wäre damit gleich zu Anfang sichtbar gewesen, dass fünf Commits lokal liegen —
   statt es erst an der Push-Ausgabe zu bemerken. Ein Befehl, eine Zeile im Log,
   und die Richtung „Repo hängt hinterher" wird künftig gesehen statt gefunden.
   Das ist eine Änderung am Routinen-Prompt, also **Elias' Entscheidung**, nicht
   meine.
5. **Nichts Dringendes darüber hinaus.** Der Abzug steht seit vier Läufen still,
   die Prüfskripte sind sauber, die offenen Ḥarakāt-Fragen brauchen Elias' Beleg
   und nicht meine Vermutung, und die Routine selbst hat diesmal ohne Störung
   durchgearbeitet.

ℹ️ **Kleinigkeit am Rande, nicht angefasst:** In [[Vokabeltrainer-Arabisch]] steht
die Tabellenzeile „Commits am 16.08." zweimal untereinander (einmal mit vier,
einmal mit fünf Commits) — ein Bearbeitungsrest aus Elias' Sitzung. Die zweite
Zeile ist die vollständige. Ich habe die Notiz nicht korrigiert: sie ist heute von
ihm selbst geführt worden und aktuell, und in einer unbeaufsichtigten Routine an
seinem Gedächtnis herumzuräumen ist die falsche Reihenfolge.
