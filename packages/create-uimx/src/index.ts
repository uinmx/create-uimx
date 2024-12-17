import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

import minimist from "minimist"
import prompts from "prompts"
import spawn from "cross-spawn"
import pic from "picocolors"

import type { Framework } from "./contents"
import { FRAMEWORKS, TEMPLATES, defaultTargetDir } from "./contents"
import { logStart, logEnd } from "./contents/info-color"
import { helpMessage } from "./contents/info-help"
import {
  copy,
  emptyDir,
  setupReactSwc,
  formatTargetDir,
  pkgFromUserAgent,
  isValidPackageName,
  toValidPackageName,
  isEmpty,
} from "./utils"

const { reset, red } = pic

process.on("SIGINT", () => process.exit(0))

const argv = minimist<{
  template?: string
  help?: boolean
}>(process.argv.slice(2), {
  default: { help: false },
  alias: { h: "help", t: "template" },
  string: ["_"],
})
const cwd = process.cwd()

const renameFiles: Record<string, string | undefined> = {
  _gitignore: ".gitignore",
}

async function main() {
  logStart("Running... \n")

  // 1.Gets command line arguments
  const argTargetDir = formatTargetDir(argv._[0])
  const argTemplate = argv.template || argv.t

  if (argv.help) {
    console.log(helpMessage)
    return
  }

  let targetDir = argTargetDir || defaultTargetDir
  const getProjectName = () => path.basename(path.resolve(targetDir))

  let result: prompts.Answers<
    "projectName" | "overwrite" | "packageName" | "framework" | "variant"
  >

  prompts.override({
    overwrite: argv.overwrite,
  })

  try {
    result = await prompts(
      [
        {
          type: argTargetDir ? null : "text",
          name: "projectName",
          message: reset("What is your project name?:"),
          initial: defaultTargetDir,
          onState: (state) => {
            targetDir = formatTargetDir(state.value) || defaultTargetDir
          },
        },
        {
          type: () =>
            !fs.existsSync(targetDir) || isEmpty(targetDir) ? null : "select",
          name: "overwrite",
          message: () =>
            (targetDir === "."
              ? "Current directory"
              : `Target directory "${targetDir}"`) +
            ` is not empty. Please choose how to proceed:`,
          initial: 0,
          choices: [
            {
              title: "Cancel operation",
              value: "no",
            },
            {
              title: "Remove existing files and continue",
              value: "yes",
            },
            {
              title: "Ignore files and continue",
              value: "ignore",
            },
          ],
        },
        {
          type: (_, { overwrite }: { overwrite?: string }) => {
            if (overwrite === "no") {
              throw new Error(red("✖ ") + " Operation cancelled")
            }
            return null
          },
          name: "overwriteChecker",
        },
        {
          type: () => (isValidPackageName(getProjectName()) ? null : "text"),
          name: "packageName",
          message: reset("Package name:"),
          initial: () => toValidPackageName(getProjectName()),
          validate: (dir) =>
            isValidPackageName(dir) || "Invalid package.json name",
        },
        {
          type:
            argTemplate && TEMPLATES.includes(argTemplate) ? null : "select",
          name: "framework",
          message:
            typeof argTemplate === "string" && !TEMPLATES.includes(argTemplate)
              ? reset(
                  `"${argTemplate}" isn't a valid template. Please choose from below: `
                )
              : reset("Select a framework:"),
          initial: 0,
          choices: FRAMEWORKS.map((framework) => {
            const frameworkColor = framework.color
            return {
              title: frameworkColor(framework.display || framework.name),
              value: framework,
            }
          }),
        },
        {
          type: (framework: Framework | string) =>
            typeof framework === "object" ? "select" : null,
          name: "variant",
          message: reset("Select a variant:"),
          choices: (framework: Framework) =>
            framework.variants.map((variant) => {
              const variantColor = variant.color
              return {
                title: variantColor(variant.display || variant.name),
                value: variant.name,
              }
            }),
        },
      ],
      {
        onCancel: () => {
          throw new Error(red("✖ ") + " Operation cancelled")
        },
      }
    )
  } catch (cancelled: any) {
    logEnd(cancelled.message)
    return
  }

  // 2.user choice associated with prompts
  const { framework, overwrite, packageName, variant } = result
  const root = path.join(cwd, targetDir)

  if (overwrite === "yes") {
    emptyDir(root)
  } else if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true })
  }

  // 3.determine template
  let template: string = variant || framework?.name || argTemplate
  let isReactSwc = false
  if (template.includes("-swc")) {
    isReactSwc = true
    template = template.replace("-swc", "")
  }

  // 4.package info
  const pkgInfo = pkgFromUserAgent(process.env.npm_config_user_agent)
  const pkgManager = pkgInfo ? pkgInfo.name : "npm"
  const isYarn1 = pkgManager === "yarn" && pkgInfo?.version.startsWith("1.")

  // 5.1.Use custom commands to run the third-party CLi
  const { customCommand } =
    FRAMEWORKS.flatMap((f) => f.variants).find((v) => v.name === template) ?? {}

  if (customCommand) {
    const fullCustomCommand = customCommand
      .replace(/^npm create /, () => {
        // `bun create` uses it's own set of templates,
        // the closest alternative is using `bun x` directly on the package
        if (pkgManager === "bun") {
          return "bun x create-"
        }
        return `${pkgManager} create `
      })
      // Only Yarn 1.x doesn't support `@version` in the `create` command
      .replace("@latest", () => (isYarn1 ? "" : "@latest"))
      .replace(/^npm exec/, () => {
        // Prefer `pnpm dlx`, `yarn dlx`, or `bun x`
        if (pkgManager === "pnpm") {
          return "pnpm dlx"
        }
        if (pkgManager === "yarn" && !isYarn1) {
          return "yarn dlx"
        }
        if (pkgManager === "bun") {
          return "bun x"
        }
        // Use `npm exec` in all other cases,
        // including Yarn 1.x and other custom npm clients.
        return "npm exec"
      })

    const [command, ...args] = fullCustomCommand.split(" ")
    // we replace TARGET_DIR here because targetDir may include a space
    const replacedArgs = args.map((arg) =>
      arg.replace("TARGET_DIR", () => targetDir)
    )
    const { status } = spawn.sync(command, replacedArgs, {
      stdio: "inherit",
    })
    process.exit(status ?? 0)
  }

  console.log(`\nScaffolding project in ${root}...`)

  const templateDir = path.resolve(
    fileURLToPath(import.meta.url),
    "../..",
    `template-${template}`
  )

  // 5.2.Generate project Using local templates
  const write = (file: string, content?: string) => {
    const targetPath = path.join(root, renameFiles[file] ?? file)
    if (content) {
      fs.writeFileSync(targetPath, content)
    } else {
      copy(path.join(templateDir, file), targetPath)
    }
  }

  const files = fs.readdirSync(templateDir)
  for (const file of files.filter((f) => f !== "package.json")) {
    write(file)
  }

  const pkg = JSON.parse(
    fs.readFileSync(path.join(templateDir, `package.json`), "utf-8")
  )

  pkg.name = packageName || getProjectName()

  write("package.json", JSON.stringify(pkg, null, 2) + "\n")

  if (isReactSwc) {
    setupReactSwc(root, template.endsWith("-ts"))
  }

  // 6.Run projrct prompt
  const cdProjectName = path.relative(cwd, root)
  console.log(`\nDone. Now run:\n`)
  if (root !== cwd) {
    console.log(
      `  cd ${cdProjectName.includes(" ") ? `"${cdProjectName}"` : cdProjectName}
            `
    )
  }
  switch (pkgManager) {
    case "yarn":
      console.log("  yarn")
      console.log("  yarn dev")
      break
    default:
      console.log(`  ${pkgManager} install`)
      console.log(`  ${pkgManager} run dev`)
      break
  }
  console.log()
}

main().catch((e) => console.error(e))
