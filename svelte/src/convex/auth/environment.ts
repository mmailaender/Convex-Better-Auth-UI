// Utility to get JWT secret from environment variables
export const getJwtSecret = async (): Promise<Uint8Array> => {
	const secretKey = process.env.JWT_SECRET;
	return new TextEncoder().encode(secretKey);
};
