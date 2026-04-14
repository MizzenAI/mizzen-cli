import { buildSync } from "esbuild"

buildSync({
  entryPoints: ["src/index.ts"],
  bundle: true,
  platform: "node",
  format: "esm",
  outfile: "dist/index.js",
  banner: { js: "#!/usr/bin/env node" },
  packages: "external",
})

console.log("Bundle complete: dist/index.js")
