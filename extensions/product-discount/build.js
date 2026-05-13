const { execSync } = require("child_process");
const fs = require("fs");

fs.mkdirSync("dist", { recursive: true });

// Step 1: Bundle with esbuild using @shopify/shopify_function entry + alias
console.log("Bundling with esbuild...");
execSync(
  'npx esbuild node_modules/@shopify/shopify_function/src/index.ts --bundle --outfile=dist/index.js --format=esm --target=esnext --alias:user-function=./src/run.js',
  { stdio: "inherit" }
);

// Step 2: Compile with Javy (downloaded in CI workflow)
console.log("Compiling with Javy...");
try {
  // Try dynamic linking first (smaller WASM ~1-16KB)
  execSync("javy emit-plugin -o dist/plugin.wasm", { stdio: "inherit" });
  execSync("javy build -C dynamic -C plugin=dist/plugin.wasm -o dist/function.wasm dist/index.js", { stdio: "inherit" });
} catch (e) {
  console.log("Dynamic linking failed, trying static...");
  execSync("javy build dist/index.js -o dist/function.wasm", { stdio: "inherit" });
}

const size = fs.statSync("dist/function.wasm").size;
console.log("Done! WASM size: " + size + " bytes");
