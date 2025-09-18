import { Request, Response } from "express";
import { redis, connectRedis } from "@fixserv-colauncha/shared";
import { AuthService } from "../../application/services/authService";
import { BadRequestError, NotAuthorizeError } from "@fixserv-colauncha/shared";
import { UserRepositoryImpl } from "../../infrastructure/persistence/userRepositoryImpl";
import { validateUpdateRequest } from "../middlewares/validateUpdateRequest";
import { UserAggregate } from "../../domain/aggregates/userAggregate";
import { DeliveryAddress } from "../../domain/value-objects/deliveryAddress";
import { ServicePreferences } from "../../domain/value-objects/servicePreferences";
import { BusinessHours } from "../../domain/value-objects/businessHours";
import { SkillSet } from "../../domain/value-objects/skillSet";
import { refreshUserCache } from "../../infrastructure/utils/refreshUserCache";

export class AuthController {
  private userRepository = new UserRepositoryImpl();

  constructor(private authService: AuthService) {}

  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        throw new BadRequestError("Email and password are required");
      }
      const { user, BearerToken } = await this.authService.login(
        email,
        password
      );

      res.cookie("jwt", BearerToken, {
        httpOnly: true,
        secure: false, // Set to true in production
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000, // 1 day
      });

      const response = this.userRepository.toJSON(user);

      res.status(200).json({ data: { response, BearerToken } });
    } catch (error: any) {
      console.error("Login failed:", error);
      if (error.message === "Email not verified") {
        res.status(403).json({
          success: false,
          message: "Please verify your email before logging in",
          code: "EMAIL_NOT_VERIFIED",
        });
      }
      throw new BadRequestError("Invalid credentials");
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      res.clearCookie("jwt", {
        httpOnly: true,
      });
      res.status(200).json({ message: "Logged out successfull" });
    } catch (error) {
      res.status(400).json({ message: "Logout failed" });
    }
  }
  async findUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const user = await this.authService.findUserById(id);
      res.status(200).json(user);
    } catch (error) {
      res.status(400).json({ message: "User not found" });
    }
  }

  async findUserByEmail(req: Request, res: Response): Promise<void> {
    try {
      const email = req.params.email;
      const user = await this.authService.findUserByEmail(email);
      if (!user) {
        throw new BadRequestError("User not found");
      }
      res.status(200).json(user);
    } catch (error: any) {
      res.status(400).json({ message: error.message || "User not found" });
    }
  }

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const role = req.query.role as string | undefined;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { users, total } = await this.authService.getAllUsers(
        role,
        page,
        limit
      );

      res.status(200).json({
        results: users.length,
        total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        users,
      });
    } catch (error: any) {
      throw new BadRequestError(error.message);
    }
  }

  async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const updates = req.body;
      const currentUser = req.currentUser!;

      if (currentUser.id !== id) {
        throw new BadRequestError("Unauthorized to update this user");
      }

      // Get existing user
      const existingUser = await this.authService.findUserById(id);
      if (!existingUser) {
        throw new BadRequestError("User not found");
      }

      // Validate updates based on role
      validateUpdateRequest(existingUser.role, updates);

      // Preserve verification state
      const wasEmailVerified = existingUser.isEmailVerified;
      const verifiedAt = existingUser.emailVerifiedAt;

      // Apply updates
      const updatedUser = this.applyUpdates(existingUser, updates);

      //delete password and emailverificationtoken fields

      // Restore verification state
      if (wasEmailVerified) {
        updatedUser.markEmailAsVerified(verifiedAt ?? undefined);
      }

      // Save updated user
      await this.userRepository.save(updatedUser);

      //await connectRedis();
      //await refreshUserCache(updatedUser);

      // Invalidate cache after update
      await this.authService.invalidateUserCache(updatedUser.id);
      await this.authService.invalidateEmailCache(updatedUser.email);

      // Re-fetch from DB (this will also repopulate cache)
      const freshUser = await this.authService.findUserById(updatedUser.id);

      // res.status(200).json(updatedUser);
      res.status(200).json(freshUser);
    } catch (error: any) {
      res.status(error instanceof BadRequestError ? 400 : 500).json({
        success: false,
        error: error.message,
      });
    }
  }

  private applyUpdates(user: UserAggregate, updates: any): UserAggregate {
    // Base fields that all users can update
    if (updates.fullName) user.updateFullName(updates.fullName);
    if (updates.phoneNumber) user.updatePhoneNumber(updates.phoneNumber);
    // if (updates.password) user.changePassword(user.password, updates.//password);

    // Role-specific updates
    switch (user.role) {
      case "CLIENT":
        if (updates.deliveryAddress) {
          user.updateDeliveryAddress(
            new DeliveryAddress(
              updates.deliveryAddress.street,
              updates.deliveryAddress.city,
              updates.deliveryAddress.postalCode,
              updates.deliveryAddress.state,
              updates.deliveryAddress.country
            )
          );
        }
        if (updates.servicePreferences) {
          user.updateServicePreferences(
            new ServicePreferences(updates.servicePreferences)
          );
        }
        break;

      case "ARTISAN":
        if (updates.businessName) user.updateBusinessName(updates.businessName);
        if (updates.location) user.updateLocation(updates.location);
        if (updates.skillSet) {
          user.updateSkillSet(new SkillSet(updates.skillSet));
        }
        if (updates.businessHours) {
          user.updateBusinessHours(new BusinessHours(updates.businessHours));
        }
        break;

      case "ADMIN":
        if (updates.permissions && user.role === "ADMIN") {
          user.updatePermissions(updates.permissions);
        }
        break;
    }

    return user;
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body as { email?: string };

      if (!email || !email.trim()) {
        throw new BadRequestError("Provide a valid Email");
      }

      await this.authService.requestPasswordReset(email.toLowerCase());

      res.status(200).json({
        success: true,
        message:
          "If there is an account for that Email, a reset link has been sent.",
      });
    } catch (error: any) {
      throw new BadRequestError(error);
    }
  }

  async resetPassword(req: Request, res: Response) {
    const { token } = req.query;
    const { newPassword } = req.body;

    if (!token || typeof token !== "string") {
      throw new BadRequestError("Reset token is required");
    }
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestError("Password mst be at least 6 characters");
    }
    try {
      await this.authService.resetPassword(token, newPassword);
      res.status(200).json({ message: "Password reset successful" });
    } catch (error: any) {
      console.error("Reset password failed:", error);
      res
        .status(error.statusCode || 500)
        .json({ message: error.message || "Failed to reset password" });
    }
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    const { idToken } = req.body;
    if (!idToken) {
      throw new BadRequestError("Missing Google ID token");
    }

    const { user, BearerToken } = await this.authService.loginWithGoogle(
      idToken
    );
    res.status(200).json({
      message: "Google login successful",
      user: this.userRepository.toJSON(user),
      BearerToken,
    });
  }
  /*
  async showResetPasswordForm(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      console.log(token);
      if (!token || typeof token !== "string") {
        res.status(400).send(`
          <html>
            <head><title>Invalid Reset Link</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <div style="text-align: center;">
                <h1 style="color: #dc3545;">FixServ</h1>
                <h2 style="color: #dc3545;">Invalid Reset Link</h2>
                <p>This password reset link is invalid or malformed.</p>
                <a href="${
                  process.env.BASE_URL || "http://localhost:3000"
                }/forgot-password" 
                   style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Request New Reset Link
                </a>
              </div>
            </body>
          </html>
        `);
      }

      // Validate token without resetting password
      const userId = this.authService.validatePasswordResetToken(token as any);
      console.log("userId", userId);
      if (!userId) {
        res.status(400).send(`
          <html>
            <head><title>Expired Reset Link</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <div style="text-align: center;">
                <h1 style="color: #dc3545;">FixServ</h1>
                <h2 style="color: #dc3545;">Reset Link Expired</h2>
                <p>This password reset link has expired or is invalid.</p>
                <a href="${
                  process.env.BASE_URL || "http://localhost:3000"
                }/api/admin/forgot-password" 
                   style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Request New Reset Link
                </a>
              </div>
            </body>
          </html>
        `);
      }

      // Token is valid, show the password reset form
      res.send(`
        <html>
          <head>
            <title>Reset Your Password - FixServ</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
          </head>
          <body style="font-family: Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
            <div style="max-width: 500px; margin: 50px auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #dc3545; margin: 0;">FixServ</h1>
                <h2 style="color: #333; margin: 10px 0;">Reset Your Password</h2>
                <p style="color: #666;">Enter your new password below</p>
              </div>

              <form id="resetForm" style="width: 100%;">
                <div style="margin-bottom: 20px;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                    New Password
                  </label>
                  <input 
                    type="password" 
                    id="newPassword" 
                    name="newPassword"
                    required
                    minlength="6"
                    style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box;"
                    placeholder="Enter your new password"
                  />
                </div>

                <div style="margin-bottom: 20px;">
                  <label style="display: block; margin-bottom: 5px; font-weight: bold; color: #333;">
                    Confirm Password
                  </label>
                  <input 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword"
                    required
                    minlength="6"
                    style="width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; box-sizing: border-box;"
                    placeholder="Confirm your new password"
                  />
                </div>

                <button 
                  type="submit"
                  style="width: 100%; background-color: #dc3545; color: white; padding: 15px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; cursor: pointer;">
                  Reset Password
                </button>
              </form>

              <div id="message" style="margin-top: 20px; padding: 15px; border-radius: 5px; display: none;"></div>
            </div>

            <script>
              document.getElementById('resetForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const messageDiv = document.getElementById('message');
                
                // Reset message
                messageDiv.style.display = 'none';
                
                // Validate passwords match
                if (newPassword !== confirmPassword) {
                  messageDiv.style.backgroundColor = '#f8d7da';
                  messageDiv.style.color = '#721c24';
                  messageDiv.style.border = '1px solid #f5c6cb';
                  messageDiv.textContent = 'Passwords do not match';
                  messageDiv.style.display = 'block';
                  return;
                }

                // Validate password length
                if (newPassword.length < 6) {
                  messageDiv.style.backgroundColor = '#f8d7da';
                  messageDiv.style.color = '#721c24';
                  messageDiv.style.border = '1px solid #f5c6cb';
                  messageDiv.textContent = 'Password must be at least 6 characters long';
                  messageDiv.style.display = 'block';
                  return;
                }

                try {
                  const response = await fetch("${
                    process.env.BASE_URL
                  }/api/admin/reset-password?token=${token}", {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ newPassword })
                  });

                  const data = await response.json();

                  console.log('Reset password response:', data);

                  if (response.ok) {
                    messageDiv.style.backgroundColor = '#d4edda';
                    messageDiv.style.color = '#155724';
                    messageDiv.style.border = '1px solid #c3e6cb';
                    messageDiv.innerHTML = 'Password reset successful! You can now <a href="${
                      process.env.BASE_URL || "http://localhost:3000"
                    }/api/admin/login">login with your new password</a>';
                    messageDiv.style.display = 'block';
                    
                    // Hide form
                    document.getElementById('resetForm').style.display = 'none';
                  } else {
                    throw new Error(data.message || 'Password reset failed');
                  }
                } catch (error) {
                  messageDiv.style.backgroundColor = '#f8d7da';
                  messageDiv.style.color = '#721c24';
                  messageDiv.style.border = '1px solid #f5c6cb';
                  messageDiv.textContent = error.message || 'An error occurred. Please try again.';
                  messageDiv.style.display = 'block';
                }
              });
            </script>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("Error showing reset form:", error);
      res.status(500).send(`
        <html>
          <head><title>Error - FixServ</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <div style="text-align: center;">
              <h1 style="color: #dc3545;">FixServ</h1>
              <h2 style="color: #dc3545;">Something went wrong</h2>
              <p>An error occurred while processing your request.</p>
              <a href="${
                process.env.BASE_URL || "http://localhost:3000"
              }/forgot-password" 
                 style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Request New Reset Link
              </a>
            </div>
          </body>
        </html>
      `);
    }
  }
    */
  async showResetPasswordForm(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.query;

      console.log("Token received:", token);

      if (!token || typeof token !== "string") {
        res.status(400).send(`
          <html>
            <head><title>Invalid Reset Link</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <div style="text-align: center;">
                <h1 style="color: #dc3545;">FixServ</h1>
                <h2 style="color: #dc3545;">Invalid Reset Link</h2>
                <p>This password reset link is invalid or malformed.</p>
                <a href="${
                  process.env.BASE_URL || "http://localhost:3000"
                }/forgot-password" 
                   style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Request New Reset Link
                </a>
              </div>
            </body>
          </html>
        `);
      }

      // Validate token without resetting password
      const userId = await this.authService.validatePasswordResetToken(
        token as any
      );
      console.log("Validated userId:", userId);

      if (!userId) {
        res.status(400).send(`
          <html>
            <head><title>Expired Reset Link</title></head>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
              <div style="text-align: center;">
                <h1 style="color: #dc3545;">FixServ</h1>
                <h2 style="color: #dc3545;">Reset Link Expired</h2>
                <p>This password reset link has expired or is invalid.</p>
                <a href="${
                  process.env.BASE_URL || "http://localhost:3000"
                }/api/admin/forgot-password" 
                   style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                  Request New Reset Link
                </a>
              </div>
            </body>
          </html>
        `);
      }

      // Token is valid, show the password reset form
      // res.send(`
      //   <html>
      //     <head>
      //       <title>Reset Your Password - FixServ</title>
      //       <meta name="viewport" content="width=device-width, //initial-scale=1">
      //     </head>
      //     <body style="font-family: Arial, sans-serif; background-color: //#f5f5f5; margin: 0; padding: 20px;">
      //       <div style="max-width: 500px; margin: 50px auto; background: //white; padding: 40px; border-radius: 10px; box-shadow: 0 2px //10px rgba(0,0,0,0.1);">
      //         <div style="text-align: center; margin-bottom: 30px;">
      //           <h1 style="color: #dc3545; margin: 0;">FixServ</h1>
      //           <h2 style="color: #333; margin: 10px 0;">Reset Your //Password</h2>
      //           <p style="color: #666;">Enter your new password below<///p>
      //         </div>
      //
      //         <form id="resetForm" onsubmit="return false;">
      //           <div style="margin-bottom: 20px;">
      //             <label style="display: block; margin-bottom: 5px; //font-weight: bold; color: #333;">
      //               New Password
      //             </label>
      //             <input
      //               type="password"
      //               id="newPassword"
      //               name="newPassword"
      //               required
      //               minlength="6"
      //               style="width: 100%; padding: 12px; border: 1px solid //#ddd; border-radius: 5px; font-size: 16px; //box-sizing: border-box;"
      //               placeholder="Enter your new password"
      //               autocomplete="new-password"
      //             />
      //           </div>
      //
      //           <div style="margin-bottom: 20px;">
      //             <label style="display: block; margin-bottom: 5px; //font-weight: bold; color: #333;">
      //               Confirm Password
      //             </label>
      //             <input
      //               type="password"
      //               id="confirmPassword"
      //               name="confirmPassword"
      //               required
      //               minlength="6"
      //               style="width: 100%; padding: 12px; border: 1px solid //#ddd; border-radius: 5px; font-size: 16px; //box-sizing: border-box;"
      //               placeholder="Confirm your new password"
      //               autocomplete="new-password"
      //             />
      //           </div>
      //
      //           <button
      //             type="button"
      //             id="submitBtn"
      //             style="width: 100%; background-color: #dc3545; color: //white; padding: 15px; border: none; border-radius: //5px; font-size: 16px; font-weight: bold; cursor: //pointer;">
      //             Reset Password
      //           </button>
      //         </form>
      //
      //         <div id="message" style="margin-top: 20px; padding: 15px; //border-radius: 5px; display: none;"></div>
      //       </div>
      //
      //                     <script>
      //         // Wait for DOM to load
      //         document.addEventListener('DOMContentLoaded', function() {
      //           const form = document.getElementById('resetForm');
      //           const submitBtn = document.getElementById('submitBtn');
      //           const messageDiv = document.getElementById('message');
      //
      //           if (!submitBtn) {
      //             console.error('Submit button not found!');
      //             return;
      //           }
      //
      //           // Handle button click
      //           submitBtn.addEventListener('click', async function(e) {
      //             e.preventDefault();
      //             e.stopPropagation();
      //
      //             console.log('Reset password button clicked');
      //
      //             const newPassword = document.getElementById//('newPassword').value;
      //             const confirmPassword = document.getElementById//('confirmPassword').value;
      //
      //             // Reset message
      //             messageDiv.style.display = 'none';
      //             submitBtn.disabled = true;
      //             submitBtn.textContent = 'Resetting...';
      //
      //             // Validate passwords match
      //             if (newPassword !== confirmPassword) {
      //               showMessage('Passwords do not match', 'error');
      //               resetButton();
      //               return;
      //             }
      //
      //             // Validate password length
      //             if (newPassword.length < 6) {
      //               showMessage('Password must be at least 6 characters //long', 'error');
      //               resetButton();
      //               return;
      //             }
      //
      //             try {
      //               console.log('Making PATCH request to:', "${process.//env.BASE_URL}/api/admin/reset-password?token=${token}//");
      //
      //               const response = await fetch("${process.env.//BASE_URL}/api/admin/reset-password?token=${token}", {
      //                 method: 'PATCH',
      //                 headers: {
      //                   'Content-Type': 'application/json',
      //                 },
      //                 body: JSON.stringify({ newPassword: newPassword })
      //               });
      //
      //               console.log('Response status:', response.status);
      //               const data = await response.json();
      //               console.log('Response data:', data);
      //
      //               if (response.ok) {
      //                 showMessage('Password reset successful! You can //now login with your new password.', 'success');
      //                 form.style.display = 'none';
      //               } else {
      //                 throw new Error(data.message || 'Password reset //failed');
      //               }
      //             } catch (error) {
      //               console.error('Reset error:', error);
      //               showMessage(error.message || 'An error occurred. //Please try again.', 'error');
      //               resetButton();
      //             }
      //           });
      //
      //           function showMessage(text, type) {
      //             if (type === 'success') {
      //               messageDiv.style.backgroundColor = '#d4edda';
      //               messageDiv.style.color = '#155724';
      //               messageDiv.style.border = '1px solid #c3e6cb';
      //             } else {
      //               messageDiv.style.backgroundColor = '#f8d7da';
      //               messageDiv.style.color = '#721c24';
      //               messageDiv.style.border = '1px solid #f5c6cb';
      //             }
      //             messageDiv.textContent = text;
      //             messageDiv.style.display = 'block';
      //           }
      //
      //           function resetButton() {
      //             submitBtn.disabled = false;
      //             submitBtn.textContent = 'Reset Password';
      //           }
      //         });
      //       </script>
      //     </body>
      //   </html>
      // `);
      res.redirect(
        `${process.env.FIXSERV_FRONTEND}/auth/reset-password?token=${token}`
      );
    } catch (error: any) {
      console.error("Error showing reset form:", error);
      res.status(500).send(`
        <html>
          <head><title>Error - FixServ</title></head>
          <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px;">
            <div style="text-align: center;">
              <h1 style="color: #dc3545;">FixServ</h1>
              <h2 style="color: #dc3545;">Something went wrong</h2>
              <p>An error occurred while processing your request.</p>
              <a href="${
                process.env.BASE_URL || "http://localhost:3000"
              }/forgot-password" 
                 style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Request New Reset Link
              </a>
            </div>
          </body>
          </html>
      `);
    }
  }
}
