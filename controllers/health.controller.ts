import type { Request, Response } from "express";

export const getHealth = (_req: Request, res: Response): void => {
  res.status(200).json({
    status: "ok",
    message: "Health is ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
};

export const getReadiness = (_req: Request, res: Response): void => {
  // Check dependencies here (DB, cache, etc.)
  const ready = true;

  if (!ready) {
    res.status(503).json({ status: "unavailable" });
    return;
  }

  res.status(200).json({ status: "ready" });
};

export const getLiveness = (_req: Request, res: Response): void => {
  res.status(200).json({ status: "alive" });
};
