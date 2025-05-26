'use client';

import { useState, FormEvent } from 'react';
import { useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Plus } from 'lucide-react';
import { Doc } from '@/convex/_generated/dataModel';
import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogClose,
	DialogFooter
} from '@/components/primitives/ui/dialog';
import {
	Drawer,
	DrawerTrigger,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerClose
} from '@/components/primitives/ui/drawer';
import { toast } from 'sonner';

type Role = Doc<'organizationMembers'>['role'];

export default function InviteMembers() {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isDrawerOpen, setIsDrawerOpen] = useState(false);
	const [emailInput, setEmailInput] = useState('');
	const [selectedRole, setSelectedRole] = useState<Role>('role_organization_member');
	const [isProcessing, setIsProcessing] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');

	const inviteMembers = useAction(api.organizations.invitations.actions.inviteMembers);

	const handleInvite = async (event: FormEvent) => {
		event.preventDefault();
		if (isProcessing) return;
		setIsProcessing(true);
		setErrorMessage('');
		setSuccessMessage('');

		try {
			const emails = emailInput
				.replace(/[,;\s]+/g, ',')
				.split(',')
				.map((email) => email.trim())
				.filter((email) => email.length > 0);

			if (emails.length === 0) {
				setErrorMessage('Please enter at least one email address');
				setIsProcessing(false);
				return;
			}

			const results = await inviteMembers({ emails, role: selectedRole });
			const successful = results.filter((r) => r.success);
			const failed = results.filter((r) => !r.success);

			if (successful.length > 0) {
				const msg = `Sent ${successful.length} invitation(s) to: ${successful.map((r) => r.email).join(', ')}`;
				toast.success(msg);
				setEmailInput('');
			}

			if (failed.length > 0) {
				const msg = `Failed to send invitation(s) to: ${failed.map((r) => r.email).join(', ')}`;
				toast.error(msg);
			}
		} catch (err) {
			const errorMsg =
				err instanceof Error ? err.message : 'An error occurred while processing invitations';
			toast.error(errorMsg);
		} finally {
			setIsProcessing(false);
		}
	};

	const form = (
		<form onSubmit={handleInvite} className="flex flex-col gap-4">
			<div className="flex flex-col gap-4">
				<div className="flex flex-col">
					<label className="label">Role</label>
					<select
						value={selectedRole}
						onChange={(e) => setSelectedRole(e.target.value as Role)}
						className="select w-full"
					>
						<option value="role_organization_member">Member</option>
						<option value="role_organization_admin">Admin</option>
					</select>
				</div>
				<div className="flex flex-col gap-2">
					<div>
						<label className="label">Email(s)</label>
						<textarea
							value={emailInput}
							onChange={(e) => setEmailInput(e.target.value)}
							placeholder="example@email.com, example2@email.com"
							className="textarea min-h-24 grow"
							required
						></textarea>
					</div>
					<p className="text-surface-600-400 px-1 text-xs">
						You can invite multiple people by separating email addresses with commas, semicolons, or
						spaces.
					</p>
				</div>

				<DialogFooter>
					<button type="submit" className="btn preset-filled-primary-500" disabled={isProcessing}>
						{isProcessing ? 'Sending...' : 'Send Invitations'}
					</button>
				</DialogFooter>
			</div>

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
		</form>
	);

	return (
		<>
			<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
				<DialogTrigger
					onClick={() => setIsDialogOpen(true)}
					className="btn preset-filled-primary-500 hidden h-10 text-sm md:block"
				>
					<Plus size={20} /> Invite members
				</DialogTrigger>
				<DialogContent className="max-w-108">
					<DialogHeader>
						<DialogTitle>Invite new members</DialogTitle>
					</DialogHeader>
					{form}
					<DialogClose />
				</DialogContent>
			</Dialog>
			<Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
				<DrawerTrigger
					onClick={() => setIsDrawerOpen(true)}
					className="btn preset-filled-primary-500 absolute right-4 bottom-4 h-10 text-sm md:hidden"
				>
					<Plus size={20} /> Invite members
				</DrawerTrigger>
				<DrawerContent>
					<DrawerHeader>
						<DrawerTitle>Invite new members</DrawerTitle>
					</DrawerHeader>
					{form}
					<DrawerClose />
				</DrawerContent>
			</Drawer>
		</>
	);
}
