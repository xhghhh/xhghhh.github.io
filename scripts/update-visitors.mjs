import fs from 'node:fs/promises';

const STATS_URL = 'https://s05.flagcounter.com/countries/F4Cs/';
const res = await fetch(STATS_URL, {
  headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/157.0.0.0 Safari/537.36' },
});
if (!res.ok) throw new Error('stats fetch failed: ' + res.status);
const html = await res.text();

const rowRe = /<tr><td width=20>.*?expand_country\("([a-z]{2})"\).*?<td width=280><font face=arial size=2><a href="[^"]*"[^>]*><u>([^<]+)<\/u><\/a><\/font><\/td><td width=1%><font face=arial size=2>([\d,]+)<\/font><\/td>/g;
const countries = [];
for (const m of html.matchAll(rowRe)) {
  countries.push({ code: m[1], name: m[1] === 'tw' ? 'Taiwan, China' : m[2], visitors: parseInt(m[3].replace(/,/g, ''), 10) });
}
countries.sort((a, b) => b.visitors - a.visitors);

const countMatch = html.match(/Countries \d+ - \d+ of (\d+)/);
const data = {
  updated: new Date().toISOString(),
  totalVisitors: countries.reduce((s, c) => s + c.visitors, 0),
  countryCount: countMatch ? parseInt(countMatch[1], 10) : countries.length,
  countries: countries.slice(0, 12),
};

const out = new URL('../visitors.json', import.meta.url);
await fs.writeFile(out, JSON.stringify(data, null, 2) + '\n');
console.log(`visitors.json written: ${data.totalVisitors} visitors, ${data.countryCount} countries`);