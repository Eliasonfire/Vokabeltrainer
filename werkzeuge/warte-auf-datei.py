# warte-auf-datei.py -- wartet IM VORDERGRUND, bis eine Datei da ist.
#
#   python werkzeuge/warte-auf-datei.py <datei> [sekunden]
#
# Gibt "DA <datei>" aus (Exitcode 0), sobald die Datei existiert und sich ihre
# Groesse fuenf Sekunden lang nicht mehr aendert. Ist sie nach <sekunden>
# (Vorgabe 560) noch nicht da: "NOCH NICHT ..." und Exitcode 3 -- dann denselben
# Befehl einfach noch einmal aufrufen.
#
# Wozu (04.10.2026): Die Routine arabicroots-backfill-retry startet Whisper und
# die Sprechertrennung. Die Sprechertrennung rechnet 15 bis 30 Minuten -- laenger
# als die 10 Minuten, die ein Vordergrundbefehl haben darf --, laeuft also im
# Hintergrund. Ein Routine-Lauf ist aber `claude -p`: er ENDET mit der ersten
# Antwort ohne Werkzeugaufruf, und was dann im Hintergrund rechnet, stirbt mit.
# Am 04.10.2026 um 20:32 schrieb der Lauf "ich warte auf die Fertigmeldung" und
# war nach 1,4 Minuten zu Ende -- Whisper mit ihm. Am 30.09.2026 ging es gut,
# weil der Lauf von sich aus in einer Schleife auf die .rttm gewartet hat
# (dreimal 560 s). Dieses Skript ist genau diese Schleife, als fester Befehl.
#
# 560 statt 600 Sekunden: der Befehl muss VOR der Zeitgrenze des
# Vordergrundbefehls (600000 ms) selbst zurueckkommen, sonst wird er abgeschossen
# und der Lauf weiss nicht, woran er ist.
import os
import sys
import time

if len(sys.argv) < 2:
    print("Aufruf: python werkzeuge/warte-auf-datei.py <datei> [sekunden]")
    sys.exit(2)

ziel = sys.argv[1]
dauer = int(sys.argv[2]) if len(sys.argv) > 2 else 560
start = time.time()
ende = start + dauer

while time.time() < ende:
    if os.path.exists(ziel):
        groesse = os.path.getsize(ziel)
        time.sleep(5)
        if os.path.exists(ziel) and os.path.getsize(ziel) == groesse:
            print(f"DA {ziel} ({groesse} Bytes) nach {int(time.time() - start)} s")
            sys.exit(0)
    else:
        time.sleep(10)

print(f"NOCH NICHT {ziel} nach {dauer} s -- denselben Befehl noch einmal aufrufen")
sys.exit(3)
