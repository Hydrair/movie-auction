import { useEffect, useState } from 'react';
import films from './films.json';

type Film = (typeof films)[number];
type Round = { pot: string[]; shown: number; current: number; scoring: boolean; revealed: number[] };

const FILMS_PER_PLAYER = 4;
// Paket: Name -> IMDb-Genres bzw. TMDB-Keywords; ein Film gehört dazu, wenn er einen der Tags hat
const PACKS: [string, string[]][] = [
  ['Weihnachten', ['christmas']],
  ['Halloween', ['halloween', 'Horror']],
  ['Liebesfilme', ['Romance']],
  ['Komödie', ['Comedy']],
  ['Action', ['Action']],
  ['Abenteuer', ['Adventure']],
  ['Thriller', ['Thriller']],
  ['Krimi', ['Crime']],
  ['Mystery', ['Mystery']],
  ['Science-Fiction', ['Sci-Fi']],
  ['Fantasy', ['Fantasy']],
  ['Animation', ['Animation']],
  ['Familie', ['Family']],
  ['Drama', ['Drama']],
  ['Biografie & Geschichte', ['Biography', 'History']],
  ['Krieg', ['War']],
  ['Western', ['Western']],
  ['Musik', ['Music', 'Musical']],
  ['Sport', ['Sport']],
  ['Dokumentation', ['Documentary']],
];
const inPacks = (packs: string[]) => {
  const tags = PACKS.filter(([name]) => packs.includes(name)).flatMap(([, t]) => t);
  return packs.length ? films.filter(f => f.tags.some(t => tags.includes(t))) : films;
};
const packSizes = new Map(PACKS.map(([name]) => [name, inPacks([name]).length]));
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
  const [packs, setPacks] = usePersisted<string[]>('packs', []);
  const pool = inPacks(packs);

  function draw(players: number) {
    const size = players * FILMS_PER_PLAYER;
    const playedSet = new Set(played);
    let available = pool.filter(f => !playedSet.has(f.id));
    // Auswahl erschöpft: gespielte Filme dieser Auswahl automatisch freigeben
    const reset = available.length < size;
    if (reset) available = pool;
    const pot = shuffle(available).slice(0, size).map(f => f.id);
    const poolIds = new Set(pool.map(f => f.id));
    setPlayed([...played.filter(id => !(reset && poolIds.has(id))), ...pot]);
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
        {!round && (
          <Setup
            pool={pool.length}
            played={pool.filter(f => played.includes(f.id)).length}
            packs={packs}
            setPacks={setPacks}
            onDraw={draw}
            onReset={() => confirm('Alle gespielten Filme wieder freigeben?') && setPlayed([])}
          />
        )}
        {round && !round.scoring && <Auction round={round} setRound={setRound} />}
        {round?.scoring && <Scoring round={round} setRound={setRound} onNew={() => setRound(null)} />}
      </main>
      <footer>
        Filmdaten: IMDb · Poster: TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </>
  );
}

type SetupProps = {
  pool: number;
  played: number;
  packs: string[];
  setPacks: (packs: string[]) => void;
  onDraw: (players: number) => void;
  onReset: () => void;
};

function Setup({ pool, played, packs, setPacks, onDraw, onReset }: SetupProps) {
  const [players, setPlayers] = useState(4);
  const size = players * FILMS_PER_PLAYER;
  const toggle = (name: string) => setPacks(packs.includes(name) ? packs.filter(p => p !== name) : [...packs, name]);
  return (
    <section className="setup">
      <h2>Wie viele Spieler?</h2>
      <div className="players">
        {[2, 3, 4, 5, 6].map(n => (
          <button key={n} className={n === players ? 'active' : ''} onClick={() => setPlayers(n)}>{n}</button>
        ))}
      </div>
      <h2>Pakete</h2>
      <div className="packs">
        <button className={packs.length ? '' : 'active'} onClick={() => setPacks([])}>Alle Filme</button>
        {PACKS.map(([name]) => (
          <button key={name} className={packs.includes(name) ? 'active' : ''} onClick={() => toggle(name)}>
            {name} <small>{packSizes.get(name)}</small>
          </button>
        ))}
      </div>
      <button className="primary" disabled={pool < size} onClick={() => onDraw(players)}>
        {pool < size ? `Zu wenige Filme (${pool})` : `Pott ziehen (${size} Filme)`}
      </button>
      <p className="hint">
        {pool} Filme in der Auswahl, {played} bereits gespielt.
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
      <div className="info">
        <h2>{film.title}</h2>
        {film.originalTitle !== film.title && <p className="original">{film.originalTitle}</p>}
        <p className="year">{film.year}</p>
      </div>
      <div className="nav">
        <button disabled={current === 0} onClick={() => setRound({ ...round, current: current - 1 })}>← Zurück</button>
        {current < pot.length - 1 && <button className="primary" onClick={next}>Nächster Film →</button>}
      </div>
      <button className={allShown ? 'primary' : 'primary hidden'} onClick={() => confirm('Alle Auktionen beendet? Weiter zur Endwertung.') && setRound({ ...round, scoring: true })}>
        Zur Endwertung
      </button>
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
  const revealAll = () => setRound({ ...round, revealed: pot.map((_, i) => i) });

  return (
    <section className="scoring">
      <h2>Endwertung</h2>
      {nextHidden >= 0
        ? <div className="nav">
            <button className="primary" onClick={() => reveal(nextHidden)}>Nächsten aufdecken</button>
            <button onClick={revealAll}>Alle aufdecken</button>
          </div>
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
