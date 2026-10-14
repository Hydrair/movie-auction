# Filmpool als statisches JSON statt Live-API

Der Filmpool wird einmalig per lokalem Skript aus den IMDb-Datensätzen (Kinofilme, ≥ 25.000 Stimmen, Wertung, Jahr) und der TMDB-API (deutscher Titel, Poster-Pfad) erzeugt und als `films.json` in die App gebündelt; nur die Posterbilder lädt die App zur Laufzeit vom TMDB-CDN. So braucht die PWA keinen Server und keinen API-Key im Client, die Filmliste funktioniert offline, und IMDb-Wertungen sind überhaupt verfügbar (TMDB liefert nur eigene Bewertungen, OMDb bräuchte einen Key mit Tageslimit). Preis: Wertungen veralten bis zum nächsten Skriptlauf, was fürs Spiel egal ist.

Die IMDb-Datensätze sind nur für nicht-kommerzielle Nutzung freigegeben – bei einer kommerziellen Version (Karten, Expansion Packs) muss die Datenquelle neu entschieden werden.
