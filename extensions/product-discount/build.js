const { execSync } = require("child_process");
const fs = require("fs");

fs.mkdirSync("dist", { recursive: true });

console.log("Step 1: Bundling with esbuild...");
execSync("npx esbuild src/entry.js --bundle --outfile=dist/index.js --format=esm --target=esnext", { stdio: "inherit" });

console.log("Step 2: Compiling with Javy...");
execSync("javy compile -d dist/index.js -o dist/function.wasm", { stdio: "inherit" });

console.log("Step 3: Adding 'run' export to WASM...");
execSync("node add-export.js", { stdio: "inherit" });

const size = fs.statSync("dist/function.wasm").size;
console.log("Build complete! WASM: " + size + " bytes");
