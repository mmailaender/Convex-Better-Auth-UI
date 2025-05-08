import { Resend } from 'resend';

/**
 * Email sending input parameters
 */
export interface SendEmailInput {
	from: string;
	to: string;
	subject: string;
	html: string;
}

/**
 * Email sending response
 */
export interface SendEmailResponse {
	id?: string;
	error?: {
		message: string;
		statusCode: number;
	};
}

/**
 * Function to send an email using Resend
 */
export async function sendEmail(args: SendEmailInput): Promise<SendEmailResponse> {
	const { from, to, subject, html } = args;

	// Get API key from environment variables
	const resendApiKey = process.env.RESEND_API_KEY;

	if (!resendApiKey) {
		return {
			error: {
				message: 'Missing Resend API key',
				statusCode: 500
			}
		};
	}

	try {
		const resend = new Resend(resendApiKey);

		const result = await resend.emails.send({
			from,
			to,
			subject,
			html
		});

		console.log(`Email sent successfully to ${to}, id: ${result.data?.id}`);

		return {
			id: result.data?.id
		};
	} catch (error) {
		console.error('Error sending email:', error);

		// Type guard for Error object
		if (error instanceof Error) {
			return {
				error: {
					message: error.message,
					statusCode: 500
				}
			};
		}

		return {
			error: {
				message: 'Unknown error sending email',
				statusCode: 500
			}
		};
	}
}
