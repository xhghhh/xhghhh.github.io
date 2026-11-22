import fs from 'node:fs/promises';

const STATS_URL = 'https://s05.flagcounter.com/countries/F4Cs/';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36';

const rowRe = /<tr><td width=20>.*?expand_country\("([a-z]{2})"\).*?<td width=280><font face=arial size=2><a href="[^"]*"[^>]*><u>([^<]+)<\/u><\/a><\/font><\/td><td width=1%><font face=arial size=2>([\d,]+)<\/font><\/td>/g;

async function fetchRows() {
  let lastErr;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(STATS_URL, { headers: { 'User-Agent': UA } });
      if (!res.ok) throw new Error('stats fetch failed: ' + res.status);
      const html = await res.text();
      const rows = [...html.matchAll(rowRe)];
      if (rows.length === 0) throw new Error('no country rows parsed');
      return rows;
    } catch (err) {
      lastErr = err;
      await new Promise(r => setTimeout(r, attempt * 5000));
    }
  }
  throw lastErr;
}

const rows = await fetchRows();
const countries = rows
  .map(m => ({ code: m[1], name: m[1] === 'tw' ? 'Taiwan, China' : m[2], visitors: parseInt(m[3].replace(/,/g, ''), 10) }))
  .sort((a, b) => b.visitors - a.visitors);

const data = {
  updated: new Date().toISOString(),
  totalVisitors: countries.reduce((s, c) => s + c.visitors, 0),
  countryCount: countries.length,
  countries,
};

const out = new URL('../visitors.json', import.meta.url);
await fs.writeFile(out, JSON.stringify(data, null, 2) + '\n');
console.log(`visitors.json written: ${data.totalVisitors} visitors, ${data.countryCount} countries/regions`);
