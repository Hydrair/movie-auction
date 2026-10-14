# Movie Auction

Ein Gesellschaftsspiel, bei dem Spieler mit begrenztem Budget auf zufällig gezogene Kinofilme bieten. Gewonnen hat, wessen Filmsammlung in der Endwertung zusammen mit dem Restbudget die meisten Punkte bringt. Die App zieht und zeigt nur die Filme; Budget, Zuschläge und Punkte führt die Spielleitung auf dem Spielleiterbogen.

## Language

### Personen

**Spieler**:
Eine Person am Tisch, die mitbietet und eine Filmsammlung aufbaut.
_Avoid_: User, Teilnehmer

**Spielleitung**:
Der Spieler, der das Gerät bedient, den nächsten Film für alle aufdeckt und den Spielleiterbogen führt. Spielt selbst mit.
_Avoid_: Host, Admin, Gamemaster

### Filme

**Film**:
Ein Kinofilm mit Poster, Titel, Erscheinungsjahr und verdeckter IMDb-Wertung.
_Avoid_: Karte, Movie

**Filmpool**:
Alle Kinofilme mit mindestens 25.000 IMDb-Stimmen, aus denen zufällig gezogen wird.
_Avoid_: Datenbank, Katalog

**Paket**:
Ein thematischer Ausschnitt des Filmpools, nach Genre (z. B. Liebesfilme) oder Anlass (Weihnachten, Halloween). Sind mehrere Pakete gewählt, wird aus allen zusammen gezogen; ohne Auswahl aus dem ganzen Filmpool.
_Avoid_: Expansion Pack, Filter, Kategorie

**Pott**:
Die für eine Runde aus den gewählten Paketen gezogenen Filme, genau 4 pro Spieler; werden einzeln in zufälliger Reihenfolge aufgedeckt, ohne Vorschau auf die nächsten.
_Avoid_: Stapel, Deck, Pool

**Filmnummer**:
Die Position eines Films im Pott (01, 02, …); entspricht der Zeile im Auktionsprotokoll.
_Avoid_: Index, ID

**IMDb-Wertung**:
Die Durchschnittsbewertung eines Films auf IMDb; bleibt bis zur Endwertung verdeckt.
_Avoid_: Rating, Score

**Filmsammlung**:
Die 4 Filme, die ein Spieler am Ende einer Runde besitzt.
_Avoid_: Hand, Kollektion, Liste

**Platz**:
Einer der 4 Plätze in der Filmsammlung eines Spielers. Am Rundenende müssen alle Plätze belegt sein.
_Avoid_: Slot

### Budget & Auktion

**Runde**:
Eine komplette Partie vom Ziehen des Potts bis zur Endwertung.
_Avoid_: Partie, Spiel

**Spielleiterbogen**:
Das Papierblatt mit Spieler & Budget, Auktionsprotokoll, Filmsammlungen und Endwertung einer Runde.
_Avoid_: Vordruck, Zettel, Spielblock

**Auktionsprotokoll**:
Der Teil des Spielleiterbogens, in dem pro Filmnummer Film, Gewinner, Gebot und Restbudget stehen.
_Avoid_: Verlauf, Log

**Budget**:
Die Dollar, die ein Spieler aktuell besitzt; startet beim Startbudget (Standard 20 $). Kann negativ werden.
_Avoid_: Guthaben, Konto, Geld

**Restbudget**:
Das Budget eines Spielers nach der letzten Auktion; zählt in der Endwertung.
_Avoid_: Restguthaben

**Schulden**:
Negatives Restbudget; kostet in der Endwertung Punkte.
_Avoid_: Minusbereich, Dispo

**Auktion**:
Offenes Bieten auf genau einen aufgedeckten Film, bis niemand mehr erhöht. Es gibt keine Obergrenze für Gebote.
_Avoid_: Versteigerung, Bietrunde

**Gebot**:
Ein ausgerufener Dollarbetrag in einer Auktion; mindestens 1 $. Bei einer Abnahme wird der erhaltene Betrag als negatives Gebot protokolliert.
_Avoid_: Einsatz

**Zuschlag**:
Der Film geht an den Höchstbietenden (Gewinner); dessen Budget sinkt um das Gebot.
_Avoid_: Kauf

**Abnahme**:
Rückwärtsauktion für einen Film, auf den niemand bietet: die Bank zahlt steigend 1 $, 2 $, … bis ein Spieler mit freiem Platz zugreift; bei gleichzeitigem Zugriff entscheidet das Los.
_Avoid_: Zwangskauf, Auslosen

**Endphase**:
Hat nur noch ein Spieler freie Plätze, bekommt er alle restlichen Filme für je 1 $, notfalls mit Schulden.
_Avoid_: Restverteilung

### Wertung

**Endwertung**:
Aufdecken aller IMDb-Wertungen; Punkte = IMDb-Summe + Restbudget × Dollarwert − Schulden-Abzug.
_Avoid_: Abrechnung, Auswertung

**Dollarwert**:
Punkte pro Dollar Restbudget in der Endwertung (Standard 0,5).
_Avoid_: Umrechnungskurs, Faktor

**Filmabend-Abstimmung**:
Tie-Break bei Punktgleichstand: die nicht beteiligten Spieler stimmen ab, welche Filmsammlung besser für einen Filmabend taugt. Ist das nicht möglich oder endet sie unentschieden, gewinnt das höhere Restbudget, sonst gibt es einen geteilten Sieg.
_Avoid_: Stichwahl
