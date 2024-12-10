import { Client } from 'fauna';
import { FAUNA_SIGNIN_KEY } from '$env/static/private';

/**
 * serverClient - consumes a server generated access token
 */
export const sClient = new Client({
	secret: FAUNA_SIGNIN_KEY
});

/**
 * userClient - consumes the users access or refresh token to make requests
 * TODO: Get the access token from cookie. If not available check if a refresh token is available and get a new access token. If also no refresh token is available redirect to sign in
 */
export const uClient = (secret: string): Client => {
	return new Client({
		secret: secret // TODO: Add user accessToken
	});
};
