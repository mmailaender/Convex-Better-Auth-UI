import { Client } from 'fauna';
import { FAUNA_SIGNIN_KEY } from '$env/static/private';

/**
 * serverClient - consumes a server generated access token
 */
export default new Client({
	secret: FAUNA_SIGNIN_KEY
});
