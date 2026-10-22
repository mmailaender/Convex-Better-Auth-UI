import DeviceAuthorization from '@/components/auth/ui/DeviceAuthorization';

// Better Auth's device authorization plugin sends the user to `/device?user_code=…`
export default async function DeviceAuthorizationPage({
	searchParams
}: {
	searchParams: Promise<{ user_code?: string | string[] }>;
}) {
	const { user_code } = await searchParams;
	const code = Array.isArray(user_code) ? user_code[0] : user_code;
	return <DeviceAuthorization code={code ?? ''} />;
}
