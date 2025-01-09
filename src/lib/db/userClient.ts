import { Client } from 'fauna';

/**
 * userClient - consumes the users access or refresh token to make requests
 * TODO: Get the access token from cookie. If not available check if a refresh token is available and get a new access token. If also no refresh token is available redirect to sign in
 */
export default (secret: string): Client => {
    return new Client({
        secret: secret // TODO: Add user accessToken
    });
};
