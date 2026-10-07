import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const REDIS_URL = process.env.REDIS_URL
const IS_PROD = process.env.NODE_ENV === "production"

/**
 * Redis-backed infrastructure modules. Used whenever REDIS_URL is set
 * (always in production). Without Redis, Medusa falls back to in-memory
 * versions, which are fine for local development only.
 */
const redisModules = REDIS_URL
  ? [
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { redis: { redisUrl: REDIS_URL } },
      },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl: REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

/**
 * Product images. Saved to the server's static folder by default, served from
 * <MEDUSA_BACKEND_URL>/static. S3-compatible storage (AWS S3, Cloudflare R2,
 * DigitalOcean Spaces) is used instead when S3_BUCKET is set.
 */
const PUBLIC_BACKEND_URL = (
  process.env.MEDUSA_BACKEND_URL || "http://localhost:9000"
).replace(/\/$/, "")

const fileModule = process.env.S3_BUCKET
  ? [
      {
        resolve: "@medusajs/medusa/file",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/file-s3",
              id: "s3",
              options: {
                file_url: process.env.S3_FILE_URL,
                access_key_id: process.env.S3_ACCESS_KEY_ID,
                secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
                region: process.env.S3_REGION,
                bucket: process.env.S3_BUCKET,
                endpoint: process.env.S3_ENDPOINT,
              },
            },
          ],
        },
      },
    ]
  : [
      {
        resolve: "@medusajs/medusa/file",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/file-local",
              id: "local",
              options: {
                // Without this, uploaded images get http://localhost:9000 links
                // that only work on the server itself.
                backend_url: `${PUBLIC_BACKEND_URL}/static`,
              },
            },
          ],
        },
      },
    ]

/**
 * Payments: Cash on Delivery uses Medusa's built-in manual provider
 * (pp_system_default). Cashfree is added when its keys are present.
 */
const cashfreeEnabled = Boolean(
  process.env.CASHFREE_CLIENT_ID && process.env.CASHFREE_CLIENT_SECRET
)

const paymentModule = [
  {
    resolve: "@medusajs/medusa/payment",
    options: {
      providers: cashfreeEnabled
        ? [
            {
              resolve: "./src/modules/cashfree",
              id: "cashfree",
              options: {
                clientId: process.env.CASHFREE_CLIENT_ID,
                clientSecret: process.env.CASHFREE_CLIENT_SECRET,
                environment:
                  process.env.CASHFREE_ENVIRONMENT === "production"
                    ? "production"
                    : "sandbox",
                storefrontUrl: process.env.STOREFRONT_URL,
                apiBaseUrl: process.env.CASHFREE_API_BASE_URL || undefined,
                backendUrl: process.env.MEDUSA_BACKEND_URL,
              },
            },
          ]
        : [],
    },
  },
]

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: REDIS_URL,
    workerMode: (process.env.MEDUSA_WORKER_MODE as
      | "shared"
      | "worker"
      | "server") ?? "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || (IS_PROD ? undefined : "supersecret"),
      cookieSecret:
        process.env.COOKIE_SECRET || (IS_PROD ? undefined : "supersecret"),
    },
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    { resolve: "./src/modules/stitching" },
    ...paymentModule,
    ...fileModule,
    ...redisModules,
  ],
})

