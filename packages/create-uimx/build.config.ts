import { defineBuildConfig } from "unbuild"

export default defineBuildConfig({
  clean: true,
  entries: ["./src/index"],
  outDir: "dist",
  rollup: {
    inlineDependencies: true,
    esbuild: {
      minify: true,
      treeShaking: true,
      minifyWhitespace: true,
    },
  },
})
