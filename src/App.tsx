import { useEffect, useState } from 'react';
import films from './films.json';

type Film = (typeof films)[number];
type Round = { pot: string[]; shown: number; current: number; scoring: boolean; revealed: number[] };

const FILMS_PER_PLAYER = 4;
const byId = new Map(films.map(f => [f.id, f]));
const poster = (f: Film, size: 'w185' | 'w500') => `https://image.tmdb.org/t/p/${size}${f.poster}`;
const nr = (i: number) => String(i + 1).padStart(2, '0');
const rating = (f: Film) => f.rating.toLocaleString('de-DE', { minimumFractionDigits: 1 });

function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => JSON.parse(localStorage.getItem(key) ?? 'null') ?? initial);
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue] as const;
}

function shuffle<T>(items: T[]) {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [round, setRound] = usePersisted<Round | null>('round', null);
  const [played, setPlayed] = usePersisted<string[]>('played', []);

  function draw(players: number) {
    const size = players * FILMS_PER_PLAYER;
    const playedSet = new Set(played);
    let available = films.filter(f => !playedSet.has(f.id));
    // Pool erschöpft: gespielte Filme automatisch freigeben
    const reset = available.length < size;
    if (reset) available = films;
    const pot = shuffle(available).slice(0, size).map(f => f.id);
    setPlayed([...(reset ? [] : played), ...pot]);
    setRound({ pot, shown: 1, current: 0, scoring: false, revealed: [] });
  }

  function newRound() {
    if (confirm('Laufende Runde verwerfen und neue Runde starten?')) setRound(null);
  }

  return (
    <>
      <header>
        <div className="strip" />
        <div className="title">
          <h1>Movie Auction</h1>
          {round && <button className="ghost" onClick={newRound}>Neue Runde</button>}
        </div>
        <div className="strip" />
      </header>
      <main>
        {!round && <Setup played={played.length} onDraw={draw} onReset={() => confirm('Alle gespielten Filme wieder freigeben?') && setPlayed([])} />}
        {round && !round.scoring && <Auction round={round} setRound={setRound} />}
        {round?.scoring && <Scoring round={round} setRound={setRound} onNew={() => setRound(null)} />}
      </main>
      <footer>
        Filmdaten: IMDb · Poster: TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </>
  );
}

function Setup({ played, onDraw, onReset }: { played: number; onDraw: (players: number) => void; onReset: () => void }) {
  const [players, setPlayers] = useState(4);
  return (
    <section className="setup">
      <h2>Wie viele Spieler?</h2>
      <div className="players">
        {[2, 3, 4, 5, 6].map(n => (
          <button key={n} className={n === players ? 'active' : ''} onClick={() => setPlayers(n)}>{n}</button>
        ))}
      </div>
      <button className="primary" onClick={() => onDraw(players)}>Pott ziehen ({players * FILMS_PER_PLAYER} Filme)</button>
      <p className="hint">
        {films.length} Filme im Filmpool, {played} bereits gespielt.
        {played > 0 && <> <button className="link" onClick={onReset}>Zurücksetzen</button></>}
      </p>
    </section>
  );
}

type RoundProps = { round: Round; setRound: (r: Round) => void };

function Auction({ round, setRound }: RoundProps) {
  const { pot, shown, current } = round;
  const film = byId.get(pot[current])!;
  const allShown = shown === pot.length;

  function next() {
    if (current < shown - 1) setRound({ ...round, current: current + 1 });
    else setRound({ ...round, shown: shown + 1, current: shown });
  }

  return (
    <section className="auction">
      <p className="number">Film {nr(current)} / {pot.length}</p>
      <img className="poster" src={poster(film, 'w500')} alt="" />
      <h2>{film.title}</h2>
      {film.originalTitle !== film.title && <p className="original">{film.originalTitle}</p>}
      <p className="year">{film.year}</p>
      <div className="nav">
        <button disabled={current === 0} onClick={() => setRound({ ...round, current: current - 1 })}>← Zurück</button>
        {current < pot.length - 1 && <button className="primary" onClick={next}>Nächster Film →</button>}
      </div>
      {allShown && (
        <button className="primary" onClick={() => confirm('Alle Auktionen beendet? Weiter zur Endwertung.') && setRound({ ...round, scoring: true })}>
          Zur Endwertung
        </button>
      )}
      <div className="thumbs">
        {pot.slice(0, shown).map((id, i) => (
          <button key={id} className={i === current ? 'active' : ''} onClick={() => setRound({ ...round, current: i })}>
            <img src={poster(byId.get(id)!, 'w185')} alt="" />
            <span>{nr(i)}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function Scoring({ round, setRound, onNew }: RoundProps & { onNew: () => void }) {
  const { pot, revealed } = round;
  const nextHidden = pot.findIndex((_, i) => !revealed.includes(i));
  const reveal = (i: number) => !revealed.includes(i) && setRound({ ...round, revealed: [...revealed, i] });

  return (
    <section className="scoring">
      <h2>Endwertung</h2>
      {nextHidden >= 0
        ? <button className="primary" onClick={() => reveal(nextHidden)}>Nächsten aufdecken</button>
        : <button className="primary" onClick={onNew}>Neue Runde</button>}
      <div className="grid">
        {pot.map((id, i) => {
          const film = byId.get(id)!;
          const open = revealed.includes(i);
          return (
            <button key={id} className={open ? 'card open' : 'card'} onClick={() => reveal(i)}>
              <span className="badge">{nr(i)}</span>
              <img src={poster(film, 'w185')} alt="" />
              <span className="rating">{open ? rating(film) : '?'}</span>
              <span className="name">{film.title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
