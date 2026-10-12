'use client';

import { useMemo, useState } from 'react';
import { useConvexAuth, useQuery } from 'convex/react';
import { Check, Copy, EllipsisVertical } from 'lucide-react';
import { toast } from 'sonner';

import * as Dialog from '@/components/primitives/ui/dialog';
import * as Menu from '@/components/primitives/ui/menu';
import * as Select from '@/components/primitives/ui/select';
import * as Toggle from '@/components/primitives/ui/toggle';
import { api } from '@/convex/_generated/api';
import { authClient } from '@/lib/auth/api/auth-client';

type ExpirationOption = '7' | '30' | '60' | '90' | 'custom' | 'never';

function getExpirationDate(days: number) {
	const date = new Date();
	date.setDate(date.getDate() + days);
	return date;
}

function formatDate(date: Date) {
	return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function toInputDate(date: Date) {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export default function ApiKeys() {
	const { isAuthenticated } = useConvexAuth();
	const apiKeysData = useQuery(api.users.queries.listApiKeys, isAuthenticated ? {} : 'skip');
	const apiKeys = apiKeysData?.apiKeys ?? [];

	const [dialogOpen, setDialogOpen] = useState(false);
	const [name, setName] = useState('');
	const [expirationOption, setExpirationOption] = useState<ExpirationOption>('30');
	const [customDate, setCustomDate] = useState('');
	const [mode, setMode] = useState<'create' | 'update'>('create');
	const [editKeyId, setEditKeyId] = useState<string | null>(null);
	const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
	const [toDeleteId, setToDeleteId] = useState<string | null>(null);
	const [toDeleteName, setToDeleteName] = useState('');
	const [showSecretOpen, setShowSecretOpen] = useState(false);
	const [newKey, setNewKey] = useState('');
	const [copied, setCopied] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const expirationCollection = useMemo(
		() =>
			Select.createListCollection({
				items: [
					{ value: '7', label: `7 days (${formatDate(getExpirationDate(7))})` },
					{ value: '30', label: `30 days (${formatDate(getExpirationDate(30))})` },
					{ value: '60', label: `60 days (${formatDate(getExpirationDate(60))})` },
					{ value: '90', label: `90 days (${formatDate(getExpirationDate(90))})` },
					{ value: 'custom', label: 'Custom' },
					{ value: 'never', label: 'No expiration' }
				]
			}),
		[]
	);

	function openCreate() {
		setMode('create');
		setEditKeyId(null);
		setName('');
		setExpirationOption('30');
		setCustomDate('');
		setDialogOpen(true);
	}

	function openUpdate(apiKey: {
		id: string;
		name?: string | null;
		expiresAt?: string | number | Date | null;
	}) {
		setMode('update');
		setEditKeyId(apiKey.id);
		setName(apiKey.name ?? '');
		if (!apiKey.expiresAt) {
			setExpirationOption('never');
			setCustomDate('');
		} else {
			const exp = new Date(apiKey.expiresAt);
			const days = Math.round((exp.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
			if (days === 7 || days === 30 || days === 60 || days === 90) {
				setExpirationOption(String(days) as ExpirationOption);
				setCustomDate('');
			} else {
				setExpirationOption('custom');
				setCustomDate(toInputDate(exp));
			}
		}
		setDialogOpen(true);
	}

	function openConfirmDelete(apiKey: { id: string; name?: string | null }) {
		setToDeleteId(apiKey.id);
		setToDeleteName(apiKey.name ?? '');
		setConfirmDeleteOpen(true);
	}

	async function handleSubmit() {
		if (!name.trim()) {
			toast.error('Please enter a name for the API key');
			return;
		}

		let expiresIn: number | undefined;
		if (expirationOption === 'never') {
			expiresIn = undefined;
		} else if (expirationOption === 'custom') {
			if (!customDate) {
				toast.error('Please select a custom date');
				return;
			}
			expiresIn = Math.floor((new Date(customDate).getTime() - Date.now()) / 1000);
		} else {
			expiresIn = parseInt(expirationOption) * 24 * 60 * 60;
		}

		setIsSubmitting(true);
		try {
			if (mode === 'create') {
				const res = await authClient.apiKey.create({ name, expiresIn });
				if (res.error)
					toast.error(`${res.error.status} ${res.error.statusText} ${res.error.message}`);
				else {
					toast.success('API Key created successfully');
					setNewKey(res.data?.key ?? '');
					setShowSecretOpen((res.data?.key ?? '').length > 0);
				}
			} else if (editKeyId) {
				const res = await authClient.apiKey.update({ keyId: editKeyId, name, expiresIn });
				if (res.error)
					toast.error(`${res.error.status} ${res.error.statusText} ${res.error.message}`);
				else toast.success('API Key updated successfully');
			}
		} finally {
			setIsSubmitting(false);
		}

		setName('');
		setExpirationOption('30');
		setCustomDate('');
		setDialogOpen(false);
		setMode('create');
		setEditKeyId(null);
	}

	async function handleConfirmDelete() {
		if (!toDeleteId) return;
		setIsDeleting(true);
		try {
			const res = await authClient.apiKey.delete({ keyId: toDeleteId });
			if (res.error)
				toast.error(`${res.error.status} ${res.error.statusText} ${res.error.message}`);
			else toast.success('API Key deleted successfully');
		} finally {
			setIsDeleting(false);
			setToDeleteId(null);
			setToDeleteName('');
			setConfirmDeleteOpen(false);
		}
	}

	async function handleCopyClick() {
		if (!newKey) return;
		await navigator.clipboard.writeText(newKey);
		setCopied(true);
		window.setTimeout(() => setCopied(false), 1200);
	}

	return (
		<div className="flex w-full flex-col gap-3 pb-6">
			<span className="text-surface-600-400 text-xs">API Keys</span>
			{apiKeysData ? (
				<>
					{apiKeys.length > 0 ? (
						<div className="table-wrap">
							<table className="table caption-bottom">
								<thead>
									<tr>
										<th>Name</th>
										<th>Created At</th>
										<th>Expires At</th>
										<th />
									</tr>
								</thead>
								<tbody>
									{apiKeys.map((apiKey) => (
										<tr key={apiKey.id}>
											<td>{apiKey.name}</td>
											<td>{new Date(apiKey.createdAt).toLocaleDateString()}</td>
											<td>
												{apiKey.expiresAt
													? new Date(apiKey.expiresAt).toLocaleDateString()
													: 'Never'}
											</td>
											<td className="text-right">
												<Menu.Root>
													<Menu.Trigger className="btn-icon hover:preset-tonal">
														<EllipsisVertical className="size-4" />
													</Menu.Trigger>
													<Menu.Content className="bg-surface-50-950">
														<Menu.Item value="update" onClick={() => openUpdate(apiKey)}>
															Update
														</Menu.Item>
														<Menu.Item
															value="delete"
															variant="destructive"
															onClick={() => openConfirmDelete(apiKey)}
														>
															Delete
														</Menu.Item>
													</Menu.Content>
												</Menu.Root>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					) : null}

					<Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
						<div>
							<Dialog.Trigger
								className="btn btn-sm preset-filled-surface-200-800"
								onClick={openCreate}
							>
								Create API Key
							</Dialog.Trigger>
						</div>
						<Dialog.Content className="sm:w-md">
							<Dialog.Header>
								<Dialog.Title>
									{mode === 'create' ? 'Create API Key' : 'Update API Key'}
								</Dialog.Title>
							</Dialog.Header>
							<div className="mt-4 flex flex-col gap-4">
								<div className="flex flex-col gap-1.5">
									<label htmlFor="api-key-name" className="text-sm font-medium">
										Name
									</label>
									<input
										id="api-key-name"
										type="text"
										value={name}
										onChange={(event) => setName(event.currentTarget.value)}
										placeholder="Enter API key name"
										className="input"
										disabled={isSubmitting}
									/>
								</div>
								<div className="flex flex-col gap-1.5">
									<label htmlFor="expiration" className="text-sm font-medium">
										Expiration
									</label>
									<Select.Root
										collection={expirationCollection}
										value={[expirationOption]}
										onValueChange={(details) =>
											setExpirationOption(details.value[0] as ExpirationOption)
										}
										className="w-56"
									>
										<Select.Trigger
											placeholder="Select expiration"
											className="w-full"
											disabled={isSubmitting}
										/>
										<Select.Content>
											{expirationCollection.items.map((option) => (
												<Select.Item key={option.value} item={option}>
													<Select.ItemText>{option.label}</Select.ItemText>
												</Select.Item>
											))}
										</Select.Content>
									</Select.Root>
								</div>
								{expirationOption === 'custom' ? (
									<div className="flex flex-col gap-1.5">
										<label htmlFor="custom-date" className="text-sm font-medium">
											Select date *
										</label>
										<input
											id="custom-date"
											type="date"
											value={customDate}
											onChange={(event) => setCustomDate(event.currentTarget.value)}
											className="input"
											disabled={isSubmitting}
										/>
									</div>
								) : null}
							</div>
							<div className="mt-6 flex w-full items-center justify-end gap-2">
								<Dialog.Close className="btn preset-filled-surface-200-800">Cancel</Dialog.Close>
								<button
									onClick={handleSubmit}
									className="btn preset-filled-primary-500"
									disabled={isSubmitting}
								>
									{isSubmitting
										? mode === 'create'
											? 'Creating...'
											: 'Saving...'
										: mode === 'create'
											? 'Create'
											: 'Save'}
								</button>
							</div>
							<Dialog.CloseX />
						</Dialog.Content>
					</Dialog.Root>

					<Dialog.Root open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
						<Dialog.Content className="sm:w-sm">
							<Dialog.Header>
								<Dialog.Title>Delete API Key</Dialog.Title>
							</Dialog.Header>
							<p className="text-sm">
								Are you sure you want to delete &apos;{toDeleteName}&apos;? This action cannot be
								undone.
							</p>
							<div className="mt-4 flex w-full items-center justify-end gap-2">
								<Dialog.Close className="btn btn-sm preset-filled-surface-200-800">
									Cancel
								</Dialog.Close>
								<button
									className="btn btn-sm preset-filled-error-500"
									onClick={handleConfirmDelete}
									disabled={isDeleting}
								>
									{isDeleting ? 'Deleting...' : 'Delete'}
								</button>
							</div>
							<Dialog.CloseX />
						</Dialog.Content>
					</Dialog.Root>

					<Dialog.Root open={showSecretOpen} onOpenChange={setShowSecretOpen}>
						<Dialog.Content className="sm:w-md">
							<Dialog.Header>
								<Dialog.Title>Your new API key</Dialog.Title>
							</Dialog.Header>
							<p className="text-sm">
								Copy and store this key now. You won&apos;t be able to see it again.
							</p>
							<div className="field-group mt-4 grid-cols-[1fr_auto]">
								<input className="input" readOnly value={newKey} />
								<Toggle.Root
									pressed={copied}
									onClick={() => void handleCopyClick()}
									className="btn preset-filled-surface-200-800"
									aria-label="Copy API key"
								>
									{copied ? <Check className="size-4" /> : <Copy className="size-4" />}
								</Toggle.Root>
							</div>
							<div className="mt-4 flex w-full items-center justify-end gap-2">
								<Dialog.Close className="btn btn-sm preset-filled-surface-200-800">
									Close
								</Dialog.Close>
							</div>
							<Dialog.CloseX />
						</Dialog.Content>
					</Dialog.Root>
				</>
			) : null}
		</div>
	);
}
