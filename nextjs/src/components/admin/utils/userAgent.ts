const BROWSERS: [RegExp, string][] = [
	[/Edg\//, 'Edge'],
	[/OPR\/|Opera/, 'Opera'],
	[/Firefox\//, 'Firefox'],
	[/Chrome\/|CriOS\//, 'Chrome'],
	[/Safari\//, 'Safari']
];

const SYSTEMS: [RegExp, string][] = [
	[/Android/, 'Android'],
	[/iPhone|iPad|iPod/, 'iOS'],
	[/Windows/, 'Windows'],
	[/Mac OS X|Macintosh/, 'macOS'],
	[/CrOS/, 'ChromeOS'],
	[/Linux/, 'Linux']
];

/**
 * A short label for a session's user agent, like "Chrome on macOS". Falls back to the raw
 * user agent for clients it doesn't recognize, such as scripts.
 */
export function describeUserAgent(userAgent: string | null): string {
	if (!userAgent) return 'Unknown device';
	const browser = BROWSERS.find(([pattern]) => pattern.test(userAgent))?.[1];
	const system = SYSTEMS.find(([pattern]) => pattern.test(userAgent))?.[1];
	if (browser && system) return `${browser} on ${system}`;
	return browser ?? system ?? userAgent;
}
