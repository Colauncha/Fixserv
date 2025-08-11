export class AuthMiddleware {
  protect = (req: any, res: any, next: any) => {
    req.currentUser = {
      id: "71f5df44-384b-4d5a-8012-88ccf517d113",
      email: "a@example.com",
      role: "ARTISAN",
    };
    next();
  };
}
