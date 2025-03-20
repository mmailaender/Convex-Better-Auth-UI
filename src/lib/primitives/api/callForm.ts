import { goto } from '$app/navigation';

// Sentinel values used to represent special JavaScript values in form data
const SENTINEL = {
	NULL: '__NULL__',
	UNDEFINED: '__UNDEFINED__'
};

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
 * Preserves null and undefined values by using special sentinel values.
 *
 * @template T - The expected response type when the request succeeds.
 * @param {Object} options - The function parameters.
 * @param {string} options.url - The URL of the form action to call.
 * @param {Record<string, unknown> | URLSearchParams | FormData} options.data - The form data object.
 * @param {typeof fetch} [options.fetch] - The fetch function to use.
 * @returns {Promise<T>} - Resolves with the server response when successful.
 * @throws {Error} - Rejects with an error if the request fails.
 */
export async function callForm<T>({
	url,
	data = {},
	fetch: customFetch = globalThis.fetch
}: {
	url: string;
	data?: Record<string, unknown> | URLSearchParams | FormData;
	fetch?: typeof fetch;
}): Promise<T> {
	const headers: Record<string, string> = {};
	let body: string | FormData;

	// Handle different data types
	if (data instanceof FormData) {
		// If it's FormData, just pass it through
		body = data;
		// Don't set Content-Type for FormData - browser will set it with boundary
	} else if (data instanceof URLSearchParams) {
		body = data.toString();
		headers['Content-Type'] = 'application/x-www-form-urlencoded';
	} else {
		// Handle Record<string, unknown>
		const params = new URLSearchParams();
		for (const key in data) {
			if (Object.prototype.hasOwnProperty.call(data, key)) {
				const value = data[key];

				if (value === null) {
					params.append(key, '__NULL__');
				} else if (value === undefined) {
					params.append(key, '__UNDEFINED__');
				} else {
					params.append(key, String(value));
				}
			}
		}
		body = params.toString();
		headers['Content-Type'] = 'application/x-www-form-urlencoded';
	}

	const response = await customFetch(url, {
		method: 'POST',
		headers,
		body
	});

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

/**
 * Server-side helper to parse form values back to their original types.
 * Converts sentinel values back to null or undefined.
 *
 * @param formValue - The raw value from formData.get()
 * @param options - Optional configuration
 * @returns The parsed value with proper JavaScript types restored
 */
export function parseFormValue<T = unknown>(
	formValue: FormDataEntryValue | null,
	options: {
		emptyStringAs?: null | undefined | '';
		numberConversion?: boolean;
	} = {}
): T | null | undefined | string | number {
	// Handle null FormDataEntryValue (means the key doesn't exist)
	if (formValue === null) {
		return undefined;
	}

	// Handle File objects
	if (formValue instanceof File) {
		return formValue as unknown as T;
	}

	// For string values, check sentinel values
	if (typeof formValue === 'string') {
		// Check sentinel values
		if (formValue === SENTINEL.NULL) {
			return null;
		}

		if (formValue === SENTINEL.UNDEFINED) {
			return undefined;
		}

		// Handle empty strings according to options
		if (formValue === '') {
			return options.emptyStringAs !== undefined ? options.emptyStringAs : formValue;
		}

		// Convert to number if the option is enabled and the string is numeric
		if (options.numberConversion && !isNaN(Number(formValue)) && formValue.trim() !== '') {
			return Number(formValue);
		}

		// Return the string value
		return formValue as unknown as T;
	}

	// Should never reach here with FormDataEntryValue, but for safety:
	return formValue as unknown as T;
}
