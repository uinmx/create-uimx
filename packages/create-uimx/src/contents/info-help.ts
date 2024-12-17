import pic from "picocolors"

const { yellow } = pic

// prettier-ignore
export const helpMessage = `\
Usage: create-uimx [OPTION]... [DIRECTORY]

Get a project template provided by uimx
With no arguments, start the CLI in interactive mode.

Options:
  -t, --template NAME        use a specific template

Available templates:
${yellow('mono-pnpm-ts     mono-pnpm')}
`
