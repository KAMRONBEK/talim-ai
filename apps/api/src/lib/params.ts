import type { Request } from 'express';

export function getParam(req: Request, name: string): string {
  const value = req.params[name];
  if (typeof value === 'string') return value;
  if (Array.isArray(value) && value[0]) return value[0];
  throw new Error(`Missing route parameter: ${name}`);
}
