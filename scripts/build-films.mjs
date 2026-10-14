// Erzeugt src/films.json: IMDb-Kinofilme mit >= 25.000 Stimmen, angereichert um deutschen Titel und Poster von TMDB.
// Aufruf: npm run films (liest TMDB_API_KEY aus .env)
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const MIN_VOTES = 25000;
const CACHE = new URL('./.cache/', import.meta.url);
const OUT = new URL('../src/films.json', import.meta.url);
const key = process.env.TMDB_API_KEY;
if (!key) throw new Error('TMDB_API_KEY fehlt (.env)');

mkdirSync(CACHE, { recursive: true });

async function download(name) {
  const file = new URL(name, CACHE);
  if (!existsSync(file)) {
    console.log(`Lade ${name} …`);
    const res = await fetch(`https://datasets.imdbws.com/${name}`);
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
    await pipeline(Readable.fromWeb(res.body), createWriteStream(file));
  }
  return createInterface({ input: createReadStream(file).pipe(createGunzip()) });
}

const ratings = new Map();
for await (const line of await download('title.ratings.tsv.gz')) {
  const [id, rating, votes] = line.split('\t');
  if (Number(votes) >= MIN_VOTES) ratings.set(id, Number(rating));
}

const movies = [];
for await (const line of await download('title.basics.tsv.gz')) {
  const [id, type, , originalTitle, , year] = line.split('\t');
  if (type === 'movie' && ratings.has(id)) movies.push({ id, originalTitle, year: Number(year), rating: ratings.get(id) });
}
console.log(`${movies.length} Kinofilme mit >= ${MIN_VOTES} Stimmen`);

// TMDB-Antworten cachen, damit erneute Läufe nur neue Filme abfragen
const cacheFile = new URL('tmdb.json', CACHE);
const tmdb = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};
const auth = key.length > 40 ? { headers: { Authorization: `Bearer ${key}` } } : {};
const keyParam = key.length > 40 ? '' : `&api_key=${key}`;

async function lookup(id) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://api.themoviedb.org/3/find/${id}?external_source=imdb_id&language=de-DE${keyParam}`, auth);
    if (res.status === 429) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`TMDB ${id}: HTTP ${res.status}`);
    const hit = (await res.json()).movie_results[0];
    return hit ? { title: hit.title, poster: hit.poster_path } : {};
  }
  throw new Error(`TMDB ${id}: zu viele 429`);
}

const todo = movies.filter(m => !(m.id in tmdb));
let done = 0;
async function worker() {
  while (todo.length) {
    const m = todo.pop();
    tmdb[m.id] = await lookup(m.id);
    if (++done % 500 === 0) { console.log(`TMDB ${done} …`); writeFileSync(cacheFile, JSON.stringify(tmdb)); }
  }
}
await Promise.all(Array.from({ length: 20 }, worker));
writeFileSync(cacheFile, JSON.stringify(tmdb));

const films = movies
  .filter(m => tmdb[m.id].poster)
  .map(m => ({ ...m, title: tmdb[m.id].title || m.originalTitle, poster: tmdb[m.id].poster }));
writeFileSync(OUT, JSON.stringify(films));
console.log(`${films.length} Filme nach src/films.json geschrieben`);
