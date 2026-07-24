# Maintenance Log

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
