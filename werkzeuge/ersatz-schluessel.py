# ersatz-schluessel.py -- liest die Woerterlisten aus dem deutschen Schluessel zu einem Madina-Buch (PDF) und
# schreibt sie als Auszug: je Tabellenzeile die arabische Zelle (mit Vokalzeichen, in Leserichtung) und die deutsche.
#
# Wozu: Elias, 11.10.2026: "fuer das deutsche will ich im optimalfall auch eine quelle haben". Der Schluessel ist
# sein Buch (in seiner Rangfolge der Belege an zweiter Stelle) und nennt je Lektion die neuen Woerter mit Deutsch.
#
# Aufruf (aus dem Repo-Wurzelverzeichnis; braucht das Python-Paket PyMuPDF):
#   python -I werkzeuge/ersatz-schluessel.py <pdf> <buch> <ausgabe.jsonl>
#   z. B. python -I werkzeuge/ersatz-schluessel.py "G:/1. Workspace/PDF Download/Madina_Book3_German_Key.pdf" madina-3 data-ersatz/quellen/auszuege/schluessel-madina-3.jsonl
#
# Warum nicht einfach der Text des PDF: dort stehen die Vokalzeichen verschoben (das Zeichen des letzten Buchstabens
# am Wortanfang, andere vor statt hinter ihrem Buchstaben). Die LAGE jedes Zeichens auf der Seite stimmt aber:
# ein Vokalzeichen hat denselben Ursprung wie sein Buchstabe. Das Schlusszeichen eines Wortes ist als Paar
# "Zeichen + Leerzeichen" gesetzt; das Leerzeichen liegt genau auf dem letzten Buchstaben.
# Gemessen an Seite 19 und 32 des Schluessels zu Buch 3.
import sys, io, json, re, unicodedata
import pymupdf

MARKEN = set(range(0x064B, 0x0656)) | {0x0670}
ZIFFERN = set('0123456789') | set(chr(c) for c in range(0x0660, 0x066A))
ist_marke = lambda ch: ord(ch) in MARKEN
ist_ar_schrift = lambda font: font.startswith('Scheherazade')


def zeile_bauen(zeichen, rtl):
    """zeichen: Liste von dict(c, ox, x0, x1, sid, idx) EINER Bildzeile -> Text in Leserichtung"""
    nach = {(z['sid'], z['idx']): z for z in zeichen}
    basen = [z for z in zeichen if not ist_marke(z['c'])]
    for b in basen:
        b['marken'] = []
    kunst = set()
    lose = 0
    letzte = {}   # je Spanne: der letzte Buchstabe vor der Stelle (die Zeichen einer Spanne stehen in Leserichtung)
    for z in sorted(zeichen, key=lambda z: (z['sid'], z['idx'])):
        if not ist_marke(z['c']):
            if z['c'] != ' ':
                letzte[z['sid']] = z
            continue
        ziel = None
        # Schlusszeichen: Zeichen + Leerzeichen als Paar (auch Schadda + Zeichen + Leerzeichen); der rechte Rand des
        # Leerzeichens ist der Ursprung des Zeichens, und das Leerzeichen liegt auf dem Buchstaben, zu dem es gehoert.
        # Gemessen an "Hitze" (S. 20): dort stehen Schadda UND Tanwin vor dem Wort, beide am Rand des Leerzeichens.
        for d in (1, -1):
            j = z['idx'] + d
            n = nach.get((z['sid'], j))
            while n and ist_marke(n['c']):
                j += d
                n = nach.get((z['sid'], j))
            if n and n['c'] == ' ' and abs(n['x1'] - z['ox']) < 0.3 and abs(n['x0'] - z['ox']) > 2:
                kand = [b for b in basen if b['c'] != ' ' and abs(b['ox'] - n['ox']) < 0.4]
                if kand:
                    ziel = kand[0]
                    kunst.add(id(n))
                    break
        if ziel is None:
            # der Buchstabe unmittelbar davor in der Spanne, wenn das Zeichen ueber dessen Kasten liegt: bei einem schmalen
            # Alif sitzt das Zeichen am rechten Rand und haette denselben Ursprung wie der Nachbarbuchstabe
            v = letzte.get(z['sid'])
            if v is not None and v['x0'] - 0.5 <= z['ox'] <= v['x1'] + 0.5:
                ziel = v
        if ziel is None:
            kand = [b for b in basen if b['c'] != ' ' and abs(b['ox'] - z['ox']) < 0.4]
            if not kand:
                kand = [b for b in basen if b['c'] != ' ' and b['x0'] - 0.2 <= z['ox'] <= b['x1'] + 0.2]
            if kand:
                ziel = min(kand, key=lambda b: abs(b['ox'] - z['ox']))
        if ziel is None:
            lose += 1
        else:
            ziel['marken'].append(z['c'])
    basen = [b for b in basen if id(b) not in kunst]
    basen.sort(key=lambda b: (-b['ox'] if rtl else b['ox']))
    if rtl:
        # Lam-Alif ist im PDF EIN Bildzeichen: sein Vokal steht hinter dem Alif, gehoert aber zum Lam. Ein blankes Alif
        # im Wortinneren traegt selbst nie Fatha, Damma oder Kasra.
        for i in range(1, len(basen)):
            a, l = basen[i], basen[i - 1]
            if a['c'] == 'ا' and l['c'] == 'ل' and not any(0x064B <= ord(m) <= 0x0652 for m in l['marken']):
                vok = [m for m in a['marken'] if 0x064E <= ord(m) <= 0x0650]
                if vok and not any(ord(m) in (0x0653, 0x0654, 0x0655) for m in a['marken']):
                    l['marken'] += vok
                    a['marken'] = [m for m in a['marken'] if m not in vok]
    teile = [b['c'] + ''.join(b['marken']) for b in basen]
    if rtl:
        # Ziffern und lateinische Buchstaben laufen auch in arabischem Text von links nach rechts
        i = 0
        while i < len(teile):
            j = i
            while j < len(teile) and (teile[j] in ZIFFERN or ('a' <= teile[j].lower() <= 'z')):
                j += 1
            if j - i > 1:
                teile[i:j] = teile[i:j][::-1]
            i = max(j, i + 1)
        # Klammern stehen im PDF als Bildzeichen: in Leserichtung sind sie vertauscht
        tausch = {'(': ')', ')': '('}
        teile = [tausch.get(t, t) for t in teile]
    text = ''.join(teile).replace('\u0640', '')
    return unicodedata.normalize('NFC', re.sub(r'\s+', ' ', text)).strip(), lose


def zelle_bauen(zeichen, rtl):
    # nach Bildzeilen (Grundlinie) ordnen
    zeilen = {}
    for z in zeichen:
        zeilen.setdefault(round(z['oy'] / 3), []).append(z)
    texte, lose = [], 0
    for k in sorted(zeilen):
        t, l = zeile_bauen(zeilen[k], rtl)
        lose += l
        if t:
            texte.append(t)
    return ' '.join(texte), lose


def main():
    pdf, buch, aus = sys.argv[1], sys.argv[2], sys.argv[3]
    doc = pymupdf.open(pdf)
    lektion, aktiv, nr = None, False, 0
    zeilen_aus, je_lektion, lose_gesamt = [], {}, 0
    for si in range(doc.page_count):
        page = doc[si]
        d = page.get_text('rawdict')
        zeichen, ereignisse = [], []
        sid = 0
        for b in d['blocks']:
            for l in b.get('lines', []):
                ltext = ''.join(c['c'] for s in l['spans'] for c in s['chars']).strip()
                m = re.match(r'^LEKTION\s+(\d+)$', ltext)
                if m:
                    ereignisse.append((l['bbox'][1], 0, 'lektion', int(m.group(1))))
                elif re.match(r'^W\u00f6rter\s*:?$', ltext):
                    ereignisse.append((l['bbox'][1], 0, 'woerter', None))
                for s in l['spans']:
                    sid += 1
                    ar = ist_ar_schrift(s['font'])
                    for idx, c in enumerate(s['chars']):
                        zeichen.append(dict(c=c['c'], ox=c['origin'][0], oy=c['origin'][1], x0=c['bbox'][0], x1=c['bbox'][2],
                                            ym=(c['bbox'][1] + c['bbox'][3]) / 2, sid=sid, idx=idx, ar=ar))
        # Zeilengrenzen der Tabelle: die waagrechten Striche der Seite
        ys = []
        for z in page.get_drawings():
            for it in z['items']:
                if it[0] == 'l' and abs(it[1].y - it[2].y) < 1:
                    ys.append(it[1].y)
                elif it[0] == 're' and it[1].height < 2:
                    ys.append(it[1].y0)
        ys.sort()
        grenzen = []
        for y in ys:
            if not grenzen or y - grenzen[-1] > 3:
                grenzen.append(y)
        baender = [(a, b) for a, b in zip(grenzen, grenzen[1:]) if 12 < b - a < 260]
        for a, b in baender:
            ereignisse.append((a, 1, 'band', (a, b)))
        ereignisse.sort(key=lambda e: (e[0], e[1]))
        # Spaltengrenze der Seite: wo der lateinische Text der Tabellenzeilen beginnt (haeufigster Wert)
        anfaenge = {}
        for a, b in baender:
            lat = [z for z in zeichen if not z['ar'] and a < z['ym'] < b and z['c'].isalpha()]
            if lat:
                x = round(min(z['x0'] for z in lat))
                anfaenge[x] = anfaenge.get(x, 0) + 1
        grenze = max(anfaenge, key=anfaenge.get) if anfaenge else None
        for y, _, art, wert in ereignisse:
            if art == 'lektion':
                lektion, aktiv, nr = wert, False, 0
            elif art == 'woerter':
                aktiv = True
            elif art == 'band' and aktiv and lektion is not None and grenze is not None:
                a, b = wert
                drin = [z for z in zeichen if a < z['ym'] < b]
                links = [z for z in drin if z['x1'] <= grenze + 1]
                rechts = [z for z in drin if z['x0'] >= grenze - 1]
                if not any(z['ar'] and '\u0621' <= z['c'] <= '\u064a' for z in links):
                    continue
                arabisch, lose = zelle_bauen(links, True)
                # die deutsche Zelle: lateinische Schrift von links nach rechts
                deutsch, _ = zelle_bauen([z for z in rechts if not z['ar']], False)
                ar_rechts, _ = zelle_bauen([z for z in rechts if z['ar']], True)
                if not deutsch:
                    continue
                nr += 1
                lose_gesamt += lose
                je_lektion[lektion] = je_lektion.get(lektion, 0) + 1
                satz = dict(buch=buch, lektion=lektion, seite=si + 1, zeile=nr, ar=arabisch, de=deutsch)
                if ar_rechts:
                    satz['ar_in_de'] = ar_rechts
                if lose:
                    satz['lose'] = lose
                zeilen_aus.append(satz)
    with io.open(aus + '.neu', 'w', encoding='utf-8') as f:
        for s in zeilen_aus:
            f.write(json.dumps(s, ensure_ascii=False) + '\n')
    import os
    os.replace(aus + '.neu', aus)
    print('%s: %d Zeilen in %d Lektionen, %d Vokalzeichen ohne Buchstaben' % (buch, len(zeilen_aus), len(je_lektion), lose_gesamt))
    print('je Lektion: ' + ' '.join('L%d %d' % (k, je_lektion[k]) for k in sorted(je_lektion)))


main()
