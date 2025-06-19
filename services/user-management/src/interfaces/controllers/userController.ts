import { Request, Response } from "express";
import { UserService } from "../../application/services/userService";

import { UserAggregate } from "../../domain/aggregates/userAggregate";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";
import { BadRequestError } from "@fixserv-colauncha/shared";
import { ArtisanModel } from "../../infrastructure/persistence/models/artisan";

export class UserController {
  private response = new UserRepositoryImpl();
  constructor(private userService: UserService) {}
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, fullName, role, ...roleData } = req.body;

      const { user } = await this.userService.registerUser(
        email,
        password,
        fullName,
        role,
        roleData.clientData,
        roleData.artisanData,
        roleData.adminData
      );

      // req.session = { jwt: sessionToken };

      res.status(201).json(this.response.toJSON(user));
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestError("Email already in use");
      }
      // return res.status(404).send(error);
    }
  }
  async users(req: Request, res: Response): Promise<void> {
    try {
      const artisans = await ArtisanModel.find();
      if (!artisans) {
        throw new BadRequestError("No artisan in Database");
      }
      res.status(200).json({
        results: artisans.length,
        data: {
          artisans,
        },
      });
    } catch (error: any) {
      throw new BadRequestError("Not found");
    }
  }

  test(req: Request, res: Response) {
    res.send("Hello world");
  }
}
