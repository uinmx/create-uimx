import pic from "picocolors"

const { blue, greenBright, reset, yellow, magenta } = pic

export const prefixName = "uimx"

export const defaultTargetDir = "uimx-project"

export type ColorFunc = (str: string | number) => string
export type FrameworkVariant = {
  name: string
  display: string
  color: ColorFunc
  customCommand?: string
}
export type Framework = {
  name: string
  display: string
  color: ColorFunc
  variants: FrameworkVariant[]
}

export const FRAMEWORKS: Framework[] = [
  {
    name: "monorepo",
    display: "Monorepo",
    color: greenBright,
    variants: [
      {
        name: "mono-pnpm-ts",
        display: "TypeScript",
        color: blue,
      },
      {
        name: "mono-pnpm",
        display: "JavaScript",
        color: yellow,
      },
    ],
  },
  {
    name: "vite",
    display: "Vite",
    color: yellow,
    variants: [
      {
        name: "create-vite-template",
        display: "create-vite ↗",
        color: reset,
        customCommand: "npm create vite@latest TARGET_DIR",
      },
    ],
  },
  {
    name: "turborepo",
    display: "Turborepo",
    color: magenta,
    variants: [
      {
        name: "create-turbo",
        display: "create-turbo ↗",
        color: reset,
        customCommand: "npx create-turbo@latest TARGET_DIR",
      },
    ],
  },
  {
    name: "others",
    display: "Others",
    color: reset,
    variants: [
      {
        name: "create-vite-extra",
        display: "create-vite-extra ↗",
        color: reset,
        customCommand: "npm create vite-extra@latest TARGET_DIR",
      },
      {
        name: "create-electron-vite",
        display: "create-electron-vite ↗",
        color: reset,
        customCommand: "npm create electron-vite@latest TARGET_DIR",
      },
      {
        name: "create-tauri-vite",
        display: "create-tauri ↗",
        color: reset,
        customCommand: "npm create tauri-app@latest TARGET_DIR",
      },
    ],
  },
]

/**
 * templates Map
 */
export const TEMPLATES = FRAMEWORKS.map((f) =>
  f.variants.map((v) => v.name)
).reduce((a, b) => a.concat(b), [])
