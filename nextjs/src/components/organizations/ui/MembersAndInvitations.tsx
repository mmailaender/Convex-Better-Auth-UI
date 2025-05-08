import { useState } from 'react';

// Components
import { Tabs } from '@skeletonlabs/skeleton-react';
import { Members } from '@/components/organizations/ui/Members';
import { Invitations } from '@/components/organizations/ui/Invitations';
import InviteMembers from './InviteMembers';

// API
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';

export default function MembersAndInvitations() {
	const [group, setGroup] = useState('members');
	const members = useQuery(api.organizations.members.getOrganizationMembers);
	const invitations = useQuery(api.organizations.invitations.db.getInvitations);
	const isOwnerOrAdmin = useIsOwnerOrAdmin();

	return (
		<Tabs value={group} onValueChange={(e) => setGroup(e.value!)}>
			<Tabs.List>
				<Tabs.Control value="members">Members {members && `(${members.length})`}</Tabs.Control>
				{isOwnerOrAdmin && (
					<Tabs.Control value="invitations">
						Invitations {invitations && `(${invitations.length})`}
					</Tabs.Control>
				)}
			</Tabs.List>
			<Tabs.Content>
				<Tabs.Panel value="members">
					<InviteMembers />
					<Members />
				</Tabs.Panel>
				{isOwnerOrAdmin && (
					<Tabs.Panel value="invitations">
						<Invitations />
					</Tabs.Panel>
				)}
			</Tabs.Content>
		</Tabs>
	);
}
