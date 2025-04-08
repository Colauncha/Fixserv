import { Request, Response } from "express";
import { AuthService } from "../../application/services/authService";
import { NotAuthorizeError } from "../../errors/notAuthorizeError";

export class AuthController {
  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const { user, sessionToken } = await this.authService.login(
        email,
        password
      );

      req.session = { jwt: sessionToken };

      res.status(200).json(user);
    } catch (error) {
      // throw new NotAuthorizeError();
      console.log(error);
      res.status(404).send(error);
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const sessionToken = req.session?.jwt;

      await this.authService.logout(sessionToken);
      req.session = null;
      res.status(200).json({ message: "Logged out successfull" });
    } catch (error) {
      res.status(400).json({ message: "Logout failed" });
    }
  }
  async currentUser(req: Request, res: Response): Promise<void> {}
}
