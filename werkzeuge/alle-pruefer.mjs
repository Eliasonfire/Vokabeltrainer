#!/usr/bin/env node
/* alle-pruefer.mjs — jeden Prüfer einmal, und eine Übersicht daraus
 * ==========================================================================
 *
 * ⭐ WOZU
 *
 * In der Nacht auf den 21.08.2026 habe ich dreimal von Hand eine Schleife über
 * alle Prüfer geschrieben, um zu sehen, was rot ist. Das gehört in ein
 * Werkzeug: ein Befehl statt zehn, und die Lage auf einen Blick.
 *
 *   node werkzeuge/alle-pruefer.mjs            alle laufen lassen
 *   node werkzeuge/alle-pruefer.mjs --knapp    nur die Übersicht
 *
 * ==========================================================================
 * ⛔⛔ WAS DER EXITCODE ALLEIN NICHT SAGT — und warum hier eine Spalte dafür steht
 *
 * Am 21.08.2026 gemessen: die elf Prüfer nutzen ihre Exitcodes UNEINHEITLICH.
 *
 *   pruefe-duplikate.js      1 = Werkzeugfehler, 2 = Befunde für Elias
 *   pruefe-erreichbarkeit.js 2 = Befunde
 *   pruefe-taschkil.js       1 = BEIDES (Z275 Datendateien, Z837 Befunde)
 *   die übrigen              1 = Befunde
 *
 * Ein Aufrufer kann daraus also NICHT ableiten, ob das Werkzeug kaputt ist
 * oder ob Elias entscheiden muss. [[kennzeichen_mit_zwei_ursachen]]
 *
 * ⛔ Vereinheitlicht wird hier NICHTS: das wären elf Dateien ohne belegten
 * Nutzen, und ein bestehender Aufrufer könnte daran brechen. Stattdessen zeigt
 * die Übersicht die letzte Ausgabezeile mit — die sagt, was der Code meint.
 *
 * ==========================================================================
 * ⚠️ DREI PRÜFER STEHEN DAUERHAFT ROT, UND DAS IST IN ORDNUNG
 *
 * pruefe-duplikate.js, pruefe-taschkil.js und werkzeuge/pruefe-themen.mjs
 * warten auf Elias' Entscheidung — alle drei stehen auf seiner Seite „Was auf
 * dich wartet". Automation/routines.json sagt dazu ausdrücklich: „Beide Skripte
 * gehen ueber ein 'warn' hinaus, blockieren aber keinen Push."
 *
 * ⛔ HIER STEHT ABSICHTLICH KEINE ZAHL MEHR (08.09.2026). Bis heute stand da
 * „taschkil (25 echte von 37)" — gemessen waren es „30 Befunde in 26
 * verschiedenen Woertern". Weder 25 noch 37 kam in der Ausgabe vor. Eine von
 * Hand gepflegte Zahl in einem WERKZEUG ist die gefaehrlichste Sorte: man
 * glaubt ihr. Der Pruefer nennt seine Zahl selbst, und zwar richtig.
 * [[zahlen_ohne_beleg]]
 *
 * Deshalb trennt die Schlusszeile: „rot, wartet auf Elias" von „rot, echter
 * Mangel". Ein Werkzeug, das dauerhaft rot steht, wird sonst überlesen.
 *
 * ==========================================================================
 * ⛔ AUFRUFER: bisher nur von Hand (Nachtschicht, eigene Läufe).
 *
 * Es steht NICHT im Wartungs-Prompt — der liegt unter Automation/ und gehört
 * nicht zu diesem Ordner. Ob er dort eingetragen wird, entscheidet Elias; der
 * Punkt liegt auf seiner Warteseite. Ein Werkzeug ohne Aufrufer ist sonst
 * genau der Fehler, vor dem [[werkzeug_ohne_aufrufer]] warnt — hier ist der
 * Aufrufer ein Mensch, und das steht hier, damit es niemand für ein Versehen
 * hält.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const HIER = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HIER, '..');
const KNAPP = process.argv.includes('--knapp');

/* Die Liste stammt aus dem Wartungs-Prompt (Abschnitt „Prüfungen"), am
   21.08.2026 abgeglichen. `pruefe-wortfelder.js` wird dort mit `--fenster`
   aufgerufen — ohne den Schalter misst es den ganzen Abzug statt Elias'
   Fenster und meldet Zahlen, die nichts mit seinem Lernstand zu tun haben. */
const PRUEFER = [
  ['validate.js', []],
  ['pruefe-duplikate.js', []],
  ['pruefe-erreichbarkeit.js', []],
  ['pruefe-eselsbruecken.js', []],
  ['pruefe-funktionen.js', []],
  ['pruefe-markierungen.js', []],
  ['pruefe-quran.js', []],
  ['pruefe-saetze.js', []],
  ['pruefe-sprecher.js', []],
  /* ⛔ Neu am 06.09.2026 — und der Anlass ist, dass es sie schon geben SOLLTE:
     ueber SUCH_ZEICHEN in js/kategorien.js stand seit Wochen „danach an
     bekannten Faellen geeicht (siehe pruefe-suche.js)", und die Datei hat nie
     existiert. Die Zeichenklasse der Suche ist genau die Sorte, die lautlos
     kaputtgeht: verschluckt sie einen Grundbuchstaben, findet die Suche
     nichts mehr — und ein Nicht-Treffer sieht aus wie ein Wort, das es nicht
     gibt. [[erfundene_begruendung_schliesst_den_fall]] */
  ['pruefe-suche.js', []],
  ['pruefe-taschkil.js', []],
  ['pruefe-transkripte.js', []],
  /* ⛔ Neu am 06.09.2026. Sie wacht darueber, dass keine Uebungsaufgabe ihre
     eigene Antwort verraet — weder im arabischen Regelnamen noch in der
     deutschen Uebersetzung. Elias hatte es an تِلْكَ gemeldet: „man kann hier
     die antwort direkt schon sehen … so ist ja keine uebung."
     Der Mangel kommt durch JEDE neue Regel und JEDEN neuen Satz zurueck, und
     die Schranke in js/uebung.js laesst sich lautlos entfernen; deshalb
     gehoert sie in den Sammellauf und nicht in die Hand des Zufalls.
     [[wirkung_an_der_quelle_stilllegen]] */
  ['pruefe-uebungen.js', []],
  ['pruefe-wortfelder.js', ['--fenster']],
  /* ⛔ Die einzige Pruefung, die "Elias hat eine aeltere Fassung" ueberhaupt
     bemerken kann. git push veroeffentlicht hier nichts; wer nur pusht, hat
     ein aktuelles Repo und eine alte Seite, ohne jede Fehlermeldung. Die
     Lehre stand bisher nur in CLAUDE.md und im Gedaechtnis — gemessen hat
     sie niemand. [[deploy_meldet_erfolg_ohne_produktion]] */
  ['werkzeuge/pruefe-ausgeliefert.mjs', []],
  /* ⛔ Neu am 06.09.2026, zu Elias' Ziel „komplett identische daten […] einfach
     alles". Ein neuer localStorage-Schluessel entsteht beilaeufig, und niemand
     denkt an SYNC_SCHLUESSEL — der Ausfall ist dann unsichtbar, weil auf jedem
     Geraet etwas Plausibles steht, nur eben Verschiedenes. Genau so lag
     vt_einzeln_frei monatelang. [[allgemeine_regel_statt_listeneintrag]] */
  /* ⛔ Neu am 07.09.2026, auf Elias' Punkt: „ich will nicht die ganze zeit
     berechtigungen geben muessen, beim ersten lauf das muss genuegen". Ein
     Befehl, der im Wartungs-Prompt steht, aber nicht in allowedTools, wird im
     -p-Modus abgelehnt — und eine abgelehnte Anweisung bricht die Routine
     NICHT ab: sie ueberspringt und meldet gruen.
     [[anleitung_ohne_berechtigung]] */
  ['werkzeuge/pruefe-freigaben.mjs', []],
  ['werkzeuge/pruefe-abgleich.mjs', []],
  ['werkzeuge/pruefe-artefakt-inhalt.mjs', []],
  ['werkzeuge/pruefe-datumsangaben.mjs', []],
  /* ⛔ Die EICHUNG dazu, und sie gehoert genauso in den Sammellauf wie der
     Pruefer selbst: sie weist nach, dass die 'Davor:'-Ausnahme nicht zu viel
     herausnimmt. Eine Ausnahme, die zu weit greift, macht den Pruefer blind —
     und ein blinder Pruefer sieht aus wie ein gruener.
     [[stoertest_muss_wirkung_nachweisen]] */
  ['werkzeuge/eiche-abschnittsfolge.mjs', []],
  /* ⛔ Prueft die ZAHLEN im Gedaechtnis gegen den Quelltext — ein anderer
     Blickwinkel als pruefe-gedaechtnis.mjs, das den Wortlaut prueft. Eine
     falsche Zahl ist schlimmer als eine fehlende, weil man ihr glaubt.
     [[blickwinkel_durchprobieren]] */
  ['werkzeuge/pruefe-gedaechtnis-zahlen.mjs', []],
  ['werkzeuge/pruefe-eigene-vorrang.mjs', []],
  ['werkzeuge/pruefe-erreichbarkeit-eichung.mjs', []],
  ['werkzeuge/pruefe-gedaechtnis.mjs', []],
  ['werkzeuge/pruefe-ids.mjs', []],
  /* Glossen an Markierungen: was die deutsche Uebersetzung nicht traegt.
     Waechst mit jedem neuen Satz mit — ohne Pruefer faellt eine fehlende
     Glosse nie auf, weil nichts fehlt, was man sehen koennte. */
  ['werkzeuge/pruefe-glossen.mjs', []],
  /* ⭐ K4: feiert das Hoer-Tagesziel auf ALLEN Wegen? Der Tageszaehler waechst
     an zwei Stellen — beim Antworten und im Geh-Modus —, und die Feier hing bis
     zum 08.09.2026 nur an der ersten. Der Pruefer schneidet hoerZielPruefen()
     aus js/hoeren.js heraus und faehrt sie; ein Nachbau haette den Fehler nie
     enthalten. [[testvorlage_selbst_nachgebaut]] */
  ['werkzeuge/pruefe-hoerziel.mjs', []],
  /* ⭐ Neu am 09.09.2026. „genau 2 ayaht und das wars" — der Rezitator brach
     bei ausgeschaltetem Bildschirm nach zwei Versen ab, weil Vers 3 einen
     neuen Ladevorgang brauchte. Seitdem zwei Elemente im Wechsel; der Pruefer
     schneidet die echten Funktionen aus js/quran-audio.js und zaehlt
     Ladevorgaenge. Sein Stoertest baut die alte Ein-Element-Fassung nach und
     verlangt, dass sie den zweiten Ladevorgang zeigt. [[hintergrund_tab_drosselt_timer]] */
  ['werkzeuge/pruefe-zweipuffer.mjs', []],
  ['werkzeuge/pruefe-schreibanlass.mjs', []],
  /* ⭐⭐ Neu am 09.09.2026, aus dem Konfetti-Fall heraus: der Fehler sass in
     einem leeren `catch {}` und war auf Elias' Geraet deshalb nicht
     auffindbar. Seitdem traegt JEDER schweigende catch-Block entweder seine
     Begruendung oder meldet ueber `stillerFehler()` in die Diagnosekarte.
     ⚠️ Zuerst laeuft die EICHUNG des Werkzeugs, das beide zaehlt: die erste
     Zaehlung meldete „37, darunter feier.js 1" — und der Treffer in feier.js
     sass in einem Kommentar, der genau dieses Problem beschreibt.
     [[stichworttreffer_im_kommentar]] */
  ['werkzeuge/pruefe-js-quelltext.mjs', []],
  ['werkzeuge/pruefe-stille-fehler.mjs', []],
  /* ⭐⭐ Neu am 09.09.2026. Vier Dateien lasen „46:29" in Sekunden um, alle vier
     mit derselben abgeschriebenen Zeile — und alle vier machten aus einem
     LEEREN Stempel die Zahl 0 statt null. Jeder Aufrufer prueft ausdruecklich
     auf null; an dieser Zeile lief der Schutz ins Leere, und gemessen wurde
     der Anfang der Folge. Der Pruefer schneidet jede solche Funktion aus dem
     Quelltext und BEFRAGT sie — kein Blick auf einen Kommentar.
     [[entscheidung_gilt_fuer_das_zweite_werkzeug]] [[ausfall_ist_unsichtbar_gebaut]] */
  ['werkzeuge/pruefe-zeitmarken.mjs', []],
  /* ⭐⭐ Neu am 09.09.2026. werkzeuge/vorschlaege-holen.mjs lief auf Elias'
     Rechner NIE — `execFileSync('npx.cmd', …)` wirft unter Windows seit
     Node 20 EINVAL. Der Schaden war nicht der Absturz, sondern was er
     verdeckte: das Werkzeug sah aus wie eines ohne Aufrufer und war eines,
     das gar nicht laufen konnte. Beim ersten geglueckten Lauf lag eine
     Ablehnung von ihm seit Stunden unbearbeitet.
     [[werkzeug_ohne_aufrufer]] [[ein_weg_geht_der_andere_nicht]] */
  ['werkzeuge/pruefe-werkzeugaufrufe.mjs', []],
  /* ⭐⭐ Neu am 09.09.2026, die Schwesterpruefung zu pruefe-abgleich.mjs: dort
     zwei GERAETE, hier zwei ZEITPUNKTE. In js/einstellungen.js stand zweimal
     derselbe Satz („wer eine Sicherung einspielte, verlor X lautlos") — und
     gemessen fehlten elf Abgleich-Schluessel in der Sicherung, darunter der
     Uebungsstand, die einzeln freigeschalteten Woerter und die gemessene
     Lernzeit. Der Rundlauf laeuft mit der ECHTEN baueSicherung().
     [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
  ['werkzeuge/pruefe-sicherung.mjs', []],
  /* ⭐ Neu am 09.09.2026 (Punkt 4 der Warteschlange). Er hat drei Anlaeufe
     gebraucht, und jeder Fehler war lehrreich: durch die Shell geschrieben
     verlor das `\b` seine Bedeutung (0 Befunde statt 2); im kommentarfreien
     Text gesucht sahen 25 Funktionen tot aus, weil ihre Aufrufe in einem
     `onclick="…"` stehen — also in einer Zeichenkette; und fuenf benannte
     IIFEs brauchen ueberhaupt keinen Aufrufer. Uebrig bleibt genau EINE,
     und die wartet auf Elias. [[mein_neues_werkzeug_ist_verdaechtig]] */
  ['werkzeuge/funktionen-ohne-aufrufer.mjs', []],
  /* ⭐⭐ Neu am 09.09.2026. Seit dieser Nacht laeuft die ganze Fehlermeldung
     der App ueber die Diagnosekarte — und die fragt jede ihrer neun Quellen
     mit `typeof x === 'function'` ab. Das ist richtig, heisst aber: wird eine
     umbenannt, steht dort still ein Strich, und der Ausfall des Messwerkzeugs
     sieht aus wie „nichts zu melden". [[leere_liste_ist_keine_messung]] */
  ['werkzeuge/pruefe-diagnosekarte.mjs', []],
  /* ⭐⭐ Neu am 09.09.2026. `js/zeitmessung.js` (195 Zeilen) wurde bis dahin von
     KEINEM Pruefer genannt — ausgerechnet die Stelle, die alle 5 Sekunden
     schreibt und in der Nacht davor 750 von 1000 KV-Schreibvorgaengen
     verursacht hat. Geprueft wird beides: dass sie richtig rechnet (zwei
     Geraete am selben Tag werden SUMMIERT, nicht maximiert) und dass ihre
     Zahl in KEINER Oberflaeche auftaucht — Elias am 08.09.: „am besten mir
     nicht sagen." [[adhs_enkodieren_ist_die_luecke]] */
  ['werkzeuge/pruefe-zeitmessung.mjs', []],
  /* ⭐⭐ Und der Waechter ueber das Werkzeug, auf dem vier Pruefer stehen:
     `js-quelltext.mjs` verlor bei VERSCHACHTELTEN Template-Literalen den
     Faden (js/kategorien.js:142). Ab dort galt Code als Zeichenkette — vier
     Pruefer massen still zu wenig, keiner wurde rot. Gefunden hat es der
     Stoertest eines fuenften. [[gruener_pruefer_beweist_nur_geprueftes]] */
  ['werkzeuge/pruefe-stripper.mjs', []],
  /* ⭐⭐ Neu am 09.09.2026. `js/sprachausgabe.js` hatte bis zum 16.08. KEINEN
     Fehlerpfad — Elias' Tablet schwieg, und aus der Ferne war nichts zu
     messen. Seitdem meldet die Datei DREI Arten von Schweigen; geprueft hat
     das bisher niemand. Der Pruefer schneidet `speakArabic()` aus und stellt
     jede der drei nach, darunter den gefaehrlichsten Fall: onstart und acht
     Millisekunden spaeter onend — kein Fehler, kein Ton. */
  ['werkzeuge/pruefe-sprachausgabe.mjs', []],
  /* ⭐⭐ Neu am 09.09.2026, die dritte und letzte Datei ohne Pruefer.
     `js/init.js` sperrt das Browsermenue („grundsaetzlich auf der app nichts
     zu suchen") — MIT einer Ausnahme fuer Eingabefelder, denn dort ist das
     lange Druecken der einzige Weg zu „Einfuegen". Genau solche Ausnahmen
     verschwinden bei der naechsten Vereinfachung als „unnoetig".
     Stoertest: Ausnahme entfernt -> 7 Befunde. */
  ['werkzeuge/pruefe-start.mjs', []],
  /* ⭐⭐ Neu am 09.09.2026, aus einem Satz von Elias derselben Nacht: „warum
     ist cyan immer standart hier am pc als farbe? das habe ich nie gewollt,
     ich will tirch red haben satndartmässig". Eine Vorgabefarbe kippt beim
     Umsortieren einer Liste unbemerkt — und er sieht es Tage spaeter an einem
     Bildschirm, der ploetzlich anders aussieht. Geprueft wird zusaetzlich,
     dass alle DREI Stellen dieselbe Farbe meinen (Marke „heute", Rueckfall,
     AKZENT_HEUTE) und dass die Adressleiste schwarz bleibt.
     [[entscheidung_gilt_fuer_das_zweite_werkzeug]] */
  ['werkzeuge/pruefe-akzentfarbe.mjs', []],
  /* ⭐⭐ Neu am 09.09.2026, die letzte Datei in js/ ohne Pruefer. Der Satz, um
     den es geht, steht als Kommentar in js/vokabelpaket.js: „Bereits
     ausgelieferte Dateien gewinnen — sie sind die Quelle, an der validate.js
     und die Pruefskripte haengen." Faellt der Vorrang weg, ueberschreibt ein
     aelteres Paket die ausgelieferten Daten, und danach messen ALLE Pruefer
     gegen einen Bestand, den niemand mehr kontrolliert.
     Stoertest: Vorrang entfernt -> gemeldet. [[eigener_bestand_vor_woerterbuch]] */
  ['werkzeuge/pruefe-vokabelpaket.mjs', []],
  /* ⭐ Neu am 09.09.2026 (Punkt 5). Von 545 definierten CSS-Klassen haben 8
     keine Fundstelle; 16 weitere sahen so aus und werden zur Laufzeit
     zusammengesetzt — der Pruefer liefert je Verdacht den BELEG mit, weil ein
     reiner Praefixtest zu grosszuegig ist (er hielt `sent-thema` fuer „gebaut
     aus sent"). Rot wird er nur, wenn die Zahl STEIGT.
     [[kandidatenliste_ist_keine_fehlerliste]] */
  ['werkzeuge/klassen-ohne-fundstelle.mjs', []],
  /* ⛔ Ohne diese Zeile haette pruefe-muster.mjs keinen Aufrufer und liefe nie.
     Genau der Fehler, den es selbst sucht, in seiner allgemeinen Form: gebaut,
     gepusht, ausgeliefert — und nie gestartet. [[werkzeug_ohne_aufrufer]] */
  ['werkzeuge/pruefe-muster.mjs', []],
  /* ⭐ Neu am 09.09.2026. An einem Abend drei Stellen gefunden, an denen die
     App auf schmalen Handys quer rollte — und keine davon hatte Elias je
     gemeldet. Immer dieselbe Ursache: ein schrumpfbares Flex-Kind ohne
     `min-width:0`. Kein anderer Pruefer kann das sehen; Ueberlauf ist Layout.
     ⚠️ Der Pruefer meldet KANDIDATEN und wird nur rot, wenn sein eigener
     Stoertest nicht greift. [[layout_min_width_falle]] */
  ['werkzeuge/pruefe-flexbreite.mjs', []],
  ['werkzeuge/pruefe-plural-thema.mjs', []],
  /* Die Ueberkategorien des Satzmodus altern still: SATZ_THEMEN ordnet ueber
     ein Muster auf die id zu, eine frei gewaehlte id landet also in KEINER
     Kategorie — ohne Fehler und ohne Warnung. Elias am 26.08.2026: "darum
     kuemmert sich aktuell niemand aber stetig geht es hier voran." */
  ['werkzeuge/pruefe-themen.mjs', []],
  /* ⛔ Verhindert den siebzehnten Fall: in der Nacht auf den 21.08.2026 kamen
     SECHZEHN Eintraege hier dazu — acht Pruefstaende, sieben Eichungen, ein
     Pruefer. Alle waren gebaut, gepusht und nie gestartet worden, und keiner
     hat es gemerkt. Diese Pruefung meldet, wer kuenftig herumliegt.
     Ihr erster Lauf fand sofort einen echten Fall: pruefe-sprecher.js.
     [[allgemeine_regel_statt_listeneintrag]] */
  ['werkzeuge/pruefe-sammellauf.mjs', []],
  /* ⛔ Verhindert die achte Entscheidungsseite, die stumm speichert. Sechs
     von sieben waren es in der Nacht auf den 21.08.2026, zwei starben dabei
     sogar beim Laden. [[allgemeine_regel_statt_listeneintrag]] */
  ['werkzeuge/pruefe-seitenspeicher.mjs', []],
  ['werkzeuge/pruefe-schreibpfade.mjs', []],
  ['werkzeuge/pruefe-volles-programm.mjs', []],
  /* ⛔ SIEBEN PRUEFSTAENDE, DIE BIS ZUM 21.08.2026 NIEMAND GESTARTET HAT.
     Sie fahren die echte App-Logik in einem vm gegen einen DOM-Stub hoch —
     also genau das, was kein anderer Pruefer hier tut. Gefunden wurden sie
     bei der Suche nach fest eingetragenen Zahlen; ein grep nach ihren Namen
     ergab NULL Treffer ausserhalb der Dateien selbst.

     Fuenf von acht waren rot, und keiner davon wegen eines Fehlers in der
     App: dreimal hatte sich die App auf Elias' ausdruecklichen Wunsch
     geaendert (16.08. Leitner-Stufen, 17.08. Umbenennung, 18.08. Leiste
     spaeter zurueck) und der Pruefstand blieb stehen. Einmal hatte eine
     Funktion zwei Rueckgabefelder dazubekommen.

     ⭐ Ein Pruefstand ohne Aufrufer altert genauso schnell wie der Code, den
     er pruefen soll — er sagt es nur niemandem. Deshalb stehen sie jetzt
     hier. [[werkzeug_ohne_aufrufer]] */
  ['test-antwortformat.mjs', []],
  ['test-feld-ergaenzungen.mjs', []],
  ['test-lernstand-zuwachs.mjs', []],
  /* ⭐ Die Pruefung, die nicht nach Fehlern sucht, sondern nach FEHLENDEN
     VERBINDUNGEN: welchen Speicher wertet niemand aus, welche erzeugte Datei
     ist aelter als ihre Quelle. Diese Fehlerart meldet sich nie von selbst —
     alles sieht richtig aus, es passiert nur nichts. (24.08.2026) */
  ['werkzeuge/pruefe-kreislaeufe.mjs', []],
  ['test-buecher.mjs', []],
  ['test-p1.mjs', []],
  ['test-p6.mjs', []],
  ['test-p8.mjs', []],
  ['test-woerterbuch-belege.mjs', []],
  ['test-langenscheidt.mjs', []],
  ['test-laut.mjs', []],
  ['test-tagesdeckel.mjs', []],
  ['test-wiedereinstieg.mjs', []],
  ['test-satz-tagesziel.mjs', []],
  ['test-quote.mjs', []],
  ['test-trefferflaechen.mjs', []],
  ['test-schreibweisen.mjs', []],
  ['test-p9.mjs', []],

  /* ⛔ Neu am 06.09.2026. Der Hifz-Stand ist das Einzige in dieser App, das
     Elias sich WIRKLICH erarbeitet hat — auswendig gelernte Suren. Er lief
     bis dahin ueber den Blockersatz und ging beim Geraetewechsel verloren.
     Der Test misst genau seinen Fall: Handy markiert Sure 99, Tablet Sure 112. */
  /* ⛔ Neu am 07.09.2026. Der Tausch LOESCHT eine Karteikarte — was daran
     haengt (Fortschritt, Notiz, eigene Eselsbruecke) ist selbst erarbeitet
     und nicht wiederherstellbar. Ein Fehler hier ist kein
     Schoenheitsfehler, sondern ein Verlust. */
  ['test-dublette.mjs', []],
  ['test-auswahl-einzelnfrei.mjs', []],
  ['test-tippen-beide-richtungen.mjs', []],
  ['test-quote-karteikarten.mjs', []],
  ['test-arabicroots-differenz.mjs', []],
  ['test-hifz-sync.mjs', []],  ['test-sync.mjs', []],
  ['test-sync-anzeige.mjs', []],
  ['test-wurzel.mjs', []],
  /* ⭐ VIER EICHUNGEN, die bis zum 21.08.2026 ebenfalls niemand gestartet hat.
     Sie halten Grenzfaelle fest, die teuer erkauft wurden — etwa die
     Zahlwort-Trennung, deren erster Entwurf 8 von 9 Faellen in beide
     Richtungen falsch traf.

     ⛔ ES SIND VIER VON SIEBEN, und der Unterschied ist der ganze Punkt:
     diese vier lesen die Bedingung, die sie pruefen, AUS DER QUELLDATEI.
       eiche-datumsmuster      <- werkzeuge/pruefe-datumsangaben.mjs
       eiche-fragenreihenfolge <- werkzeuge/vorrat.mjs, data/feld-ausnahmen.js
       eiche-wortart-knopf     <- werkzeuge/wartungsfragen-artefakt.mjs
       eiche-zahlplural        <- validate.js (const ZAHLWORT)

     ⭐ Am 21.08.2026 trugen DREI von ihnen ihre Bedingung als Kopie und
     prueften damit sich selbst. Alle drei sind seither umgebaut:
       eiche-harf-jarr      liest harf-jarr-fi-ala-01 aus pruefe-markierungen.js
       eiche-plural-beleg   prueft ihre Fassung gegen werkzeuge/aussenbelege.mjs
       eiche-taschkil-beleg laedt harakaAnStelle aus werkzeuge/aussenbelege.mjs

     ⛔ Bei der letzten war es kein blosser Vorsichtsfall: ihre Kopie WICH
     BEREITS AB. Ihrem DIA fehlten U+200E und U+200F, die beiden
     RTL-Steuerzeichen, die aussenbelege.mjs ueber seine Konstante STEUER
     sehr wohl entfernt — sie prueft also ein anderes Skelett als das, was
     laeuft, und meldete trotzdem gruen. Dazu stand SCH als /ّ/ statt
     /\u0651/ da, obwohl die Quelle eine Zeile darueber ausdruecklich davor
     warnt („Als \u-Folgen, nie sichtbar kopiert").
     [[handliste_neben_echter_quelle]] [[zeichenklasse_nie_sichtbar_kopieren]]

     ⭐ eiche-zahlplural sagt diese Lehre in seinem eigenen Kopf („Die Regex
     wird NICHT nachgebaut, sondern aus validate.js gelesen") — sie war beim
     Bauen also bekannt und ist bei den drei anderen trotzdem nicht
     angewandt worden.

     Stoertest vor dem Eintrag: in validate.js Z. 205 „|drei|" aus der
     ZAHLWORT-Regex entfernt (Gegenprobe: 0 Treffer danach) -> die Eichung
     meldet „2 Abweichungen, die Zahlwort-Pruefung trifft nicht mehr, was
     sie soll". Danach per cp zurueck, sha256 gegengeprueft. */
  ['werkzeuge/eiche-harf-jarr.mjs', []],
  ['werkzeuge/eiche-datumsmuster.mjs', []],
  ['werkzeuge/eiche-plural-beleg.mjs', []],
  ['werkzeuge/eiche-taschkil-beleg.mjs', []],
  ['werkzeuge/eiche-fragenreihenfolge.mjs', []],
  ['werkzeuge/eiche-wortart-knopf.mjs', []],
  ['werkzeuge/eiche-zahlplural.mjs', []]
];

/* ⛔ pruefe-oberflaeche.js läuft NICHT unter node — es prüft die laufende App
   und braucht Browser, DOM und localStorage. Sein Exitcode 3 heißt „falsch
   aufgerufen", nicht „Fehler gefunden". Es hier mitlaufen zu lassen hieße,
   jeden Lauf mit einem falschen Rot zu beginnen. */
const NUR_IM_BROWSER = ['pruefe-oberflaeche.js'];

/* ⭐ test-p8.mjs stand bis zum 21.08.2026 NICHT in der Liste oben: es
   stuerzte beim Laden ab, und ein Rot, das immer da ist, liest irgendwann
   niemand mehr. Seit es 22/22 meldet, laeuft es mit.

   Der Weg dorthin steht im Pruefstand selbst; hier nur das, was fuer die
   Liste wichtig ist: zehn der test-*.mjs fahren die ECHTE App-Logik in
   einem vm gegen einen DOM-Stub hoch. Bricht einer, liegt der Fehler
   haeufiger im Pruefstand als in der App — von den fuenf roten waren es
   fuenf von fuenf. Erst lesen, was er misst, dann die App verdaechtigen.
   [[testfehler_kann_echten_mangel_zeigen]]

   ⚠️ `test-lernstand-zuwachs.mjs` gehoert NICHT dazu: er laedt keine App,
   sondern schneidet den Entscheidungsblock aus `werkzeuge/vorrat.mjs`
   heraus und fuehrt ihn mit gestellten Staenden aus. Passt sein Anker
   nicht mehr genau 1x, bricht er mit Exitcode 3 ab, statt gruen zu
   werden. Die Zahl oben stand bis zum 21.08.2026 auf „acht" —
   nachgezaehlt waren es zehn. [[stand_besteht_aus_mehreren_zahlen]] */

/* ---------- Wer prueft, ob jeder Pruefer aufgerufen wird? (09.09.2026) ----------

   ⛔⛔ Der Fehler, den diese Datei an zwei Stellen selbst beschreibt („Ohne
   diese Zeile haette pruefe-muster.mjs keinen Aufrufer … gebaut, gepusht,
   ausgeliefert — und nie gestartet"), wurde bisher von NIEMANDEM gemessen. Ein
   neuer Pruefer, den man einzutragen vergisst, faellt nicht auf: der
   Sammellauf meldet gruen, weil er ihn gar nicht kennt.
   [[werkzeug_ohne_aufrufer]] [[allgemeine_regel_statt_listeneintrag]]

   ⭐ Gemessen am 09.09.2026: 35 in werkzeuge/, 40 im Wurzelordner, keiner
   fehlte. Die Pruefung kostet einen readdir und haelt das so. */
{
  const inListe = new Set(PRUEFER.map(([rel]) => rel));
  const vergessen = [];
  for (const f of fs.readdirSync(path.join(REPO, 'werkzeuge')))
    if (/^(?:pruefe|eiche|test)-.*\.mjs$/.test(f) && !inListe.has('werkzeuge/' + f)) vergessen.push('werkzeuge/' + f);
  for (const f of fs.readdirSync(REPO))
    if (/^(?:pruefe|test)-.*\.(?:js|mjs)$/.test(f) && !inListe.has(f) && !NUR_IM_BROWSER.includes(f)) vergessen.push(f);
  if (vergessen.length){
    console.log('');
    console.log('⛔ ' + vergessen.length + ' Pruefer stehen im Ordner, aber NICHT in der Liste oben —');
    console.log('   sie sind gebaut und laufen nie:');
    vergessen.forEach(f => console.log('     ' + f));
    console.log('   Eintragen (mit einem Satz, wozu) oder loeschen. Ein dritter Weg waere,');
    console.log('   sie liegen zu lassen und zu vergessen — genau das soll das hier verhindern.');
    console.log('');
  }
}

const ergebnisse = [];
for (const [rel, args] of PRUEFER){
  const datei = path.join(REPO, rel);
  if (!fs.existsSync(datei)){
    ergebnisse.push({ rel, code: null, letzte: '⛔ Datei fehlt' });
    continue;
  }
  let code = 0, aus = '';
  try { aus = execFileSync('node', [rel, ...args], { cwd: REPO, encoding: 'utf8' }); }
  catch (e){ code = typeof e.status === 'number' ? e.status : -1; aus = (e.stdout || '') + (e.stderr || ''); }
  const zeilen = aus.split(/\r?\n/).filter(l => l.trim());
  /* ⛔ NICHT einfach die letzte Zeile: bei drei Pruefern ist das die
     Fortsetzung eines mehrzeiligen Urteils, und die liest sich ohne die
     Zeile darueber wie ein Bruchstueck ("und die Zitate in grammar-data.js
     bleiben Kurzzitate."). Gesucht ist die letzte NICHT eingerueckte Zeile
     — dort faengt das Urteil an. */
  let i = zeilen.length - 1;
  while (i > 0 && /^\s/.test(zeilen[i])) i--;
  const urteil = zeilen.slice(i).join(' ').replace(/\s+/g, ' ').trim();
  ergebnisse.push({ rel, code, letzte: urteil || '(keine Ausgabe)' });
  if (!KNAPP){
    console.log('─'.repeat(74));
    console.log('  ' + rel + (args.length ? ' ' + args.join(' ') : '') + '   → exit ' + code);
    zeilen.slice(-3).forEach(l => console.log('    ' + l.slice(0, 100)));
  }
}

/* ---------- Übersicht ---------- */
console.log('');
console.log('═'.repeat(74));
console.log('  ÜBERSICHT — ' + new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }));
console.log('═'.repeat(74));
const breit = Math.max(...ergebnisse.map(e => e.rel.length));
for (const e of ergebnisse)
  console.log('  ' + (e.code === 0 ? '✅' : '⛔') + ' ' + e.rel.padEnd(breit)
    + '  exit ' + String(e.code).padStart(2) + '   ' + e.letzte.slice(0, 68));

const rot = ergebnisse.filter(e => e.code !== 0);
console.log('');
console.log('  ' + ergebnisse.length + ' Prüfer gelaufen, ' + rot.length + ' rot.');
console.log('  (' + NUR_IM_BROWSER.join(', ') + ' läuft nur im Browser und ist nicht dabei.)');

/* ⛔⛔ WANN LIEF ER ZULETZT? (09.09.2026)
   Die Zeile darüber sagte bisher nur, DASS er nicht dabei ist. Damit wusste
   niemand, ob er vor einer Stunde oder vor sechs Wochen lief — und ein
   Prüfer, an den sich jemand erinnern muss, ist ein unbewachter.
   [[routine_ohne_termin_ist_unbewacht]] [[waechter_meldet_ausgeschalteten_rechner]]

   ⚠️ Das ist bewusst KEIN Rot: der Lauf braucht einen Browser, und ein Rot,
   das man in einer Terminalsitzung nicht abstellen kann, wird nach dreimal
   überlesen. Es ist eine Zeile, die auffällt, solange sie zutrifft.
   Der Stempel wird von Hand geschrieben — von dem, der den Lauf gemacht hat;
   die Anleitung dazu steht in der Datei selbst. */
try {
  const p = new URL('../data/oberflaeche-lauf.json', import.meta.url);
  const s = JSON.parse(fs.readFileSync(p, 'utf8'));
  const tage = Math.floor((Date.now() - new Date(s.gelaufen + 'T12:00:00').getTime()) / 86400000);
  const zeile = '  └ zuletzt gelaufen: ' + s.gelaufen + ' (' + s.fassung + ') — '
    + s.pruefungen + ' Prüfungen, ' + s.fehler + ' Fehler, ' + s.hinweise + ' Hinweise';
  if (tage > 7) console.log(zeile + '  ⚠️ das ist ' + tage + ' Tage her.');
  else console.log(zeile + '.');
} catch (e) {
  console.log('  └ ⚠️ data/oberflaeche-lauf.json fehlt oder ist unlesbar — es ist NICHT');
  console.log('    bekannt, wann die Oberfläche zuletzt geprüft wurde.');
}

if (rot.length){
  console.log('');
  console.log('  ⚠️ ROT heißt NICHT automatisch „kaputt". Die Exitcodes sind uneinheitlich:');
  console.log('     pruefe-duplikate.js: 2 = Befunde für Elias, 1 = Werkzeugfehler');
  console.log('     pruefe-taschkil.js:  1 = BEIDES');
  console.log('     Die letzte Zeile oben sagt, was gemeint ist — sie lesen, nicht nur den Code.');
  console.log('     Bekannt und in Ordnung: duplikate, taschkil und themen warten auf');
  console.log('     Elias und stehen auf seiner Seite „Was auf dich wartet". Ihre Zahlen');
  console.log('     nennen sie selbst — hier steht keine nachgepflegte mehr.');
}

/* ⛔ Der eigene Exitcode meldet nur, ob ALLE gelaufen sind — nicht, ob alle
   grün sind. Sonst stünde dieses Werkzeug wegen der zwei wartenden Prüfer
   dauerhaft rot und würde nach dem dritten Lauf überlesen. */
const nichtGelaufen = ergebnisse.filter(e => e.code === null || e.code === -1);
if (nichtGelaufen.length){
  console.log('');
  console.log('  ⛔ ' + nichtGelaufen.length + ' Prüfer konnten gar nicht laufen:');
  nichtGelaufen.forEach(e => console.log('     ' + e.rel + '  ' + e.letzte.slice(0, 60)));
}
process.exit(nichtGelaufen.length ? 1 : 0);
