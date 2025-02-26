import { goto } from '$app/navigation';

/**
 * Recursively deep parses any JSON string values found in objects or arrays.
 * Only parses strings that appear to be JSON objects or arrays.
 * @param value - The input which can be a JSON string, object, or array.
 * @returns The value with all nested JSON strings parsed.
 */
function deepParse<T>(value: unknown): T {
	if (typeof value === 'string') {
		// Trim the string so we can check the first character accurately.
		const trimmed = value.trim();
		// Only attempt to parse if it looks like an object or array.
		if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
			try {
				const parsed = JSON.parse(trimmed);
				// Recursively process the parsed value.
				return deepParse(parsed);
			} catch {
				// If parsing fails, return the original string.
				return value as T;
			}
		}
		// If it doesn't start with { or [, return the string as-is.
		return value as T;
	} else if (Array.isArray(value)) {
		// Process each element of the array.
		return value.map((item) => deepParse(item)) as unknown as T;
	} else if (value !== null && typeof value === 'object') {
		// Process each key in the object.
		const newObj: Record<string, unknown> = {};
		for (const key in value) {
			if (Object.prototype.hasOwnProperty.call(value, key)) {
				newObj[key] = deepParse((value as Record<string, unknown>)[key]);
			}
		}
		return newObj as T;
	}
	// Return numbers, booleans, etc. as-is.
	return value as T;
}

/**
 * Calls a SvelteKit form action via `fetch`, submitting form data in `application/x-www-form-urlencoded` format.
 * Automatically converts `null` or `undefined` values to empty strings (`""`) for compatibility.
 *
 * @template T - The expected response type when the request succeeds.
 * @param {Object} options - The function parameters.
 * @param {string} options.url - The URL of the form action to call.
 * @param {Record<string, unknown> | URLSearchParams} [options.data] - The form data object. Values will be converted to strings.
 * @param {typeof fetch} [options.fetch] - The fetch function to use, e.g. the `fetch` function provided by SvelteKit.
 * @returns {Promise<T>} - Resolves with the server response when successful.
 * @throws {FormRequestError} - Rejects with a structured error if the request fails.
 */
export async function callForm<T>({
	url,
	data = {},
	fetch: customFetch = globalThis.fetch
}: {
	url: string;
	data?: Record<string, unknown> | URLSearchParams;
	fetch?: typeof fetch;
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

	const response = await customFetch(url, { method: 'POST', headers, body });
	const responseBody = await response.json();

	if (!response.ok) {
		throw Error(responseBody.error?.message || 'Unknown error');
	}

	if (responseBody.type === 'redirect') {
		await goto(responseBody.location);
		return responseBody;
	}

	// Deep parse the responseBody.data.
	const normalizedData = deepParse<T>(responseBody.data);

	// If the result is an array, assume the first element holds the data you want.
	const finalData = Array.isArray(normalizedData) ? normalizedData[0] : normalizedData;

	return finalData;
}
