import { run } from "./run.js";

// Read JSON from STDIN
const chunks = [];
const buf = new Uint8Array(4096);
while (true) {
  const n = Javy.IO.readSync(0, buf);
  if (n <= 0) break;
  chunks.push(buf.slice(0, n));
}
let len = 0;
for (const c of chunks) len += c.length;
const full = new Uint8Array(len);
let off = 0;
for (const c of chunks) { full.set(c, off); off += c.length; }

const input = JSON.parse(new TextDecoder().decode(full));
const result = run(input);
Javy.IO.writeSync(1, new TextEncoder().encode(JSON.stringify(result)));
