import { Request } from "express";
import { BadRequestError } from "@fixserv-colauncha/shared";

/**
 * Extract a single string value from request params
 * Handles the case where Express might return string[]
 */
export function getParam(req: Request, key: string): string {
  const value = req.params[key];

  if (!value) {
    throw new BadRequestError(`Missing required parameter: ${key}`);
  }

  return Array.isArray(value) ? value[0] : value;
}

/**
 * Extract a single string value from query params
 */
export function getQuery(req: Request, key: string): string | undefined {
  const value = req.query[key];

  if (!value) {
    return undefined;
  }

  return Array.isArray(value) ? value[0]?.toString() : value?.toString();
}

/**
 * Extract multiple values from request params
 */
export function getParams(
  req: Request,
  ...keys: string[]
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const key of keys) {
    result[key] = getParam(req, key);
  }

  return result;
}
