import { z } from "zod"

export const ApiConfigSchema = z.object({
  base_url: z.string().url().default("https://api.mizzen.top"),
  site_url: z.string().url().default("https://mizzen.top"),
  timeout: z.number().int().min(1).max(120).default(30),
})

export const OutputConfigSchema = z.object({
  format: z.enum(["table", "json", "csv"]).default("table"),
  color: z.boolean().default(true),
})

export const ConfigSchema = z.object({
  api: ApiConfigSchema.default({}),
  output: OutputConfigSchema.default({}),
})

export type Config = z.infer<typeof ConfigSchema>
