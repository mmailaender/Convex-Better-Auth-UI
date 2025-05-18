// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/ui/tabs';
import OrganizationInfo from '@/components/organizations/ui/OrganizationInfo';
import DeleteOrganization from '@/components/organizations/ui/DeleteOrganization';
import MembersAndInvitations from '@/components/organizations/ui/MembersAndInvitations';
import LeaveOrganization from '@/components/organizations/ui/LeaveOrganization';

// API
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';
import { DialogHeader, DialogTitle } from '@/components/primitives/ui/dialog';

interface OrganizationProfileProps {
	/**
	 * Optional callback that will be called when an organization is successfully deleted
	 */
	onSuccessfulDelete?: () => void;
}

export default function OrganizationProfile({ onSuccessfulDelete }: OrganizationProfileProps) {
	const isOwnerOrAdmin = useIsOwnerOrAdmin();
	return (
		<Tabs defaultValue="general" orientation="vertical">
			<div className="bg-surface-300-700 h-full w-72 p-2">
				<DialogHeader className="px-3 py-4">
					<DialogTitle>Organization</DialogTitle>
				</DialogHeader>
				<TabsList>
					<TabsTrigger value="general">General</TabsTrigger>
					{isOwnerOrAdmin && (
						<>
							<TabsTrigger value="members">Members</TabsTrigger>
							<TabsTrigger value="billing">Billing</TabsTrigger>
						</>
					)}
				</TabsList>
			</div>
			<TabsContent value="general" className="flex h-full flex-col">
				<OrganizationInfo />
				<div className="pt-16">
					<DeleteOrganization onSuccessfulDelete={onSuccessfulDelete} />
				</div>
				<LeaveOrganization />
			</TabsContent>
			{isOwnerOrAdmin && (
				<>
					<TabsContent value="members">
						<MembersAndInvitations />
					</TabsContent>
					<TabsContent value="billing">
						<h6 className="border-surface-300-700 text-surface-700-300 border-b pb-6 text-sm font-medium">
							Billing
						</h6>
					</TabsContent>
				</>
			)}
		</Tabs>
	);
}
