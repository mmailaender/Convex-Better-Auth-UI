/**
 * Email template for verification code
 */

/**
 * Generates HTML for verification email
 * @param OTP - The one-time password/verification code
 * @returns HTML string for the verification email
 */
export function generateVerificationEmail(OTP: string): string {
	return `
    <!doctype html>
    <html>
    <head>
        <style>
            @tailwind utilities;
        </style>
    </head>
    <body>
        <h1 class="h2">Verification code</h1>
        <p>Enter the following verification code when prompted:</p>
        <p class="h1">${OTP}</p>
        <p>To protect your account, do not share this code.</p>
    </body>
    </html>
  `;
}
