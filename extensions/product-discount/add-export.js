const fs = require("fs");
const buf = fs.readFileSync("dist/function.wasm");

function readLEB(data, off) {
  let r = 0, s = 0, b = 0;
  while (true) { const v = data[off + b]; r |= (v & 0x7f) << s; b++; s += 7; if (!(v & 0x80)) break; }
  return { value: r, bytes: b };
}
function writeLEB(v) {
  const r = [];
  do { let b = v & 0x7f; v >>= 7; if (v) b |= 0x80; r.push(b); } while (v);
  return Buffer.from(r);
}

let pos = 8;
while (pos < buf.length) {
  const sid = buf[pos++];
  const { value: ssize, bytes: slen } = readLEB(buf, pos);
  const sizeStart = pos;
  pos += slen;
  const dataStart = pos;

  if (sid === 7) {
    const { value: count, bytes: clen } = readLEB(buf, pos);
    let ePos = pos + clen;
    let funcIdx = -1;

    for (let i = 0; i < count; i++) {
      const { value: nl, bytes: nlen } = readLEB(buf, ePos); ePos += nlen;
      const name = buf.slice(ePos, ePos + nl).toString(); ePos += nl;
      const kind = buf[ePos++];
      const { value: idx, bytes: ilen } = readLEB(buf, ePos); ePos += ilen;
      if (name === "_start" && kind === 0) funcIdx = idx;
    }

    if (funcIdx < 0) { console.error("No _start export found"); process.exit(1); }

    const nameB = Buffer.from("run");
    const newExp = Buffer.concat([writeLEB(nameB.length), nameB, Buffer.from([0]), writeLEB(funcIdx)]);
    const existing = buf.slice(pos + clen, dataStart + ssize);
    const newContent = Buffer.concat([writeLEB(count + 1), existing, newExp]);
    const result = Buffer.concat([buf.slice(0, sizeStart), writeLEB(newContent.length), newContent, buf.slice(dataStart + ssize)]);

    fs.writeFileSync("dist/function.wasm", result);
    console.log("Added 'run' export (func " + funcIdx + "). Size: " + result.length + " bytes");
    process.exit(0);
  }
  pos = dataStart + ssize;
}
