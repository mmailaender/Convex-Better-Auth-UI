'use client';

import { useState, FormEvent } from 'react';

// API
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';

// Components
import { UserPlus } from 'lucide-react';

// Types
import { FunctionReturnType } from 'convex/server';
import { Doc } from '@/convex/_generated/dataModel';
type Role = Doc<'organizationMembers'>['role'];
type InvitationResponse =
	FunctionReturnType<typeof api.organizations.invitations.actions.inviteMembers> extends Array<
		infer T
	>
		? T
		: never;

/**
 * InviteMembers component that allows organization admins to invite new members
 */
export default function InviteMembers() {
	// State variables
	const [emailInput, setEmailInput] = useState<string>('');
	const [selectedRole, setSelectedRole] = useState<Role>('role_organization_member');
	const [isProcessing, setIsProcessing] = useState<boolean>(false);
	const [errorMessage, setErrorMessage] = useState<string>('');
	const [successMessage, setSuccessMessage] = useState<string>('');

	// Convex action for inviting members
	const inviteMembers = useAction(api.organizations.invitations.actions.inviteMembers);

	/**
	 * Handles the submission of the invitation form
	 */
	const handleInvite = async (event: FormEvent) => {
		event.preventDefault();

		if (isProcessing) return;
		setIsProcessing(true);
		setErrorMessage('');
		setSuccessMessage('');

		try {
			// Split and clean email addresses
			const emails = emailInput
				.replace(/[,;\s]+/g, ',') // Replace all delimiters (commas, semicolons, spaces) with a single comma
				.split(',')
				.map((email: string) => email.trim())
				.filter((email: string) => email.length > 0);

			if (emails.length === 0) {
				setErrorMessage('Please enter at least one email address');
				setIsProcessing(false);
				return;
			}

			// Send invitations for all emails at once
			const results = await inviteMembers({
				emails,
				role: selectedRole
			});

			// Process results
			const successful = results.filter((r: InvitationResponse) => r.success);
			const failed = results.filter((r: InvitationResponse) => !r.success);

			if (successful.length > 0) {
				setSuccessMessage(
					`Successfully sent ${successful.length} invitation(s) to: ${successful
						.map((r: InvitationResponse) => r.email)
						.join(', ')}`
				);
				setEmailInput('');
			}

			if (failed.length > 0) {
				setErrorMessage(
					`Failed to send invitation(s) to: ${failed.map((r: InvitationResponse) => r.email).join(', ')}`
				);
			}
		} catch (err) {
			console.error('An error occurred while processing invitations: ', err);
			setErrorMessage(
				err instanceof Error ? err.message : 'An error occurred while processing invitations'
			);
		} finally {
			setIsProcessing(false);
		}
	};

	return (
		<div className="border-surface-300-700 mb-8 rounded-lg border p-4">
			<h3 className="mb-4 flex items-center text-xl font-semibold">
				<UserPlus className="mr-2 size-5" />
				Invite new members
			</h3>

			<form onSubmit={handleInvite} className="flex flex-col gap-4">
				<div className="flex flex-col gap-4 md:flex-row">
					<textarea
						value={emailInput}
						onChange={(e) => setEmailInput(e.target.value)}
						placeholder="example@email.com, example2@email.com"
						className="textarea min-h-24 grow"
						required
					></textarea>

					<div className="flex flex-col gap-3">
						<select
							value={selectedRole}
							onChange={(e) => setSelectedRole(e.target.value as Role)}
							className="select w-full md:w-48"
						>
							<option value="role_organization_member">Member</option>
							<option value="role_organization_admin">Admin</option>
						</select>

						<button
							type="submit"
							className="btn variant-filled-primary w-full"
							disabled={isProcessing}
						>
							{isProcessing ? 'Sending...' : 'Send Invitations'}
						</button>
					</div>
				</div>
			</form>

			{successMessage && (
				<div className="bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200 mt-3 rounded-lg p-3">
					{successMessage}
				</div>
			)}

			{errorMessage && (
				<div className="bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-200 mt-3 rounded-lg p-3">
					{errorMessage}
				</div>
			)}

			<div className="text-surface-500-500 mt-3 text-xs">
				<p>
					You can invite multiple people by separating email addresses with commas, semicolons, or
					spaces.
				</p>
			</div>
		</div>
	);
}
