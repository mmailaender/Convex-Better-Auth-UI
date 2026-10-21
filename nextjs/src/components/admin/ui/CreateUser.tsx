'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { Loader2, Plus, X } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import { AUTH_CONSTANTS } from '@/convex/auth.constants';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Password from '@/components/primitives/ui/password';
import OrganizationSelect from '@/components/admin/ui/OrganizationSelect';
import type { AdminOrganization, OrganizationRole } from '@/components/admin/types';

/**
 * Admin "create user" dialog. Creates a user with an email/password, optionally as a member of
 * an existing organization. New users are never admins: promote them from the actions menu.
 */
export default function CreateUser() {
	const createUser = useMutation(api.admin.mutations.createUser);
	const [open, setOpen] = useState(false);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [organization, setOrganization] = useState<AdminOrganization | null>(null);
	const [organizationRole, setOrganizationRole] = useState<OrganizationRole>('member');
	const [submitting, setSubmitting] = useState(false);

	function handleOpenChange(nextOpen: boolean) {
		setOpen(nextOpen);
		// Reset on open rather than close, so the fields don't empty while the dialog fades out
		if (nextOpen) {
			setName('');
			setEmail('');
			setPassword('');
			setOrganization(null);
			setOrganizationRole('member');
		}
	}

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setSubmitting(true);
		try {
			await createUser({
				name: name.trim(),
				email: email.trim(),
				password,
				organizationId: organization?._id,
				organizationRole: organization ? organizationRole : undefined
			});
			toast.success(`Created ${name.trim()}`);
			handleOpenChange(false);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to create user');
		} finally {
			setSubmitting(false);
		}
	}

	return (
		<Dialog.Root open={open} onOpenChange={handleOpenChange}>
			<Dialog.Trigger
				className="btn preset-filled-primary-500 shrink-0 gap-2"
				aria-label="New user"
			>
				<Plus className="size-4" aria-hidden="true" />
				<span className="hidden sm:inline">New user</span>
			</Dialog.Trigger>
			<Dialog.Content className="md:max-w-108">
				<Dialog.Header className="pr-8">
					<Dialog.Title>Create user</Dialog.Title>
					<Dialog.Description className="text-surface-700-300">
						The user can sign in with this email and password right away.
					</Dialog.Description>
				</Dialog.Header>
				<form id="admin-create-user" className="flex w-full flex-col gap-3" onSubmit={handleSubmit}>
					<label className="label">
						<span className="label-text">Name</span>
						<input
							type="text"
							className="input"
							value={name}
							onChange={(e) => setName(e.target.value)}
							autoComplete="off"
							required
						/>
					</label>
					<label className="label">
						<span className="label-text">Email</span>
						<input
							type="email"
							className="input"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							autoComplete="off"
							required
						/>
					</label>
					<label className="label">
						<span className="label-text">Password</span>
						<Password.Root minScore={0}>
							<Password.Input
								value={password}
								onChange={(e) => setPassword(e.currentTarget.value)}
								autoComplete="new-password"
								minLength={8}
								required
							>
								<Password.ToggleVisibility />
							</Password.Input>
						</Password.Root>
					</label>
					{AUTH_CONSTANTS.organizations ? (
						<div className="border-surface-300-700 mt-2 flex flex-col gap-3 border-t pt-4">
							<div className="label">
								<div className="flex items-center justify-between">
									<label className="label-text" htmlFor="admin-create-user-organization">
										Add to organization
									</label>
									{organization ? (
										<button
											type="button"
											className="btn btn-sm hover:preset-tonal gap-1 px-2 text-xs"
											onClick={() => setOrganization(null)}
										>
											<X className="size-3" aria-hidden="true" />
											Clear
										</button>
									) : (
										<span className="badge preset-tonal text-xs">Optional</span>
									)}
								</div>
								<OrganizationSelect
									id="admin-create-user-organization"
									value={organization}
									onChange={setOrganization}
								/>
							</div>
							{organization ? (
								<label className="label">
									<span className="label-text">Role in {organization.name}</span>
									<select
										className="select"
										value={organizationRole}
										onChange={(e) => setOrganizationRole(e.target.value as OrganizationRole)}
									>
										<option value="member">Member</option>
										<option value="admin">Admin</option>
									</select>
								</label>
							) : null}
						</div>
					) : null}
				</form>
				<Dialog.Footer>
					<Dialog.Close className="btn preset-tonal" disabled={submitting}>
						Cancel
					</Dialog.Close>
					<button
						type="submit"
						form="admin-create-user"
						className="btn preset-filled-primary-500"
						disabled={submitting}
						aria-busy={submitting}
					>
						{submitting ? (
							<>
								<Loader2 className="size-4 animate-spin" aria-hidden="true" />
								Creating...
							</>
						) : (
							'Create user'
						)}
					</button>
				</Dialog.Footer>
				<Dialog.CloseX />
			</Dialog.Content>
		</Dialog.Root>
	);
}
