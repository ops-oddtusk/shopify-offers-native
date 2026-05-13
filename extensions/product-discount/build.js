const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

fs.mkdirSync("dist", { recursive: true });

// Step 1: Bundle JS with esbuild
console.log("Step 1: Bundling JS...");
execSync(
  "npx esbuild src/run.js --bundle --outfile=dist/index.js --format=esm --target=esnext --alias:user-function=./src/run.js",
  { stdio: "inherit" }
);

// Step 2: Find javy binary from npm package
console.log("Step 2: Finding javy binary...");
const javyDir = path.join(__dirname, "node_modules", "javy");
console.log("javy package contents:");
const files = execSync("find " + javyDir + " -type f", { encoding: "utf8" });
console.log(files);

// Try to get path from the package
let javyBin;
try {
  const javyPkg = require("javy");
  console.log("javy exports:", typeof javyPkg, JSON.stringify(javyPkg).slice(0, 500));
  if (typeof javyPkg === "string") javyBin = javyPkg;
  else if (javyPkg && javyPkg.default) javyBin = typeof javyPkg.default === "string" ? javyPkg.default : null;
} catch (e) {
  console.log("require('javy') error:", e.message);
}

// Search for binary files
if (!javyBin) {
  const allFiles = files.split("\n").filter(f => f && !f.endsWith(".js") && !f.endsWith(".ts") && !f.endsWith(".json") && !f.endsWith(".md") && !f.endsWith(".txt"));
  console.log("Non-JS files:", allFiles);
  for (const f of allFiles) {
    try {
      fs.accessSync(f, fs.constants.X_OK);
      javyBin = f;
      break;
    } catch (e) {
      // Check if it looks like a binary
      const base = path.basename(f);
      if (base === "javy" || base.startsWith("javy-")) {
        fs.chmodSync(f, 0o755);
        javyBin = f;
        break;
      }
    }
  }
}

if (!javyBin) {
  console.error("Could not find javy binary. Package structure above.");
  process.exit(1);
}

// Step 3: Compile to WASM
console.log("Step 3: Compiling with javy:", javyBin);
fs.chmodSync(javyBin, 0o755);
try {
  execSync(javyBin + " compile -d dist/index.js -o dist/function.wasm", { stdio: "inherit" });
} catch (e) {
  console.log("Dynamic mode failed, trying static...");
  execSync(javyBin + " compile dist/index.js -o dist/function.wasm", { stdio: "inherit" });
}

const size = fs.statSync("dist/function.wasm").size;
console.log("Done! WASM size: " + size + " bytes");
