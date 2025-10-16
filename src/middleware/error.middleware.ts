import { Request, Response, NextFunction } from "express";

export interface ApiError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error("Error handler:", {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
  });

  const statusCode = error.statusCode || 500;
  const message = error.isOperational ? error.message : "Internal server error";

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
      details: error.message,
    }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: "Route not found",
    path: req.originalUrl,
  });
};
