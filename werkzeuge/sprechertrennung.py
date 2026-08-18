# Trennt in den Unterrichtsaufnahmen die Sprecher (Lehrer vs. Schueler).
# Ergebnis je Folge als RTTM: wer spricht von wann bis wann.
# Der Lehrer wird nicht benannt, sondern spaeter ueber die Redezeit erkannt -
# er redet mit Abstand am meisten.
#
# Aufruf:
#   python werkzeuge/sprechertrennung.py
# Ueberspringt Folgen, die in transcripts/sprecher/ schon ein .rttm haben.
#
# ⚠️ Korrigiert am 18.08.2026: Hier stand jahrelang "python liegt NICHT im PATH
# der Claude-Prozesse" samt vollem Pfad zur exe. Nachgemessen stimmt das nicht -
# "python" und "py" sind Python 3.12.10, nur "python3" ist der
# Microsoft-Store-Platzhalter und tut lautlos gar nichts.
#
# ⚠️ Beim Import meldet pyannote "torchcodec is not installed correctly so
# built-in audio decoding will fail". Das ist fuer dieses Skript belanglos -
# lade_wav() liest die WAV selbst (siehe dort). Nicht darauf hereinfallen und
# etwas nachinstallieren wollen.
#
# Warum die Datei hier liegt und nicht mehr im Scratchpad (verschoben 28.07.26):
# Die Wartungsroutine darf seit dem 28.07. python aufrufen, damit sie fuer eine
# NEUE Unterrichtsfolge selbst pruefen kann, ob eine abgeleitete Regel vom
# Lehrer stammt oder von einem Schueler (pruefe-sprecher.js braucht dafuer die
# Sprecherspur). Eine Freigabe fuer ein Skript, das nur im Scratchpad einer
# einzelnen Sitzung liegt, waere wertlos gewesen - der Ordner ist weg, sobald
# die Sitzung endet.
#
# ⚠️ Die pyannote-Modelle sind zugangsbeschraenkt. Elias' Hugging-Face-Anmeldung
# liegt im Benutzerprofil und wird automatisch gefunden; ein neuer Rechner
# braucht sie erneut (siehe Gedaechtnisnotiz vulkan-whisper-offen).
import os, sys, time, json, glob

# Die Tonspuren liegen an ZWEI Orten, und das ist kein Versehen: Folge 01-13
# kamen ueber den Materialordner herein, ab Folge 14 legt die Download-Routine
# sie direkt ins Projekt. Weil hier nur der erste Ordner stand, blieben 14, 15
# und 16 seit dem 02.08.2026 unbemerkt liegen - das Skript meldete brav
# "13 Tonspuren gefunden" und war zufrieden.
# Nicht kopieren, um das zu umgehen: je Folge sind das rund 90 MB.
AUDIO_ORDNER = [
    r"G:\1. Workspace\Arabicroots-Material\audio",
    r"G:\1. Workspace\Vokabeltrainer\transcripts\audio",
]
OUT = r"G:\1. Workspace\Vokabeltrainer\transcripts\sprecher"
os.makedirs(OUT, exist_ok=True)

import wave
import numpy as np
import torch
from pyannote.audio import Pipeline


def lade_wav(pfad):
    """Liest 16-bit-PCM-WAV ohne torchcodec und liefert das Format,
    das die Pipeline direkt annimmt."""
    with wave.open(pfad, "rb") as w:
        kanaele, breite, rate, n = w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getnframes()
        roh = w.readframes(n)
    if breite != 2:
        raise ValueError(f"unerwartete Bittiefe: {breite*8} bit")
    daten = np.frombuffer(roh, dtype="<i2").astype(np.float32) / 32768.0
    if kanaele > 1:
        daten = daten.reshape(-1, kanaele).T          # (Kanal, Zeit)
    else:
        daten = daten.reshape(1, -1)
    return {"waveform": torch.from_numpy(daten.copy()), "sample_rate": rate}


def als_annotation(ergebnis):
    """Neuere pyannote-Versionen liefern ein DiarizeOutput statt der Annotation
    direkt. Beim ersten Lauf ist genau daran das Schreiben gescheitert - nach
    einer halben Stunde Rechenzeit, weil der Fehler erst nach der Analyse kommt.
    Deshalb hier beide Formen abfangen."""
    for name in ("speaker_diarization", "diarization"):
        wert = getattr(ergebnis, name, None)
        if wert is not None:
            return wert
    return ergebnis

torch.set_num_threads(14)
print("Lade Modell ...", flush=True)
pipe = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
print("Modell geladen.", flush=True)

def tonspuren():
    """Sammelt die WAV-Dateien aus allen bekannten Ordnern.

    Liegt dieselbe Folge in mehreren Ordnern, gewinnt der zuerst genannte -
    sonst haengt das Ergebnis davon ab, in welcher Reihenfolge das Dateisystem
    antwortet, und das ist keine Grundlage fuer eine Quellenangabe.
    Ein fehlender Ordner ist kein Fehler, wird aber GEMELDET: ein stilles
    Ueberspringen ist genau die Falle, die diesen Rueckstand erzeugt hat."""
    gefunden, woher = {}, {}
    for ordner in AUDIO_ORDNER:
        if not os.path.isdir(ordner):
            print(f"⚠️  Ordner fehlt, wird uebersprungen: {ordner}", flush=True)
            continue
        treffer = sorted(glob.glob(os.path.join(ordner, "folge-*.wav")))
        print(f"    {len(treffer):>3} in {ordner}", flush=True)
        for wav in treffer:
            name = os.path.splitext(os.path.basename(wav))[0]
            if name not in gefunden:
                gefunden[name], woher[name] = wav, ordner
            elif woher[name] != ordner:
                print(f"    Hinweis: {name} liegt doppelt, genommen wird "
                      f"{woher[name]}", flush=True)
    return [gefunden[k] for k in sorted(gefunden)]

print("Suche Tonspuren ...", flush=True)
dateien = tonspuren()
print(f"{len(dateien)} Tonspuren gefunden.\n", flush=True)

for i, wav in enumerate(dateien, 1):
    name = os.path.splitext(os.path.basename(wav))[0]
    ziel = os.path.join(OUT, name + ".rttm")
    if os.path.exists(ziel) and os.path.getsize(ziel) > 0:
        print(f"[{i}/{len(dateien)}] {name}: schon da", flush=True)
        continue
    t0 = time.time()
    print(f"[{i}/{len(dateien)}] {name}: laeuft ...", flush=True)
    try:
        dia = als_annotation(pipe(lade_wav(wav)))
    except Exception as e:
        print(f"[{i}/{len(dateien)}] {name}: FEHLER {e}", flush=True)
        continue
    with open(ziel, "w", encoding="utf-8") as f:
        dia.write_rttm(f)

    # Redezeit je Sprecher - der Vielredner ist der Lehrer
    zeit = {}
    for seg, _, spk in dia.itertracks(yield_label=True):
        zeit[spk] = zeit.get(spk, 0.0) + (seg.end - seg.start)
    ges = sum(zeit.values()) or 1
    rang = sorted(zeit.items(), key=lambda x: -x[1])
    with open(os.path.join(OUT, name + ".json"), "w", encoding="utf-8") as f:
        json.dump({
            "folge": name,
            "sprecher": len(zeit),
            "vermutlichLehrer": rang[0][0] if rang else None,
            "redeanteil": {k: round(v / ges * 100, 1) for k, v in rang},
        }, f, ensure_ascii=False, indent=1)
    anteile = ", ".join(f"{k}={v/ges*100:.0f}%" for k, v in rang[:4])
    print(f"[{i}/{len(dateien)}] {name}: fertig in {time.time()-t0:.0f}s, "
          f"{len(zeit)} Sprecher ({anteile})", flush=True)

print("\n=== alle fertig ===", flush=True)
