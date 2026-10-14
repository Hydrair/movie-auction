// Erzeugt src/films.json: IMDb-Kinofilme mit >= 25.000 Stimmen, angereichert um deutschen Titel, Poster und Anlass-Keywords von TMDB.
// Aufruf: npm run films (liest TMDB_API_KEY aus .env)
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const MIN_VOTES = 25000;
const KEYWORDS = ['christmas', 'halloween'];
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
  const [id, type, , originalTitle, , year, , , genres] = line.split('\t');
  if (type === 'movie' && ratings.has(id)) movies.push({ id, originalTitle, year: Number(year), rating: ratings.get(id), tags: genres === '\\N' ? [] : genres.split(',') });
}
console.log(`${movies.length} Kinofilme mit >= ${MIN_VOTES} Stimmen`);

// TMDB-Antworten cachen, damit erneute Läufe nur neue Filme abfragen
const cacheFile = new URL('tmdb.json', CACHE);
const tmdb = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};
const auth = key.length > 40 ? { headers: { Authorization: `Bearer ${key}` } } : {};
const keyParam = key.length > 40 ? '' : `&api_key=${key}`;

async function api(path) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(`https://api.themoviedb.org/3/${path}${keyParam}`, auth);
    if (res.status === 429) { await new Promise(r => setTimeout(r, 1000 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`TMDB ${path}: HTTP ${res.status}`);
    return res.json();
  }
  throw new Error(`TMDB ${path}: zu viele 429`);
}

async function lookup(id) {
  const hit = (await api(`find/${id}?external_source=imdb_id&language=de-DE`)).movie_results[0];
  return hit ? { tmdbId: hit.id, title: hit.title, poster: hit.poster_path } : { tmdbId: null };
}

const todo = movies.filter(m => !('tmdbId' in (tmdb[m.id] ?? {})));
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

// TMDB-IDs aller Filme pro Anlass-Keyword (z. B. christmas)
const keywordFilms = {};
for (const name of KEYWORDS) {
  const kw = (await api(`search/keyword?query=${name}`)).results.find(k => k.name === name);
  const ids = (keywordFilms[name] = new Set());
  for (let page = 1, pages = 1; page <= pages; page++) {
    const res = await api(`discover/movie?with_keywords=${kw.id}&page=${page}`);
    pages = Math.min(res.total_pages, 500);
    res.results.forEach(r => ids.add(r.id));
  }
  console.log(`Keyword ${name}: ${ids.size} TMDB-Filme`);
}

const films = movies
  .filter(m => tmdb[m.id].poster)
  .map(m => {
    const { tmdbId, title, poster } = tmdb[m.id];
    const tags = [...m.tags, ...KEYWORDS.filter(k => keywordFilms[k].has(tmdbId))];
    return { ...m, title: title || m.originalTitle, poster, tags };
  });
writeFileSync(OUT, JSON.stringify(films));
console.log(`${films.length} Filme nach src/films.json geschrieben`);
