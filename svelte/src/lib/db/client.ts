import { Client, fql } from 'fauna';

// const customLogger = {
//     trace: console.trace,
//     debug: console.debug,
//     info: console.info,
//     error: console.error,
//     warn: console.warn,
//     fatal: console.error,
//   };

/**
 * Extended Fauna client with additional convenience methods.
 */
class ExtendedClient extends Client {
	/**
	 * Generates a new unique ID using Fauna's newId() function.
	 *
	 * @returns {Promise<string>} A promise that resolves to the new ID.
	 */
	async newId(): Promise<string> {
		const response = await this.query<string>(fql`newId()`);
		return response.data;
	}
}

/**
 * Creates a new extended FaunaDB client with the given secret key.
 *
 * @param {string} secret - The secret key for the FaunaDB client.
 * @returns {ExtendedClient} A new extended FaunaDB client instance.
 */
export default (secret: string): ExtendedClient => {
	return new ExtendedClient({
		secret: secret
		// logger: customLogger
	});
};
