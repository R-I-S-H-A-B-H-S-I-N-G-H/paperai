export type Bindings = {
  GEMINI_API_KEY: string;
  MY_RATE_LIMITER: {
    limit: (options: { key: string }) => Promise<{ success: boolean }>;
  };
};