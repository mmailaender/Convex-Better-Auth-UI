import { Client } from 'fauna';

// const customLogger = {
//     trace: console.trace,
//     debug: console.debug,
//     info: console.info,
//     error: console.error,
//     warn: console.warn,
//     fatal: console.error, 
//   };

/**
 * Creates a new FaunaDB client with the given secret key. Can be a fauna key or token.
 * 
 * @param {string} secret - The secret key for the FaunaDB client.
 * @returns {Client} A new FaunaDB client instance.
 */
export default (secret: string): Client => {
    return new Client({
        secret: secret,
        // logger: customLogger 
    });
};
