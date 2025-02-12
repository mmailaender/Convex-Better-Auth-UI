import { goto } from "$app/navigation";

/**
 * Recursively deep parses any JSON string values found in objects or arrays.
 * @param value - The input which can be a JSON string, object, or array.
 * @returns The value with all nested JSON strings parsed.
 */
function deepParse<T>(value: unknown): T {
	if (typeof value === 'string') {
		try {
			// Attempt to parse the string.
			const parsed = JSON.parse(value);
			// Recursively parse the result in case it's an array or object with nested JSON strings.
			return deepParse(parsed);
		} catch {
			// Not a JSON string, so return it as-is.
			return value as T;
		}
	} else if (Array.isArray(value)) {
		// If it's an array, map over the elements and deep-parse each one.
		return value.map((item) => deepParse(item)) as unknown as T;
	} else if (value !== null && typeof value === 'object') {
		// If it's an object, iterate over its keys and deep-parse each property.
		const newObj: Record<string, unknown> = {};
		for (const key in value) {
			if (Object.prototype.hasOwnProperty.call(value, key)) {
				newObj[key] = deepParse((value as Record<string, unknown>)[key]);
			}
		}
		return newObj as T;
	}
	// For any other type (number, boolean, etc.), return it as-is.
	return value as T;
}

/**
 * Calls a SvelteKit form action via `fetch`, submitting form data in `application/x-www-form-urlencoded` format.
 * Automatically converts `null` or `undefined` values to empty strings (`""`) for compatibility.
 *
 * @template T - The expected response type when the request succeeds.
 * @param {Object} options - The function parameters.
 * @param {string} options.url - The URL of the form action to call.
 * @param {Record<string, unknown> | URLSearchParams} options.data - The form data object. Values will be converted to strings.
 * @returns {Promise<T>} - Resolves with the server response when successful.
 * @throws {FormRequestError} - Rejects with a structured error if the request fails.
 */
export async function callForm<T>({
	url,
	data
}: {
	url: string;
	data: Record<string, unknown> | URLSearchParams;
}): Promise<T> {
	const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };

	let body: string;
	if (data instanceof URLSearchParams) {
		body = data.toString();
	} else {
		const params = new URLSearchParams();
		for (const key in data) {
			if (Object.prototype.hasOwnProperty.call(data, key)) {
				const value = data[key];
				params.append(key, value !== null && value !== undefined ? String(value) : '');
			}
		}
		body = params.toString();
	}

	const response = await fetch(url, { method: 'POST', headers, body });
	const responseBody = await response.json();

	if (!response.ok) {
		throw Error(responseBody.error?.message || 'Unknown error');
	}

	if (responseBody.type === 'redirect') {
		await goto(responseBody.location);
		return responseBody; 
	}

	console.log('responseBody: ', responseBody);

	// Deep parse the responseBody.data.
	const normalizedData = deepParse<T>(responseBody.data);

	// If the result is an array, assume the first element holds the data you want.
	const finalData = Array.isArray(normalizedData) ? normalizedData[0] : normalizedData;

	return finalData;
}
