import { Request, Response } from "express";
import { UserService } from "../../application/services/userService";

export class UserController {
  constructor(private userService: UserService) {}
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password, fullName, role, ...roleData } = req.body;

      const { user, sessionToken } = await this.userService.registerUser(
        email,
        password,
        fullName,
        role,
        roleData.clientData,
        roleData.artisanData,
        roleData.adminData
      );

      req.session = { jwt: sessionToken };

      return res.status(201).json(user);
    } catch (error) {
      console.log(error);
      return res.status(404).send(error);
    }
  }
}
