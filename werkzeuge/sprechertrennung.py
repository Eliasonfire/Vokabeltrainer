# Trennt in den Unterrichtsaufnahmen die Sprecher (Lehrer vs. Schueler).
# Ergebnis je Folge als RTTM: wer spricht von wann bis wann.
# Der Lehrer wird nicht benannt, sondern spaeter ueber die Redezeit erkannt -
# er redet mit Abstand am meisten.
#
# Aufruf (python liegt NICHT im PATH der Claude-Prozesse):
#   "C:\Users\abdur\AppData\Local\Programs\Python\Python312\python.exe" werkzeuge/sprechertrennung.py
# Ueberspringt Folgen, die in transcripts/sprecher/ schon ein .rttm haben.
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

AUDIO = r"F:\Workspace\Arabicroots-Material\audio"
OUT   = r"F:\Workspace\Vokabeltrainer\transcripts\sprecher"
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

dateien = sorted(glob.glob(os.path.join(AUDIO, "folge-*.wav")))
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
