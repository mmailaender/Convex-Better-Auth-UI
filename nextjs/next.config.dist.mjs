const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

/** @type {import('next').NextConfig} */
const nextConfig = {
	images: convexUrl
		? {
				remotePatterns: [
					{
						protocol: 'https',
						hostname: convexUrl.replace('https://', '')
					}
				]
			}
		: {}
};

export default nextConfig;
