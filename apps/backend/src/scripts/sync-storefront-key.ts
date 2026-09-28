import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import fs from "fs"
import path from "path"

/**
 * Copies the storefront's publishable API key into
 * apps/storefront/.env.local so the storefront can talk to this backend.
 *
 *   npm run storefront:key      (from the repo root)
 */
export default async function syncStorefrontKey({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data } = await query.graph({
    entity: "api_key",
    fields: ["token", "title", "type", "revoked_at"],
    filters: { type: "publishable" },
  })

  const key = data.find((k) => !k.revoked_at)
  if (!key) {
    logger.error("No publishable API key found. Run `npx medusa db:migrate` first.")
    return
  }

  const envPath = path.resolve(process.cwd(), "../storefront/.env.local")
  const templatePath = path.resolve(process.cwd(), "../storefront/.env.template")
  let env = fs.existsSync(envPath)
    ? fs.readFileSync(envPath, "utf8")
    : fs.existsSync(templatePath)
      ? fs.readFileSync(templatePath, "utf8")
      : ""

  const line = `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=${key.token}`
  env = /^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*$/m.test(env)
    ? env.replace(/^NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=.*$/m, line)
    : `${line}\n${env}`

  fs.writeFileSync(envPath, env)
  logger.info(`Wrote the "${key.title}" publishable key to apps/storefront/.env.local`)
}
