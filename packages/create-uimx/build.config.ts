import { defineBuildConfig } from "unbuild"

export default defineBuildConfig({
  clean: true,
  entries: ["./src/index"],
  outDir: "dist",
  declaration: true,
})
