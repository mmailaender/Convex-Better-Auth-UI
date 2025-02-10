/**
 * Takes a list of SvelteKit-like route patterns and returns a function that
 * checks if a given path matches any one of those patterns.
 *
 * SvelteKit-like syntax supported:
 * - Named path params in brackets (e.g. [id], [slug], [anything])
 * - Wildcard `*` which can match any number of path segments
 * - Route segments are separated by `/`
 *
 * @example
 * const isPublicRoute = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)']);
 * isPublicRoute('/sign-in');         // true
 * isPublicRoute('/sign-up/more');    // true
 * isPublicRoute('/orgs/blah');       // false
 *
 * @param patterns Array of SvelteKit-like route patterns
 * @returns (path: string) => boolean
 */
export function createRouteMatcher(patterns: string[]) {
    console.debug('Creating route matcher with patterns:', patterns);

    // Pre-compile each pattern into a RegExp
    const regexes = patterns.map((pattern) => {
        const regexString = convertPatternToRegexString(pattern);
        console.debug(`Converted pattern "${pattern}" to regex string: "${regexString}"`);
        const regex = new RegExp(`^${regexString}$`);
        console.debug(`Compiled regex for pattern "${pattern}":`, regex);
        return regex;
    });

    // Return a matcher function that tests if path matches ANY of the compiled regexes
    return function matchPath(path: string): boolean {
        console.debug(`Matching path: "${path}" against patterns.`);
        for (const regex of regexes) {
            const isMatch = regex.test(path);
            console.debug(`Testing path "${path}" against regex ${regex}: ${isMatch}`);
            if (isMatch) {
                console.debug(`Path "${path}" matches regex ${regex}.`);
                return true;
            }
        }
        console.debug(`Path "${path}" did not match any patterns.`);
        return false;
    };
}

/**
 * Convert a single SvelteKit-like route pattern into a regex-compatible string.
 *
 * Examples:
 * - /orgs/[slug]  -> /orgs/([^/]+)
 * - /app/[any]/orgs/[id] -> /app/([^/]+)/orgs/([^/]+)
 * - /personal-account/* -> /personal-account/.*
 * - /sign-in(.*)  -> /sign-in(.*) (we'll preserve the (.*) part as-is,
 *   but be mindful not to over-escape it)
 */
function convertPatternToRegexString(pattern: string): string {
    console.debug(`Converting pattern to regex string: "${pattern}"`);

    // 1) Escape special regex characters except for our own capturing tokens.
    //    We'll temporarily replace `*` so we can manage it differently below.
    const reservedRegexChars = /[.+?^${}()|[\]\\]/g; // typical characters that need escaping
    let safe = pattern.replace(reservedRegexChars, (match) => {
        if (match === '[' || match === ']' || match === '*') {
            // Do not escape square brackets or asterisk
            return match;
        }
        const escaped = '\\' + match;
        console.debug(`Escaping character "${match}" to "${escaped}"`);
        return escaped;
    });

    // 2) Replace bracketed segments [something] -> ([^/]+)
    //    If you want to be fancy with `[...something]` for multi-segment matches,
    //    you'd do that as well, but let's keep it simple for single segments.
    safe = safe.replace(/\[([^\]]+)\]/g, (_, paramName) => {
        if (paramName.startsWith('...')) {
            console.debug(`Found multi-segment parameter "[...${paramName.slice(3)}]", converting to "(.*)"`);
            return '(.*)';
        }
        console.debug(`Found single-segment parameter "[${paramName}]", converting to "([^/]+)"`);
        return '([^/]+)';
    });

    // 3) Replace raw `*` (outside square brackets) with a multi-segment match
    //    e.g. "/personal-account/*" -> "/personal-account/.*"
    safe = safe.replace(/\*/g, () => {
        console.debug(`Replacing wildcard "*" with ".*"`);
        return '.*';
    });

    console.debug(`Final regex string for pattern "${pattern}": "${safe}"`);
    return safe;
}
