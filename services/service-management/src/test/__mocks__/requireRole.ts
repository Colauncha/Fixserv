export const requireRole = (..._roles: string[]) => {
  return (req: any, _res: any, next: any) => {
    // Just allow the request in tests
    next();
  };
};
