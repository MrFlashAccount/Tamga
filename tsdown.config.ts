import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/tamga.ts"],
  outDir: "dist",
  format: "esm",
  platform: "neutral",
  sourcemap: true,
  clean: true,
  deps: {
    skipNodeModulesBundle: true,
  },
  dts: false,
});
