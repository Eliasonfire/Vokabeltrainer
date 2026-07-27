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
`git -C F:\Workspace\Vokabeltrainer pull --ff-only` wurde abgelehnt. Ursache: die
`allowedTools`-Liste in `F:\Workspace\Automation\routines.json` erlaubt
`Bash(git pull:*)`, `Bash(git add:*)`, `Bash(git commit:*)`, `Bash(git push:*)` —
diese Muster greifen aber nur, wenn der Befehl *wörtlich* mit `git pull` / `git add`
usw. beginnt. Alle Befehle im Prompt beginnen mit `git -C <pfad> …` und passen
deshalb auf kein einziges Muster. Ohne `cd` (ebenfalls nicht erlaubt) und mit
`cwd = F:\Workspace` (kein Git-Repo) ist Git in diesem Lauf **komplett unbenutzbar**.
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
der drei PDFs in `F:\Workspace\SamsungNotes-Export\` trägt den erwarteten
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
   `"Bash(git -C F:\\Workspace\\Vokabeltrainer:*)"` ersetzen — eng auf das eine Repo
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
Arbeitsverzeichnis ist bereits `F:\Workspace\Vokabeltrainer`. Vorschlag 1 des
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
beschrieben: nur eine der drei PDFs in `F:\Workspace\SamsungNotes-Export\` trägt
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
