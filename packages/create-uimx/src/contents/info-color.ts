import pic from "picocolors"
import { prefixName } from "./index"

/**
 * Prefix for all log messages.
 */
export const logPrefix = pic.yellowBright(`[${prefixName}]`)

/**
 * logging.
 */
export const logStart = (str: string) => console.log(logPrefix, `Start: ${str}`)
export const logEnd = (str: string) => console.log(logPrefix, `End: ${str}`)

/**
 * Information
 */
export const info = (msg: string) =>
  console.log(pic.blue(`[${prefixName}] Info: ${msg}`))

/**
 * Success
 */
export const success = (msg: string) =>
  console.log(pic.green(`[${prefixName}] Success: ${msg}`))

/**
 * Warning
 */
export const warn = (msg: string) =>
  console.log(pic.yellow(`[${prefixName}] Warning: ${msg}`))

/**
 * Error
 */
export const infoError = (msg: string) =>
  console.log(pic.red(`[${prefixName}] Error: ${msg}`))
