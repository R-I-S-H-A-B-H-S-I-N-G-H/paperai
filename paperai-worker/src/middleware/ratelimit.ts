import { createMiddleware } from 'hono/factory'
import { Bindings } from '../types/bindings';

export const rateLimit = createMiddleware<{ Bindings: Bindings }>(
  async (c, next) => {
    const key = c.req.header("cf-connecting-ip") || "anonymous";

    // Call the native Cloudflare Rate Limiter
    const { success } = await c.env.MY_RATE_LIMITER.limit({ key });

    if (!success) {
      // Return a structured JSON response with a 429 status code
      return c.json(
        {
          status: "error",
          message: "Too many requests. Please wait a minute before trying again.",
        },
        429
      );
    }

    await next();
  },
);