'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
	SiApple,
	SiAtlassian,
	SiDiscord,
	SiDropbox,
	SiFacebook,
	SiFigma,
	SiGithub,
	SiGitlab,
	SiGoogle,
	SiHuggingface,
	SiKakao,
	SiKick,
	SiLine,
	SiLinear,
	SiNaver,
	SiNotion,
	SiPaypal,
	SiReddit,
	SiRoblox,
	SiSpotify,
	SiTiktok,
	SiTwitch,
	SiVk,
	SiX,
	SiZoom
} from '@icons-pack/react-simple-icons';
import { SiSalesforce, SiSlack } from '@/components/primitives/ui/brand-icons';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { KeyRound, Lock, Trash2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

import * as Dialog from '@/components/primitives/ui/dialog';
import * as Drawer from '@/components/primitives/ui/drawer';
import * as Password from '@/components/primitives/ui/password';
import * as Select from '@/components/primitives/ui/select';
import { useMobileState } from '@/components/primitives/utils/mobileState';
import { scheduleScrollIntoView } from '@/components/primitives/utils/focusScroll';
import { api } from '@/convex/_generated/api';
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
import { authClient } from '@/lib/auth/api/auth-client';
import { useAccountListData } from '@/lib/auth/hooks';

function getProviderLabel(provider: string) {
	switch (provider) {
		case 'credential':
			return 'Password';
		case 'huggingface':
			return 'Hugging Face';
		case 'x':
			return 'X';
		case 'github':
			return 'GitHub';
		case 'gitlab':
			return 'GitLab';
		case 'tiktok':
			return 'TikTok';
		case 'paypal':
			return 'PayPal';
		default:
			return provider.charAt(0).toUpperCase() + provider.slice(1);
	}
}

const providerIconMap = {
	credential: KeyRound,
	github: SiGithub,
	google: SiGoogle,
	facebook: SiFacebook,
	apple: SiApple,
	atlassian: SiAtlassian,
	discord: SiDiscord,
	figma: SiFigma,
	line: SiLine,
	huggingface: SiHuggingface,
	kakao: SiKakao,
	kick: SiKick,
	paypal: SiPaypal,
	salesforce: SiSalesforce,
	slack: SiSlack,
	notion: SiNotion,
	naver: SiNaver,
	tiktok: SiTiktok,
	twitch: SiTwitch,
	x: SiX,
	dropbox: SiDropbox,
	linear: SiLinear,
	gitlab: SiGitlab,
	reddit: SiReddit,
	roblox: SiRoblox,
	spotify: SiSpotify,
	vk: SiVk,
	zoom: SiZoom
};

function getProviderIcon(provider: string) {
	return providerIconMap[provider as keyof typeof providerIconMap] ?? Lock;
}

function mapLinkErrorMessage(code: string) {
	switch (code) {
		case 'account_already_linked_to_different_user':
			return 'This account is already linked to another user.';
		case 'account_already_linked':
			return 'This account is already linked.';
		case 'account_linking_disabled':
			return 'Linking accounts is disabled. Please contact support.';
		default:
			return 'Failed to link account. Please try again.';
	}
}

export default function Accounts() {
	const searchParams = useSearchParams();
	const mobileState = useMobileState();
	const clientSetPassword = useMutation(api.users.mutations.setPassword);
	const accountList = useAccountListData();

	const [isLinking, setIsLinking] = useState(false);
	const [unlinkingAccountId, setUnlinkingAccountId] = useState<string | null>(null);
	const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
	const [isPasswordDrawerOpen, setIsPasswordDrawerOpen] = useState(false);
	const [password, setPasswordValue] = useState('');
	const [isSettingPassword, setIsSettingPassword] = useState(false);
	const [isEditingPasswordInline, setIsEditingPasswordInline] = useState(false);
	const [currentPassword, setCurrentPassword] = useState('');
	const [newPassword, setNewPassword] = useState('');
	const [isChangingPassword, setIsChangingPassword] = useState(false);
	const [handledCallbackKey, setHandledCallbackKey] = useState<string | null>(null);
	const currentPasswordInputRef = useRef<HTMLInputElement | null>(null);

	const allProviders = useMemo(
		() =>
			Object.keys(AUTH_CONSTANTS.providers).filter(
				(provider) =>
					provider !== 'emailOTP' &&
					provider !== 'magicLink' &&
					AUTH_CONSTANTS.providers[provider as keyof typeof AUTH_CONSTANTS.providers] === true
			),
		[]
	);

	const availableProviders = useMemo(() => {
		if (!accountList) return [];
		const linkedProviders = accountList.map((account) => account.providerId);
		return allProviders.filter((provider) => {
			if (provider === 'password') return !linkedProviders.includes('credential');
			return !linkedProviders.includes(provider);
		});
	}, [accountList, allProviders]);

	const providersCollection = useMemo(
		() =>
			Select.createListCollection({
				items: availableProviders.map((provider) => ({
					label: getProviderLabel(provider),
					value: provider
				}))
			}),
		[availableProviders]
	);

	useEffect(() => {
		if (mobileState.isMobile && isEditingPasswordInline && currentPasswordInputRef.current) {
			scheduleScrollIntoView(currentPasswordInputRef.current, { block: 'center' });
		}
	}, [mobileState.isMobile, isEditingPasswordInline]);

	useEffect(() => {
		const errorCode = searchParams.get('error');
		const success = searchParams.get('success');
		const key = errorCode ? `e:${errorCode}` : success ? `s:${success}` : null;
		if (!key || handledCallbackKey === key) return;

		setHandledCallbackKey(key);
		if (errorCode) toast.error(mapLinkErrorMessage(errorCode));
		if (success) toast.success(success);

		const url = new URL(window.location.href);
		url.searchParams.set('dialog', 'user-profile');
		url.searchParams.delete('success');
		url.searchParams.delete('error');
		window.history.replaceState(
			window.history.state,
			'',
			`${url.pathname}${url.search}${url.hash}`
		);
	}, [searchParams, handledCallbackKey]);

	async function linkAccount(provider: string) {
		if (isLinking) return;
		setIsLinking(true);

		if (provider === 'password') {
			setPasswordValue('');
			if (mobileState.isMobile) setIsPasswordDrawerOpen(true);
			else setIsPasswordDialogOpen(true);
			setIsLinking(false);
			return;
		}

		const baseUrl = new URL(window.location.href);
		baseUrl.searchParams.set('dialog', 'user-profile');
		const successUrl = new URL(baseUrl);
		successUrl.searchParams.set(
			'success',
			`${getProviderLabel(provider)} account linked successfully`
		);
		const errorUrl = new URL(baseUrl);
		errorUrl.searchParams.delete('success');

		const cleanUrl = new URL(window.location.href);
		cleanUrl.searchParams.delete('dialog');
		window.history.replaceState(
			window.history.state,
			'',
			`${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`
		);

		await authClient.linkSocial({
			provider: provider as never,
			callbackURL: successUrl.toString(),
			errorCallbackURL: errorUrl.toString()
		});
		setIsLinking(false);
	}

	async function setPassword(passwordToSet: string) {
		try {
			await clientSetPassword({ password: passwordToSet });
			toast.success('Password set successfully');
			return true;
		} catch (error) {
			if (error instanceof ConvexError) toast.error(error.data);
			else if (error instanceof Error) toast.error(error.message);
			else toast.error('Failed to set password');
			return false;
		}
	}

	async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		form.dataset.submitted = 'true';
		if (!form.checkValidity()) return;

		setIsSettingPassword(true);
		try {
			if (await setPassword(password)) {
				setIsPasswordDialogOpen(false);
				setIsPasswordDrawerOpen(false);
				setPasswordValue('');
			}
		} finally {
			setIsSettingPassword(false);
		}
	}

	async function unlinkAccount(accountId: string, provider: string) {
		if (!accountList || accountList.length <= 1) {
			toast.error('You must have at least one account linked');
			return;
		}
		if (unlinkingAccountId) return;
		setUnlinkingAccountId(accountId);

		const { error } = await authClient.unlinkAccount({ providerId: provider, accountId });
		if (error) toast.error(error.message || error.statusText);
		else toast.success(`${getProviderLabel(provider)} account unlinked successfully`);
		setUnlinkingAccountId(null);
	}

	async function handleChangePasswordSubmit(event: FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const form = event.currentTarget;
		form.dataset.submitted = 'true';
		if (!form.checkValidity()) return;
		if (!currentPassword.trim() || !newPassword.trim()) {
			toast.error('Please fill in both fields');
			return;
		}

		setIsChangingPassword(true);
		try {
			const { error } = await authClient.changePassword({
				newPassword,
				currentPassword
			});
			if (error) {
				toast.error(error.message || error.statusText || 'Failed to change password');
				return;
			}
			toast.success('Password changed successfully');
			setIsEditingPasswordInline(false);
			setCurrentPassword('');
			setNewPassword('');
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to change password');
		} finally {
			setIsChangingPassword(false);
		}
	}

	const passwordForm = (
		<form onSubmit={handlePasswordSubmit} className="w-full">
			<div className="flex flex-col">
				<label className="flex flex-col gap-2">
					<span className="text-sm font-medium">Password</span>
					<Password.Root>
						<Password.Input
							value={password}
							onChange={(event) => setPasswordValue(event.currentTarget.value)}
							placeholder="Enter your password"
							required
						>
							<Password.ToggleVisibility />
						</Password.Input>
						<Password.Error />
						<Password.Strength />
					</Password.Root>
				</label>
				<Dialog.Footer>
					<Dialog.Close className="btn preset-tonal w-full md:w-fit">Cancel</Dialog.Close>
					<button
						type="submit"
						className="btn preset-filled-primary-500 w-full md:w-fit"
						disabled={isSettingPassword}
					>
						{isSettingPassword ? 'Setting...' : 'Set Password'}
					</button>
				</Dialog.Footer>
			</div>
		</form>
	);

	return (
		<div className="flex w-full flex-col gap-3 pb-6">
			<div>
				<span className="text-surface-600-400 text-xs">Linked Accounts</span>
				{accountList && accountList.length > 0 ? (
					<div className="flex flex-col gap-3 pt-3">
						{accountList.map((account) => {
							const ProviderIcon = getProviderIcon(account.providerId);
							return (
								<div
									key={account.id}
									className="border-surface-300-700 rounded-container flex w-full flex-col border p-3"
								>
									<div className="flex w-full flex-row items-center justify-between">
										<div className="flex items-center gap-3 pl-1">
											<ProviderIcon size={16} />
											<div className="text-sm font-medium">
												{getProviderLabel(account.providerId)}
											</div>
										</div>
										<div className="flex items-center">
											{account.providerId === 'credential' ? (
												<button
													className="btn btn-sm preset-tonal mr-2"
													onClick={() => {
														setIsEditingPasswordInline(true);
														setCurrentPassword('');
														setNewPassword('');
														requestAnimationFrame(() => currentPasswordInputRef.current?.focus());
													}}
												>
													Update
												</button>
											) : null}
											{accountList.length > 1 ? (
												<button
													className="btn-icon preset-faded-surface-50-950 hover:bg-error-300-700 hover:text-error-950-50"
													disabled={unlinkingAccountId === account.id}
													onClick={() => void unlinkAccount(account.accountId, account.providerId)}
												>
													{unlinkingAccountId === account.id ? (
														'Unlinking...'
													) : (
														<Trash2 className="size-4" />
													)}
												</button>
											) : null}
										</div>
									</div>
									{account.providerId === 'credential' ? (
										<div
											className={[
												'grid transition-[grid-template-rows] duration-200 ease-in-out',
												isEditingPasswordInline ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
											].join(' ')}
											aria-hidden={!isEditingPasswordInline}
											inert={!isEditingPasswordInline}
										>
											<div className="overflow-hidden">
												<form
													onSubmit={handleChangePasswordSubmit}
													className="flex w-full flex-col gap-3 pt-4"
												>
													<input
														ref={currentPasswordInputRef}
														type="password"
														className="input w-full"
														value={currentPassword}
														onChange={(event) => setCurrentPassword(event.currentTarget.value)}
														placeholder="Enter your current password"
														autoComplete="current-password"
														required
														disabled={isChangingPassword}
													/>
													<Password.Root>
														<Password.Input
															value={newPassword}
															onChange={(event) => setNewPassword(event.currentTarget.value)}
															placeholder="Enter your new password"
															autoComplete="new-password"
															required
															disabled={isChangingPassword}
														>
															<Password.ToggleVisibility />
														</Password.Input>
														<Password.Error />
														<Password.Strength />
													</Password.Root>
													<div className="flex gap-1.5">
														<button
															type="button"
															className="btn btn-sm preset-tonal w-full"
															onClick={() => {
																setCurrentPassword('');
																setNewPassword('');
																setIsEditingPasswordInline(false);
															}}
															disabled={isChangingPassword}
														>
															Cancel
														</button>
														<button
															type="submit"
															className="btn btn-sm preset-filled-primary-500 w-full"
															disabled={isChangingPassword || !currentPassword || !newPassword}
														>
															{isChangingPassword ? 'Changing...' : 'Change Password'}
														</button>
													</div>
												</form>
											</div>
										</div>
									) : null}
								</div>
							);
						})}
					</div>
				) : (
					<div className="text-surface-600-400 mt-2 text-sm">No accounts found</div>
				)}
			</div>

			{availableProviders.length > 0 ? (
				<div>
					<Select.Root
						collection={providersCollection}
						onSelect={(details) => void linkAccount(details.value)}
					>
						<Select.Trigger className="w-full" placeholder="Link new account" />
						<Select.Content>
							{providersCollection.items.map((item) => {
								const ProviderIcon = getProviderIcon(item.value);
								return (
									<Select.Item key={item.value} item={item}>
										<ProviderIcon size={16} />
										<Select.ItemText>{item.label}</Select.ItemText>
									</Select.Item>
								);
							})}
						</Select.Content>
					</Select.Root>
					{isLinking ? (
						<p className="text-surface-600-400 mt-2 text-sm">Linking account...</p>
					) : null}
				</div>
			) : null}

			<Dialog.Root open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
				<Dialog.Content className="w-full max-w-md">
					<Dialog.Header>
						<Dialog.Title>Set Password</Dialog.Title>
					</Dialog.Header>
					{passwordForm}
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>

			<Drawer.Root open={isPasswordDrawerOpen} onOpenChange={setIsPasswordDrawerOpen}>
				<Drawer.Content>
					<Drawer.Header>
						<Drawer.Title>Set Password</Drawer.Title>
					</Drawer.Header>
					{passwordForm}
					<Drawer.CloseX />
				</Drawer.Content>
			</Drawer.Root>
		</div>
	);
}
