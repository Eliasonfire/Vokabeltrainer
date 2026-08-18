# -*- coding: utf-8 -*-
"""schluessel_zeile.py -- eine Textstelle in den Madina-Schluesseln finden und
GENAU IHRE ZEILE bei 600 dpi als Bild ausgeben.

    python werkzeuge/schluessel_zeile.py <suchwort> [band] [--max N]

Beispiel:
    python werkzeuge/schluessel_zeile.py "لا اله الا الله" 3
    python werkzeuge/schluessel_zeile.py "Ortsangabe" 2

==================== WARUM ES DAS GIBT ====================================

Am 18.08.2026 gemessen: die Textebene der Schluessel ist zum SUCHEN brauchbar
(das Konsonantengeruest stimmt), zum ZITIEREN nicht. Vier Wege verglichen, alle
gegen den arabicroots-Abzug geprueft, Widerspruchsquote bei den inneren
Vokalzeichen:

    pdftotext             3,6 %      vorsichtig, laesst Zeichen weg
    PyMuPDF get_text()   10,4 %      reicher, dafuer oefter falsch
    nach Glyphenposition 20,7 %
    "Reparatur"          46,4 %      meine eigene Idee, die schlechteste

Und an der gerenderten Seite 162 nachgesehen, wo die Wahrheit steht:
aus لَا إِلَهَ إِلَّا اللّٰهُ macht pdftotext  َلا إِل ََه ا َِّٕلا الل ُّه.
Der Artikel mit Lam und die Hamza-Formen gehen regelmaessig kaputt.

⛔ Deshalb wird hier NICHTS repariert. Die Textebene sagt WO, das Bild sagt WAS
-- dieselbe Arbeitsteilung wie beim Lehrbuch. Dieses Skript macht den zweiten
Teil billig: statt einer ganzen Seite kommt nur die getroffene Zeile heraus.

⚠️ Band 2 hat ueberhaupt keinen arabischen Textlayer (6 Zeichen auf 141
Seiten). Dort findet nur die deutsche Suche etwas -- und dann eben die Zeile
mit der deutschen Erklaerung, neben der das Arabische steht.

⛔ KURZ SUCHEN, EIN ODER ZWEI WOERTER. In Zeilen, die Deutsch und Arabisch
mischen, stehen die arabischen Stuecke nicht immer in logischer Reihenfolge im
Textlayer. Gemessen am 18.08.2026 auf Seite 162:

    عندي            trifft
    كتاب عندي       trifft
    لا كتاب عندي    trifft NICHT -- obwohl der Satz genau so dort steht

Eine laengere Kette kann also fehlschlagen, waehrend ihr Teilstueck trifft.
Ein Fehlschlag ist deshalb KEIN Beleg, dass die Stelle fehlt: kuerzer suchen,
dann erst schliessen.
"""
import sys, io, os, unicodedata
import pymupdf

ORDNER = r"G:\1. Workspace\PDF Download"
BAENDE = {"2": "Madina_Book2_German_Key", "3": "Madina_Book3_German_Key"}
AUS = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "transcripts", "schluessel-stellen")

BLIND = (set(range(0x064B, 0x0656)) | {0x0670, 0x0640, 0x200e, 0x200f, 0x200d, 0x200c}
         | set(range(0x202a, 0x202f)) | set(range(0x2066, 0x206a)))
GLEICH = {"أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا",
          "ى": "ي", "ة": "ه", "ؤ": "و", "ئ": "ي"}

def skel(s):
    """Alles wegnehmen, was die Suche scheitern laesst - und das ist mehr, als
    man denkt.

    ⛔ Drei Fallen, alle am 18.08.2026 real aufgetreten:
    1. Vokalzeichen UND Hamza-Zeichen (U+0653-0655). Ohne die zweite Gruppe
       findet لا اله الا الله nichts, weil im Textlayer ا َِّٕلا steht.
    2. Richtungsmarken stehen massenhaft MITTEN in den Woertern.
    3. LEERZEICHEN mitten im Wort - der Textlayer zerreisst لِلْجِنْس zu
       ل ِْلجِنْس. Deshalb wird ohne jeden Zwischenraum verglichen.

    Dazu die ueblichen Gleichsetzungen (Alif-Varianten, Ta marbuta, Alif
    maqsura), damit eine Schreibweise nicht an einer anderen scheitert."""
    t = unicodedata.normalize("NFC", s)
    t = "".join(GLEICH.get(c, c) for c in t if ord(c) not in BLIND)
    return "".join(t.split())

def zeilen(pdf, nr):
    """Je Zeile ihr Text und ihr Rechteck."""
    d = pdf[nr].get_text("rawdict")
    aus = []
    for block in d["blocks"]:
        if block.get("type") != 0:
            continue
        for line in block["lines"]:
            t = "".join(c["c"] for span in line["spans"] for c in span["chars"])
            if t.strip():
                aus.append((t, line["bbox"]))
    return aus

def suche(wort, baende, maxN, log):
    s = skel(wort)
    if not s:
        log.write("Suchwort ist nach dem Abstreifen leer.\n")
        return
    gefunden = 0
    for band in baende:
        pfad = os.path.join(ORDNER, BAENDE[band] + ".pdf")
        if not os.path.exists(pfad):
            log.write("Band %s fehlt: %s\n" % (band, pfad))
            continue
        pdf = pymupdf.open(pfad)
        log.write("\n=== Band %s (%d Seiten) ===\n" % (band, pdf.page_count))
        treffer = 0
        for nr in range(pdf.page_count):
            for t, bbox in zeilen(pdf, nr):
                if s not in skel(t):
                    continue
                treffer += 1
                gefunden += 1
                if treffer > maxN:
                    continue
                x0, y0, x1, y1 = bbox
                # Luft seitlich grosszuegig, oben und unten knapp: Vokalzeichen
                # ragen ueber die Zeile hinaus und duerfen nicht abgeschnitten
                # werden - genau sie sind der Zweck. Mehr als 5 pt holt aber
                # schon die Nachbarzeile mit ins Bild und macht das Lesen
                # schwerer statt leichter (bei 10 pt am 18.08. gesehen).
                r = pymupdf.Rect(max(0, x0 - 12), max(0, y0 - 5),
                                 min(pdf[nr].rect.x1, x1 + 12),
                                 min(pdf[nr].rect.y1, y1 + 5))
                name = "band%s-s%03d-%02d.png" % (band, nr + 1, treffer)
                pdf[nr].get_pixmap(clip=r, dpi=600).save(os.path.join(AUS, name))
                log.write("  PDF-Seite %3d  ->  %s\n" % (nr + 1, name))
                log.write("      Textebene (NICHT zitierfaehig): %s\n" % t.strip()[:110])
        if treffer > maxN:
            log.write("  ... %d weitere Treffer, nicht gerendert (--max erhoehen)\n" % (treffer - maxN))
        if not treffer:
            log.write("  kein Treffer\n")
    log.write("\nGesamt: %d Treffer. Bilder in %s\n" % (gefunden, os.path.abspath(AUS)))
    log.write("⛔ Der Wortlaut kommt aus dem BILD, nicht aus der Textebene oben.\n")

if __name__ == "__main__":
    args = [a for a in sys.argv[1:]]
    maxN = 6
    if "--max" in args:
        i = args.index("--max")
        maxN = int(args[i + 1]); del args[i:i + 2]
    wort = args[0]
    baende = [args[1]] if len(args) > 1 and args[1] in BAENDE else ["2", "3"]
    if not os.path.isdir(AUS):
        os.makedirs(AUS)
    log = io.open(os.path.join(AUS, "_letzte-suche.txt"), "w", encoding="utf-8")
    suche(wort, baende, maxN, log)
    log.close()
    print(io.open(os.path.join(AUS, "_letzte-suche.txt"), encoding="utf-8").read()
          .encode("ascii", "replace").decode("ascii"))
