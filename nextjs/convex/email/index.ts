import { v } from "convex/values";
import { action } from "../_generated/server";
import { processEmailHtml } from "./process";
import { generateVerificationEmail } from "./templates/verification";
import {
  generateOrganizationInvitationEmail,
  type OrganizationInvitationParams,
} from "./templates/organizationInvitation";
import { type SendEmailResponse } from "./send";
import { api } from "../_generated/api";

/**
 * Interface for email verification result
 */
export interface VerifyEmailReturnData {
  valid: boolean;
  exists: boolean;
  email: string;
  reason?: string;
}

/**
 * Action to send a verification email with OTP
 */
export const sendVerificationEmail = action({
  args: {
    email: v.string(),
    otp: v.string(),
    fromEmail: v.string(),
  },
  handler: async (ctx, args): Promise<SendEmailResponse> => {
    const { email, otp, fromEmail } = args;

    try {
      // Generate the email content
      const rawHtml = generateVerificationEmail(otp);

      // Process the HTML with Maizzle
      const html = await processEmailHtml(rawHtml);

      // Send the email
      return await ctx.runAction(api.email.send.default, {
        from: fromEmail,
        to: email,
        subject: `${otp} is your verification code`,
        html,
      });
    } catch (error) {
      console.error(`Error sending verification email to ${email}:`, error);

      if (error instanceof Error) {
        return {
          error: {
            message: error.message,
            statusCode: 500,
          },
        };
      }

      return {
        error: {
          message: "Unknown error sending verification email",
          statusCode: 500,
        },
      };
    }
  },
});

/**
 * Action to send an organization invitation email
 */
export const sendOrganizationInvitationEmail = action({
  args: {
    email: v.string(),
    organizationName: v.string(),
    inviterName: v.string(),
    acceptUrl: v.string(),
    fromEmail: v.string(),
  },
  handler: async (ctx, args): Promise<SendEmailResponse> => {
    const { email, organizationName, inviterName, acceptUrl, fromEmail } = args;

    try {
      // Generate the invitation email content
      const params: OrganizationInvitationParams = {
        organizationName,
        inviterName,
        acceptUrl,
      };

      const rawHtml = generateOrganizationInvitationEmail(params);

      // Process the HTML with Maizzle
      const html = await processEmailHtml(rawHtml);

      // Send the email
      return await ctx.runAction(api.email.send.default, {
        from: fromEmail,
        to: email,
        subject: `Invitation to join ${organizationName}`,
        html,
      });
    } catch (error) {
      console.error(`Error sending invitation email to ${email}:`, error);

      if (error instanceof Error) {
        return {
          error: {
            message: error.message,
            statusCode: 500,
          },
        };
      }

      return {
        error: {
          message: "Unknown error sending invitation email",
          statusCode: 500,
        },
      };
    }
  },
});

/**
 * Action to verify an email address
 * Checks if the email exists and validates format using an external service
 */
export const verifyEmail = action({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args): Promise<VerifyEmailReturnData> => {
    const { email } = args;

    try {
      // Get the verification token from environment variables
      const verifierToken = process.env.REOON_EMAIL_VERIFIER_TOKEN;

      if (!verifierToken) {
        return {
          valid: false,
          exists: false,
          email,
          reason: "Email verification configuration missing",
        };
      }

      // Check if user already exists in database
      const exists = await ctx.runQuery(api.users.isUserExisting, { email });

      // If user doesn't exist, verify email validity with external service
      if (!exists) {
        const response = await fetch(
          `https://emailverifier.reoon.com/api/v1/verify?email=${encodeURIComponent(email)}&key=${verifierToken}&mode=quick`
        );

        if (!response.ok) {
          return {
            valid: false,
            exists,
            email,
            reason: "Email verification service unavailable",
          };
        }

        const result = await response.json();

        if (result.status !== "valid") {
          return {
            valid: false,
            exists,
            email,
            reason: "Invalid email",
          };
        }
      }

      return {
        valid: true,
        exists,
        email,
        reason: exists ? "User with this email already exists" : undefined,
      };
    } catch (error) {
      console.error("Error verifying email:", error);

      return {
        valid: false,
        exists: false,
        email,
        reason: "Error processing email verification",
      };
    }
  },
});
