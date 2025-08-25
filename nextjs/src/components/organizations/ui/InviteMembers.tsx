'use client';
// React
import { useState, FormEvent } from 'react';

// Primitives
import { toast } from 'sonner';

// API
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { authClient } from '../../../lib/auth/api/auth-client';
// API Types
type Role = typeof authClient.$Infer.Member.role;

export default function InviteMembers({ onSuccess }: { onSuccess?: () => void }) {
	const [emailInput, setEmailInput] = useState('');
	const [selectedRole, setSelectedRole] = useState<Role>('member');
	const [isProcessing, setIsProcessing] = useState(false);

	const activeOrganization = useQuery(api.organizations.queries.getActiveOrganization);

	const handleInvite = async (event: FormEvent) => {
		event.preventDefault();
		if (isProcessing) return;
		setIsProcessing(true);

		const emails = emailInput
			.replace(/[,;\s]+/g, ',')
			.split(',')
			.map((email) => email.trim())
			.filter((email) => email.length > 0);

		if (emails.length === 0) {
			toast.error('Please enter at least one email address');
			setIsProcessing(false);
			return;
		}

		if (!activeOrganization?.id) {
			toast.error('No active organization found');
			setIsProcessing(false);
			return;
		}

		const results = [];

		// Send invitations one by one
		for (const email of emails) {
			const { data, error } = await authClient.organization.inviteMember({
				email,
				role: selectedRole,
				organizationId: activeOrganization.id,
				resend: true
			});

			results.push({
				email,
				success: !error,
				data,
				error
			});
		}

		const successful = results.filter((r) => r.success);
		const failed = results.filter((r) => !r.success);

		if (successful.length > 0) {
			const msg = `Sent ${successful.length} invitation(s) to: ${successful.map((r) => r.email).join(', ')}`;
			toast.success(msg);
			setEmailInput('');
			if (onSuccess) {
				onSuccess();
			}
		}

		if (failed.length > 0) {
			const msg = `Failed to send invitation(s) to: ${failed.map((r) => r.email).join(', ')}`;
			toast.error(msg);
		}

		setIsProcessing(false);
	};
	return (
		<form onSubmit={handleInvite} className="flex flex-col gap-4">
			<div className="flex flex-col gap-4">
				<div className="flex flex-col">
					<label>
						<span className="label">Role</span>
						<select
							value={selectedRole}
							onChange={(e) => setSelectedRole(e.target.value as Role)}
							className="select w-full cursor-pointer"
						>
							<option value="member">Member</option>
							<option value="admin">Admin</option>
						</select>
					</label>
				</div>
				<div className="flex flex-col gap-2">
					<label>
						<span className="label">Email(s)</span>
						<textarea
							value={emailInput}
							onChange={(e) => setEmailInput(e.target.value)}
							placeholder="example@email.com, example2@email.com"
							className="textarea min-h-24 grow"
							required
						></textarea>
					</label>
					<p className="text-surface-600-400 px-1 text-xs">
						You can invite multiple people by separating email addresses with commas, semicolons, or
						spaces.
					</p>
				</div>

				<div className="flex justify-end gap-2 pt-6 md:flex-row">
					<button type="submit" className="btn preset-filled-primary-500" disabled={isProcessing}>
						{isProcessing ? 'Sending...' : 'Send Invitations'}
					</button>
				</div>
			</div>
		</form>
	);
}
