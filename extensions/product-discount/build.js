const { execSync } = require("child_process");
const fs = require("fs");

fs.mkdirSync("dist", { recursive: true });

console.log("Bundling with esbuild...");
execSync(
  "npx esbuild src/entry.js --bundle --outfile=dist/index.js --format=esm --target=esnext",
  { stdio: "inherit" }
);

console.log("Compiling with Javy (dynamic linking)...");
execSync("javy emit-plugin -o dist/plugin.wasm", { stdio: "inherit" });
execSync("javy build -C dynamic -C plugin=dist/plugin.wasm -o dist/function.wasm dist/index.js", { stdio: "inherit" });

const size = fs.statSync("dist/function.wasm").size;
console.log("Done! WASM size: " + size + " bytes");
