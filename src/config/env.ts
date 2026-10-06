const required = (key: string): string => {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
};

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",

  SMTP_HOST: required("SMTP_HOST"),
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_USER: required("SMTP_USER"),
  SMTP_PASS: required("SMTP_PASS"),
  SMTP_FROM: process.env.SMTP_FROM ?? required("SMTP_USER"),

  JWT_SECRET: required("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "15m",
  JWT_REFRESH_SECRET: required("JWT_REFRESH_SECRET"),
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN ?? "7d",
} as const;
