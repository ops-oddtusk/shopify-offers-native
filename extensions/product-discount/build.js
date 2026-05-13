const { execSync } = require("child_process");
const fs = require("fs");

fs.mkdirSync("dist", { recursive: true });

console.log("Bundling with esbuild...");
execSync(
  "npx esbuild src/entry.js --bundle --outfile=dist/index.js --format=esm --target=esnext",
  { stdio: "inherit" }
);

console.log("Compiling with Javy v3 (dynamic linking)...");
execSync("javy compile -d dist/index.js -o dist/function.wasm", { stdio: "inherit" });

const size = fs.statSync("dist/function.wasm").size;
console.log("Done! WASM size: " + size + " bytes");
