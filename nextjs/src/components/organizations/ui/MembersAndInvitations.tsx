// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/ui/tabs';
import { Members } from '@/components/organizations/ui/Members';
import { Invitations } from '@/components/organizations/ui/Invitations';
import InviteMembers from './InviteMembers';

// API
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';

export default function MembersAndInvitations() {
	const members = useQuery(api.organizations.members.getOrganizationMembers);
	const invitations = useQuery(api.organizations.invitations.db.getInvitations);
	const isOwnerOrAdmin = useIsOwnerOrAdmin();

	return (
		<Tabs defaultValue="members">
			<h6 className='text-sm font-medium pb-6 border-b border-surface-300-700 text-surface-700-300'>Members</h6>
			<div className='flex flex-row justify-between align-middle w-full py-4 '>
					<TabsList>
						<TabsTrigger value="members" className='gap-2'>Members <span className='badge preset-filled-surface-300-700 size-6 rounded-full'>{members && `${members.length}`} </span></TabsTrigger>
						{isOwnerOrAdmin && (
						<TabsTrigger value="invitations" className='gap-2'>
						Invitations <span className='badge preset-filled-surface-300-700 size-6 rounded-full'>{invitations && `${invitations.length}`}</span>
					</TabsTrigger>
				)}
					</TabsList>
				<InviteMembers />
			</div>
			<TabsContent value="members">
				
				<Members />
			</TabsContent>
			{isOwnerOrAdmin && (
				<TabsContent value="invitations">
					<Invitations />
				</TabsContent>
			)}
		</Tabs>
	);
}
