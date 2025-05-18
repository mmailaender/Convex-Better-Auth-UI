// Components
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/ui/tabs';
import OrganizationInfo from '@/components/organizations/ui/OrganizationInfo';
import DeleteOrganization from '@/components/organizations/ui/DeleteOrganization';
import MembersAndInvitations from '@/components/organizations/ui/MembersAndInvitations';
import LeaveOrganization from '@/components/organizations/ui/LeaveOrganization';

// API
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
	DialogDescription
} from '@/components/primitives/ui/dialog';

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
			<div className='p-2 bg-surface-300-700 w-72 h-full'>
				<DialogHeader className='py-4 px-3'>
					<DialogTitle >Organization</DialogTitle>
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
			<TabsContent value="general" className='flex flex-col h-full'>
				<OrganizationInfo />
				<div className='pt-16'>
				<DeleteOrganization onSuccessfulDelete={onSuccessfulDelete} />
				</div>
				<LeaveOrganization />
			</TabsContent>
			{isOwnerOrAdmin && (
				<>
					<TabsContent value="members">
						<MembersAndInvitations />
					</TabsContent>
					<TabsContent value="billing"><h6 className='text-sm font-medium pb-6 border-b border-surface-300-700 text-surface-700-300'>Billing</h6></TabsContent>
				</>
			)}
		</Tabs>
		
		
	);
}
