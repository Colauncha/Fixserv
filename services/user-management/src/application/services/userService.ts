import { UserAggregate } from "../../domain/aggregates/userAggregate";
import { IUserRepository } from "../../domain/repositories/userRepository";
import { BusinessHours } from "../../domain/value-objects/businessHours";
import { DeliveryAddress } from "../../domain/value-objects/deliveryAddress";
import { Email } from "../../domain/value-objects/email";
import { Password } from "../../domain/value-objects/password";
import { ServicePreferences } from "../../domain/value-objects/servicePreferences";
import { SkillSet } from "../../domain/value-objects/skillSet";
import { TokenService } from "../../infrastructure/services/tokenService";
import { IUserService } from "../../interfaces/IUserService";
import { v4 as uuidv4 } from "uuid";

export class UserService implements IUserService {
  constructor(
    private userRepository: IUserRepository,
    private tokenService: TokenService
  ) {}

  async registerUser(
    email: string,
    password: string,
    fullName: string,
    role: "CLIENT" | "ARTISAN" | "ADMIN",
    clientData?: {
      deliveryAddress: {
        street: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
      };
      servicePreferences: string[];
    },
    artisanData?: {
      businessName: string;
      skillSet: string[];

      businessHours: Record<string, { open: string; close: string }>;
      location: string;
      rating: number;
    },
    adminData?: {
      permissions: string[];
    }
  ): Promise<{ user: UserAggregate; sessionToken: string }> {
    const emailData = new Email(email);
    const passwordData = await Password.create(password);

    let user: UserAggregate;

    switch (role) {
      case "CLIENT":
        if (!clientData) throw new Error("Client data required");
        user = UserAggregate.createClient(
          uuidv4(),
          emailData,
          passwordData,
          fullName,
          new DeliveryAddress(
            clientData.deliveryAddress.city,
            clientData.deliveryAddress.country,
            clientData.deliveryAddress.postalCode,
            clientData.deliveryAddress.state,
            clientData.deliveryAddress.street
          ),
          new ServicePreferences(clientData.servicePreferences)
        );
        break;

      case "ARTISAN":
        if (!artisanData) throw new Error("Artisan data required");
        user = UserAggregate.createArtisan(
          uuidv4(),
          emailData,
          passwordData,
          fullName,
          artisanData.businessName,
          artisanData.rating,
          artisanData.location,
          new SkillSet(artisanData.skillSet),
          new BusinessHours(artisanData.businessHours)
        );
        break;

      case "ADMIN":
        if (!adminData) throw new Error("Admin data required");
        user = UserAggregate.createAdmin(
          uuidv4(),
          emailData,
          fullName,
          passwordData,
          adminData.permissions
        );
        break;
      default:
        throw new Error("Invalid role");
    }
    const sessionToken = this.tokenService.generateSessionToken(
      user.id
    );
    await this.userRepository.save(user);
    return { user, sessionToken };
  }
}
