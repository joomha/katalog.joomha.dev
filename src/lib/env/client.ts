import { z } from "zod";

/**
 * Client-accessible environment variables schema.
 * All variables here MUST be prefixed with NEXT_PUBLIC_
 */
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("Joomha Education"),
  NEXT_PUBLIC_APP_TAGLINE: z.string().default("Digital Learning & Business Solutions"),
  NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: z.string().optional().default(""),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

let parsedClientEnv: ClientEnv | null = null;

export function getClientEnv(): ClientEnv {
  if (!parsedClientEnv) {
    const rawEnv = {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
      NEXT_PUBLIC_APP_TAGLINE: process.env.NEXT_PUBLIC_APP_TAGLINE,
      NEXT_PUBLIC_MIDTRANS_CLIENT_KEY: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
    };

    const result = clientEnvSchema.safeParse(rawEnv);
    if (!result.success) {
      console.error("Invalid client environment variables:", result.error.format());
      throw new Error("Invalid client environment configuration.");
    }
    parsedClientEnv = result.data;
  }

  return parsedClientEnv;
}

