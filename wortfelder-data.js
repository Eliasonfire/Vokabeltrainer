/* ===================== Wortfelder =====================
   Die Kategorien-Ansicht hatte bisher einen Reiter "Wortstämme": die
   dreibuchstabige arabische Wurzel, unter der alle Ableitungen zusammenstehen.
   Elias am 29.07.2026:

     "Bei den Wortstämmen finde ich machen 3 random arabische Buchstaben für
      mich als Wortstamm keinen Sinn. Lieber sollten sie als das
      zusammengefasst werden was die wirklich gemeinsam haben auf deutsch wie
      'Tag' und 'Länder' und 'Tiere' und 'Schule' und 'Adjektive' und 'Verben'
      und 'Partikel' und 'Genitivpräpositionen' und 'Körperteile' usw. Es
      können auch gerne mehrere Wörter in mehreren Wortstämmen gleichzeitig
      sein."

   Daher diese Tabelle. Zwei Sorten von Feldern, und der Unterschied ist wichtig:

   1. `typ` — kommt DIREKT aus dem arabicroots-Abzug (Feld `type`). Verben,
      Adjektive, Partikeln, Adverbien, Wendungen sind damit exakt, nicht
      geschaetzt.

   2. `woerter` — deutsche Suchwoerter, geprueft gegen die deutsche Uebersetzung
      der Vokabel. Das ist eine LESUNG der vorhandenen Uebersetzung, keine neue
      Sprachinformation: dass "Hund" ein Tier ist, steht nicht im Lehrwerk,
      sondern im Deutschen. Grammatik, Vokabeln oder Koranstellen werden hier
      nirgends erfunden (Goal-Prompt E.1) — es wird nur sortiert, was ohnehin
      schon dasteht.

   Ein Wort darf in mehreren Feldern stehen; genau das hat Elias verlangt.
   "Mutter" ist Familie UND Mensch, "Schultasche" ist Schule.

   Was NICHT passt, verschwindet nicht: `wortfelder()` in js/kern.js sammelt den
   Rest unter "Noch ohne Wortfeld". Eine Vokabel darf durch diese Ansicht nicht
   unauffindbar werden.

   Getroffen wird nur ein GANZES deutsches Wort, oder ein Wortanfang mit Stern:
   "schul*" faengt Schule, Schüler, Schultasche. Ueber die Wortendung wird
   NICHT gesucht — der Versuch stand hier kurz und zog "durchbohren" zu Ohren,
   "unterdrücken" zu Rücken und "gottesfürchtiger" zu Tiger (js/kern.js,
   `wortfeldTreffer`). Komposita gehoeren deshalb ausgeschrieben in die Listen.

   `nicht: [...]` kippt einen Treffer wieder. Gebraucht fuer Doppeldeutigkeiten
   des Deutschen: "ich weiss nicht" ist keine Farbe.
   ===================================================================== */
const WORTFELDER = [
  /* ---- Aus dem Abzug, ohne Auslegung ---- */
  { name: 'Nomen',       typ: 'noun' },
  { name: 'Verben',      typ: 'verb' },
  { name: 'Adjektive',   typ: 'adjective' },
  { name: 'Adverbien',   typ: 'adverb', woerter: ['auch', 'ebenfalls', 'sehr', 'immer', 'nie', 'oft', 'manchmal'] },
  { name: 'Wendungen',   typ: ['expression', 'phrase'] },
  { name: 'Grammatik-Begriffe', typ: 'grammar' },

  /* ---- Partikeln, mit einer Ausnahmeliste ----
     ⭐ Elias hat am 29.07.2026 von sich aus gefragt: "bist du dir sicher, dass
     bei den Partikeln تَحْتَ, هُنَا … reingehören? Und ja und nein?" Die Frage war
     berechtigt, und die Antwort steht in SEINEM eigenen Unterricht:

       `wortarten-01` (Folge 08, ca. 24:41): "Deshalb zählen im Arabischen auch
       Adjektive, Adverbien, Ortsangaben und die Hinweiswörter … als Nomen."
       `zarf-als-mudaf-01` (Folge 08, ca. 24:27): "Die Ortsangabe ist ein Nomen
       (اِسْم) – تَحْتَ gehört zu den Adverbien und ist deshalb ein اِسْم."
       `zarf-01` (Folge 07, ca. 14:46): "تَحْتَ zählt selbst NICHT zu den
       حُروف الجَرّ."

     arabicroots führt sie trotzdem als `particle`. Das ist ein **Widerspruch
     zwischen Abzug und Unterricht**, und nach Elias' stehender Regel wird da
     keine Seite still gewählt: die Wortart im Abzug bleibt unangetastet, aber
     die Wortfeld-Ansicht folgt dem Unterricht und zeigt sie unter „Zeit- &
     Ortsangaben" statt unter „Partikeln".

     نَعَمْ (ja) und لَا (nein) behandelt der Unterricht NICHT. Sie bleiben
     deshalb dort, wo der Abzug sie hat — nichts anderes wäre belegbar. */
  { name: 'Partikeln',   typ: 'particle', nichtFormen: ['تَحْتَ', 'هُنَا', 'هُنَاكَ', 'الآنَ', 'أَمَامَ', 'خَلْفَ', 'فَوْقَ'] },
  { name: 'Zeit- & Ortsangaben (ظَرْف)', formen: ['تَحْتَ', 'هُنَا', 'هُنَاكَ', 'الآنَ', 'أَمَامَ', 'خَلْفَ', 'فَوْقَ', 'بَيْنَ', 'عِنْدَ', 'بَعْدَ', 'قَبْلَ'] },

  /* ---- Genitivpräpositionen ----
     Bewusst KEINE eigene Liste von Praepositionen, sondern genau die, die der
     Unterricht als حُروف الجَرّ eingefuehrt hat und die in grammar-data.js
     belegt sind: فِي und عَلَى (`fi-ala-01`, Folge 06), مِنْ und إِلَى
     (`min-ila-01`), لِ (`li-besitz-01`, `lil-verschmelzung-01`).
     عَنْ, بِ, كَ stehen NICHT dabei — sie kommen in Elias' Stunden bisher nicht
     vor, und eine Regel, die er noch nicht kennt, gehoert nicht in die App
     (seine Vorgabe vom 29.07.2026). Kommen sie dran, gehoeren sie hierher.

     Die Formen stehen MIT Vokalzeichen und einzeln je Schreibvariante. Ohne
     Taschkil ist مِنْ min "von" nicht von مَنْ man "wer" zu unterscheiden — und
     beide sind Partikeln, die Wortart trennt sie also nicht. مَنْ stand beim
     ersten Messen faelschlich in diesem Feld. */
  { name: 'Genitivpräpositionen', formen: ['فِي', 'عَلَى', 'مِنْ', 'مِنَ', 'إِلَى', 'ل', 'لِ'] },

  /* ---- Von Elias am 29.07.2026 nachgefordert ----
     Er ist die Liste „Noch ohne Wortfeld" durchgegangen und hat Feld für Feld
     gesagt, wo die Wörter hingehören. Die vier Felder hier sind seine. */
  { name: 'Sprache & Wörter', woerter: [
    'Sprache', 'Sprachen', 'Arabisch', 'Englisch', 'Deutsch', 'Französisch',
    'Türkisch', 'Urdu', 'Persisch', 'Wort', 'Wörter', 'Name', 'Namen',
    'Buchstabe', 'Buchstaben', 'Satz', 'Silbe', 'Übersetzung', 'Bedeutung',
    'Aussprache', 'Schrift', 'Text', 'Brief' ] },

  { name: 'Medizin & Gesundheit', woerter: [
    'Krankenhaus', 'Klinik', 'Arzt', 'Ärztin', 'Doktor', 'Krankenschwester',
    'Pfleger', 'Apotheke', 'Medizin', 'Medikament', 'Arznei', 'krank',
    'Krankheit', 'Fieber', 'Schmerz', 'Wunde', 'Verband', 'Spritze',
    'Behandlung', 'Patient', 'gesund', 'Gesundheit', 'Zahnarzt', 'Operation' ] },

  { name: 'Haushaltsgeräte', woerter: [
    'Bügeleisen', 'Kochtopf', 'Topf', 'Ventilator', 'Kühlschrank',
    'Waschmaschine', 'Ofen', 'Herd', 'Wecker', 'Lampe', 'Fernseher', 'Radio',
    'Telefon', 'Staubsauger', 'Wasserkocher', 'Boiler', 'Klimaanlage',
    'Mixer', 'Uhr' ] },

  { name: 'Zahlen & Menge', woerter: [
    'null', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht',
    'neun', 'zehn', 'elf', 'zwölf', 'zwanzig', 'dreißig', 'vierzig', 'fünfzig',
    'hundert', 'tausend', 'Million', 'Zahl', 'Nummer', 'Anzahl', 'Menge',
    'Hälfte', 'Viertel', 'Drittel', 'erste', 'zweite', 'dritte', 'wenig',
    'viel', 'viele', 'alle', 'einige', 'Paar', 'Dutzend' ] },

  /* ---- Nach deutscher Bedeutung ---- */
  /* "Arm" fehlt hier bewusst: das deutsche Wort ist gleichlautend mit dem
     Adjektiv, und "sehr arm sein" landete beim Messen unter Körperteile.
     Oberarm/Unterarm stehen fuer den Fall, dass sie im Abzug auftauchen. */
  { name: 'Körperteile', woerter: [
    'Hand', 'Hände', 'Fuß', 'Füße', 'Bein', 'Beine', 'Oberarm', 'Unterarm',
    'Kopf', 'Haar', 'Haare', 'Auge', 'Augen', 'Ohr', 'Ohren', 'Nase', 'Mund',
    'Zahn', 'Zähne', 'Zunge', 'Lippe', 'Lippen', 'Herz', 'Bauch', 'Rücken',
    'Brust', 'Hals', 'Kehle', 'Finger', 'Knie', 'Schulter', 'Schultern',
    'Haut', 'Blut', 'Knochen', 'Gesicht', 'Stirn', 'Wange', 'Leber', 'Niere',
    'Magen', 'Seele', 'Körper', 'Leib', 'Nacken', 'Ellbogen', 'Zeigefinger',
    'Daumen', 'Ferse', 'Rippe', 'Gehirn', 'Lunge', 'Bart', 'Augenbraue',
    'Wimper', 'Kinn', 'Kiefer', 'Handfläche', 'Fingernagel' ] },

  { name: 'Familie & Menschen', woerter: [
    'Vater', 'Mutter', 'Sohn', 'Tochter', 'Bruder', 'Schwester', 'Kind',
    'Kinder', 'Junge', 'Mädchen', 'Mann', 'Frau', 'Onkel', 'Tante', 'Großvater',
    'Großmutter', 'Enkel', 'Ehemann', 'Ehefrau', 'Familie', 'Eltern', 'Neffe',
    'Nichte', 'Cousin', 'Cousine', 'Verwandte', 'Verwandter', 'Mensch',
    'Menschen', 'Leute', 'Nachbar', 'Nachbarin', 'Gast', 'Freund', 'Freundin',
    'Baby', 'Säugling', 'Waise', 'Witwe' ] },

  { name: 'Tiere', woerter: [
    'Tier', 'Tiere', 'Hund', 'Katze', 'Kuh', 'Rind', 'Pferd', 'Esel', 'Kamel',
    'Schaf', 'Ziege', 'Löwe', 'Wolf', 'Fuchs', 'Bär', 'Affe', 'Maus', 'Ratte',
    'Vogel', 'Vögel', 'Huhn', 'Hahn', 'Ente', 'Taube', 'Adler', 'Fisch',
    'Schlange', 'Skorpion', 'Fliege', 'Mücke', 'Biene', 'Ameise', 'Spinne',
    'Elefant', 'Giraffe', 'Tiger', 'Kaninchen', 'Hase', 'Frosch', 'Wurm',
    'Insekt', 'Krokodil', 'Wal', 'Schmetterling', 'Heuschrecke' ,
    'Henne', 'Spatz', 'Kamelstute', 'Stute', 'Küken', 'Ziegenbock', 'Kalb', 'Lamm' ] },

  { name: 'Länder & Orte', woerter: [
    'Land', 'Länder', 'Stadt', 'Städte', 'Dorf', 'Straße', 'Weg', 'Platz',
    'Ägypten', 'Indien', 'Japan', 'China', 'Amerika', 'Deutschland', 'Frankreich',
    'England', 'Türkei', 'Syrien', 'Irak', 'Iran', 'Jemen', 'Sudan', 'Marokko',
    'Pakistan', 'Nigeria', 'Philippinen', 'Indonesien', 'Mekka', 'Medina',
    'Jerusalem', 'Damaskus', 'Kairo', 'Hauptstadt', 'Ort', 'Region', 'Grenze',
    'Heimat', 'Ausland', 'Osten', 'Westen', 'Norden', 'Süden' ,
    'Schweiz', 'Kuwait', 'Saudi-Arabien', 'Katar', 'Libanon', 'Jordanien', 'Algerien', 'Tunesien', 'Libyen', 'Malaysia', 'Bangladesch', 'Afghanistan', 'Spanien', 'Italien', 'Russland', 'Somalia' ] },

  { name: 'Schule & Studium', woerter: [
    'schul*', 'Lehrer', 'Lehrerin', 'Schüler', 'Schülerin', 'Student',
    'Studentin', 'Universität', 'Klasse', 'Unterricht', 'Lektion', 'Stunde',
    'Aufgabe', 'Prüfung', 'Frage', 'Antwort', 'Buch', 'Bücher', 'Heft', 'Stift',
    'Kugelschreiber', 'Bleistift', 'Papier', 'Tafel', 'Kreide', 'Tasche',
    'Wörterbuch', 'Bibliothek', 'Direktor', 'Lineal', 'Radiergummi', 'Seite',
    'Wissen', 'Wissenschaft', 'lernen', 'studieren', 'Hausaufgabe' ,
    'Klassenzimmer', 'Hörsaal', 'Fakultät', 'Übung', 'Beispiel', 'Labor', 'Stundenplan', 'Pause', 'Note', 'Zeugnis' ] },

  { name: 'Haus & Wohnen', woerter: [
    'Haus', 'Häuser', 'Wohnung', 'Zimmer', 'Küche', 'Bad', 'Tür', 'Fenster',
    'Wand', 'Dach', 'Boden', 'Treppe', 'Schlüssel', 'Bett', 'Stuhl', 'Sessel',
    'Tisch', 'Schreibtisch', 'Schrank', 'Teppich', 'Lampe', 'Spiegel', 'Uhr',
    'Kissen', 'Decke', 'Garten', 'Hof', 'Balkon', 'Keller', 'Möbel', 'Kühlschrank',
    'Ofen', 'Waschmaschine', 'Vorhang', 'Wohnzimmer', 'Schlafzimmer' ,
    'Badezimmer', 'Toilette', 'WC', 'Waschraum', 'Flur', 'Wohnort', 'Unterkunft', 'Stockwerk' ,
    'Kochtopf', 'Ventilator', 'Bügeleisen', 'Kühlschrank', 'Wecker' ] },

  { name: 'Essen & Trinken', woerter: [
    'Essen', 'Speise', 'Nahrung', 'Brot', 'Reis', 'Fleisch', 'Fisch', 'Ei',
    'Eier', 'Milch', 'Käse', 'Butter', 'Öl', 'Salz', 'Zucker', 'Honig', 'Wasser',
    'Tee', 'Kaffee', 'Saft', 'Obst', 'Frucht', 'Früchte', 'Apfel', 'Banane',
    'Orange', 'Traube', 'Trauben', 'Dattel', 'Datteln', 'Feige', 'Olive',
    'Gemüse', 'Kartoffel', 'Tomate', 'Zwiebel', 'Salat', 'Suppe', 'Kuchen',
    'Süßigkeit', 'Teller', 'Löffel', 'Gabel', 'Messer', 'Tasse', 'Glas',
    'Hunger', 'Durst', 'Frühstück', 'Mittagessen', 'Abendessen', 'Mahlzeit' ] },

  { name: 'Zeit & Tag', woerter: [
    'Zeit', 'Tag', 'Tage', 'Nacht', 'Morgen', 'Mittag', 'Abend', 'Woche',
    'Monat', 'Jahr', 'Jahre', 'Stunde', 'Minute', 'Sekunde', 'heute', 'gestern',
    'morgen', 'jetzt', 'früh', 'spät', 'Montag', 'Dienstag', 'Mittwoch',
    'Donnerstag', 'Freitag', 'Samstag', 'Sonntag', 'Ramadan', 'Frühling',
    'Sommer', 'Herbst', 'Winter', 'Datum', 'Termin', 'Uhrzeit', 'Zukunft',
    'Vergangenheit', 'Gegenwart', 'Augenblick' ] },

  { name: 'Religion & Moschee', woerter: [
    'Moschee', 'Gebet', 'Gebete', 'beten', 'Allah', 'Gott', 'Prophet', 'Koran',
    'Sure', 'Vers', 'Glaube', 'Gläubiger', 'Muslim', 'Islam', 'Imam',
    'Fasten', 'Zakat', 'Pilgerfahrt', 'Hadsch', 'Kaaba', 'Paradies', 'Hölle',
    'Engel', 'Teufel', 'Sünde', 'Belohnung', 'Strafe', 'Barmherzigkeit',
    'Gesandter', 'Offenbarung', 'Gefährte', 'Sunna', 'Predigt', 'Kanzel',
    'Ruf zum Gebet', 'Waschung', 'Gebetsteppich', 'Minarett', 'Diener' ,
    'Gebetsrufer', 'Muezzin', 'Gebetsruf' ] },

  { name: 'Natur & Wetter', woerter: [
    'Himmel', 'Erde', 'Sonne', 'Mond', 'Stern', 'Sterne', 'Wolke', 'Regen',
    'Wind', 'Schnee', 'Sturm', 'Hitze', 'Kälte', 'Feuer', 'Wasser', 'Meer',
    'Fluss', 'See', 'Berg', 'Berge', 'Tal', 'Wüste', 'Baum', 'Bäume', 'Blume',
    'Blatt', 'Wald', 'Gras', 'Stein', 'Sand', 'Staub', 'Luft', 'Licht',
    'Schatten', 'Dunkelheit', 'Natur', 'Insel', 'Quelle', 'Brunnen', 'Ernte' ] },

  { name: 'Kleidung', woerter: [
    'Kleidung', 'Kleid', 'Hemd', 'Hose', 'Rock', 'Jacke', 'Mantel', 'Schuh',
    'Schuhe', 'Socke', 'Socken', 'Mütze', 'Kappe', 'Hut', 'Kopftuch',
    'Schleier', 'Gürtel', 'Tuch', 'Gewand', 'Stoff', 'Wolle', 'Baumwolle',
    'Seide', 'Knopf', 'Tasche', 'Ring', 'Uhr', 'Brille' ] },

  { name: 'Berufe & Arbeit', woerter: [
    'Arbeit', 'Beruf', 'Arzt', 'Ärztin', 'Krankenschwester', 'Ingenieur',
    'Kaufmann', 'Händler', 'Bauer', 'Bäcker', 'Schmied', 'Tischler', 'Schneider',
    'Fahrer', 'Pilot', 'Soldat', 'Polizist', 'Richter', 'Anwalt', 'Koch',
    'Kellner', 'Verkäufer', 'Angestellter', 'Beamter', 'Chef', 'Direktor',
    'Sekretär', 'Handwerker', 'Firma', 'Büro', 'Lohn', 'Gehalt', 'Markt',
    'Laden', 'Geschäft', 'Fabrik', 'Kunde' ,
    'Minister', 'Gebetsrufer', 'Muezzin', 'Bauarbeiter', 'Wächter' ] },

  { name: 'Verkehr & Reisen', woerter: [
    'Auto', 'Wagen', 'Bus', 'Zug', 'Bahn', 'Flugzeug', 'Schiff', 'Boot',
    'Fahrrad', 'Reise', 'reisen', 'Flughafen', 'Bahnhof', 'Hafen', 'Ticket',
    'Fahrkarte', 'Koffer', 'Gepäck', 'Straße', 'Brücke', 'Hotel', 'Passagier',
    'Abfahrt', 'Ankunft', 'Fahrt', 'Flug', 'Reisepass' ] },

  /* `nicht`: "لَا أَدْرِي = ich weiß nicht" wurde beim Messen als Farbe gefuehrt —
     das deutsche "weiß" ist Farbe UND Form von "wissen". */
  { name: 'Farben', woerter: [
    'Farbe', 'Farben', 'färben', 'rot', 'blau', 'grün', 'gelb', 'schwarz',
    'weiß', 'weiße', 'weißer', 'weißes', 'braun', 'grau', 'orange', 'rosa',
    'violett', 'lila', 'bunt', 'aschgrau', 'golden', 'silbern' ],
    nicht: ['ich', 'wissen', 'weißt'] }
];

/* Node (validate.js, Pruefskripte) statt Browser: dort gibt es kein `window`. */
if (typeof module !== 'undefined' && module.exports) module.exports = { WORTFELDER };
