import { z } from "zod";

/**
 * Server-only environment variables schema.
 * All variables here must NEVER be prefixed with NEXT_PUBLIC_
 * and must NEVER be imported into Client Components.
 */
export const serverEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z
    .string()
    .url("DATABASE_URL must be a valid PostgreSQL connection string")
    .default("postgresql://postgres:postgres@localhost:5432/joomha_education?schema=public"),
  AUTH_SECRET: z.string().min(1).default("development-auth-secret-for-build-and-testing"),
  AUTH_URL: z.string().url().default("http://localhost:3000"),

  // Optional during build/dev, required by domain agent in production
  OPENROUTER_API_KEY: z.string().optional().default(""),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_DEFAULT_MODEL: z.string().default("google/gemini-2.0-flash-001"),

  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_ROOT: z.string().default("./public/uploads"),

  PAYMENT_MOCK_ENABLED: z
    .string()
    .transform((val) => val === "true" || val === "1")
    .default("true"),
  PAYMENT_PROVIDER: z.string().default("mock"),

  MAIL_DRIVER: z.enum(["console", "smtp"]).default("console"),
  MAIL_FROM_ADDRESS: z.string().email().default("no-reply@edu.joomha.dev"),
  MAIL_FROM_NAME: z.string().default("Joomha Education"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let parsedServerEnv: ServerEnv | null = null;

export function getServerEnv(): ServerEnv {
  if (typeof window !== "undefined") {
    throw new Error("CRITICAL SECURITY ERROR: Attempted to access server environment variables from the client/browser!");
  }

  if (!parsedServerEnv) {
    const result = serverEnvSchema.safeParse(process.env);
    if (!result.success) {
      console.error("Invalid server environment variables:", result.error.format());
      throw new Error("Invalid server environment configuration. Please check your .env file.");
    }
    parsedServerEnv = result.data;
  }

  return parsedServerEnv;
}

