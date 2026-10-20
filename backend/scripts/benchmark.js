// Sends the same GET request several times and prints how long each took
// and whether it was a cache HIT or MISS. Same idea as clicking "Send" in
// Postman a few times and reading the "Time" field.
//
// Usage:  node scripts/benchmark.js <token> [requests=5] [path=/tasks]
//         (BASE_URL defaults to http://localhost:5000)

const [token, count = '5', path = '/tasks'] = process.argv.slice(2);
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

if (!token) {
  console.error('Usage: node scripts/benchmark.js <token> [requests] [path]');
  process.exit(1);
}

async function main() {
  const rows = [];

  for (let i = 1; i <= Number(count); i++) {
    const start = performance.now();
    const res = await fetch(BASE_URL + path, {
      headers: { Authorization: `Bearer ${token}` },
    });
    await res.text(); // include downloading the body, like Postman does
    const ms = performance.now() - start;

    rows.push({
      request: i,
      status: res.status,
      'X-Cache': res.headers.get('x-cache') || '-',
      'time (ms)': Number(ms.toFixed(1)),
    });
  }

  console.table(rows);

  const times = rows.map((r) => r['time (ms)']);
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`Average: ${avg.toFixed(1)} ms over ${times.length} requests`);
}

main().catch((err) => {
  console.error('Request failed - is the backend running?', err.message);
  process.exit(1);
});
