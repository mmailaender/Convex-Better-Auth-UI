'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { toast } from 'sonner';
import { Building2, Copy, EllipsisVertical, Loader2, Trash2 } from 'lucide-react';

import { api } from '@/convex/_generated/api';
import * as Dialog from '@/components/primitives/ui/dialog';
import * as Menu from '@/components/primitives/ui/menu';
import { Portal } from '@ark-ui/react/portal';
import type { AdminOrganization } from '@/components/admin/types';

type OrganizationActionsMenuProps = {
	organization: AdminOrganization;
	/** Shows "View organization" when set */
	onView?: () => void;
	/** Disables "Delete organization", such as for one owned by another admin */
	deleteDisabled?: boolean;
	/** Called after the organization is deleted */
	onDeleted?: () => void;
};

/**
 * The actions menu of an organization, in the organizations table and on the organization page,
 * with the dialog confirming its deletion.
 */
export default function OrganizationActionsMenu({
	organization,
	onView,
	deleteDisabled = false,
	onDeleted
}: OrganizationActionsMenuProps) {
	const deleteOrganization = useMutation(api.admin.mutations.deleteOrganizationAsAdmin);
	const [deleteOpen, setDeleteOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	async function copyId() {
		try {
			await navigator.clipboard.writeText(organization._id);
			toast.success('Copied the organization ID');
		} catch {
			toast.error("Couldn't copy");
		}
	}

	async function handleDelete() {
		const { _id, name } = organization;
		setDeleting(true);
		try {
			await deleteOrganization({ organizationId: _id });
			toast.success(`Deleted ${name}`);
			setDeleteOpen(false);
			onDeleted?.();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to delete organization');
		} finally {
			setDeleting(false);
		}
	}

	return (
		<>
			<Menu.Root>
				<Menu.Trigger
					className="btn-icon hover:preset-tonal"
					aria-label={`Actions for ${organization.name}`}
				>
					<EllipsisVertical className="size-4" aria-hidden="true" />
				</Menu.Trigger>
				{/* Portaled so the table's scroll container doesn't clip the menu */}
				<Portal>
					<Menu.Content className="bg-surface-50-950 min-w-52">
						<Menu.Item value="copy-id" className="gap-3" onClick={copyId}>
							<Copy className="size-4" aria-hidden="true" />
							Copy organization ID
						</Menu.Item>
						{onView ? (
							<Menu.Item value="view" className="gap-3" onClick={onView}>
								<Building2 className="size-4" aria-hidden="true" />
								View organization
							</Menu.Item>
						) : null}
						<Menu.Separator />
						<Menu.Item
							value="delete"
							variant="destructive"
							className="gap-3 data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
							disabled={deleteDisabled}
							onClick={() => setDeleteOpen(true)}
						>
							<Trash2 className="size-4" aria-hidden="true" />
							Delete organization
						</Menu.Item>
					</Menu.Content>
				</Portal>
			</Menu.Root>

			{/* Mounted only while open, so a long table doesn't keep a dialog per row */}
			<Dialog.Root open={deleteOpen} onOpenChange={setDeleteOpen} lazyMount unmountOnExit>
				<Dialog.Content className="md:max-w-108">
					<Dialog.Header className="pr-8">
						<Dialog.Title>Delete {organization.name}</Dialog.Title>
						<Dialog.Description className="text-surface-700-300">
							This permanently deletes the organization with its memberships and pending
							invitations. Members who had it active switch to another of their organizations. This
							can&apos;t be undone.
						</Dialog.Description>
					</Dialog.Header>
					<Dialog.Footer>
						<Dialog.Close className="btn preset-tonal" disabled={deleting}>
							Cancel
						</Dialog.Close>
						<button
							type="button"
							className="btn preset-filled-error-500"
							onClick={handleDelete}
							disabled={deleting}
							aria-busy={deleting}
						>
							{deleting ? (
								<>
									<Loader2 className="size-4 animate-spin" aria-hidden="true" />
									Deleting...
								</>
							) : (
								'Delete organization'
							)}
						</button>
					</Dialog.Footer>
					<Dialog.CloseX />
				</Dialog.Content>
			</Dialog.Root>
		</>
	);
}
