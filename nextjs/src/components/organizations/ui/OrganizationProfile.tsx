// Components
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/primitives/ui/tabs';
import OrganizationInfo from '@/components/organizations/ui/OrganizationInfo';
import DeleteOrganization from '@/components/organizations/ui/DeleteOrganization';
import MembersAndInvitations from '@/components/organizations/ui/MembersAndInvitations';
import LeaveOrganization from '@/components/organizations/ui/LeaveOrganization';
import { useIsOwnerOrAdmin } from '@/components/organizations/api/hooks';
import { Bolt, ChevronLeft, ChevronRight, UserIcon, Wallet } from 'lucide-react';

interface OrganizationProfileProps {
	onSuccessfulDelete?: () => void;
}

export default function OrganizationProfile({ onSuccessfulDelete }: OrganizationProfileProps) {
	const isOwnerOrAdmin = useIsOwnerOrAdmin();
	const [mobileTab, setMobileTab] = useState('');

	const handleTabChange = (value: string) => {
		// slight delay to allow tab state to update before closing
		setTimeout(() => setMobileTab(value), 10);
	};

	const navigation = (
		<div
			className={`bg-surface-50 dark:bg-surface-900 sm:bg-surface-300-700 h-full w-full transform p-2 transition-transform duration-300 ${mobileTab ? '-translate-x-full' : 'translate-x-0'} md:translate-x-0`}
		>
			<div className="px-3 py-4 text-2xl font-medium md:text-xl">Organization</div>
			<TabsList className="flex flex-col pt-8 md:pt-0">
				<TabsTrigger
					value="general"
					onClick={() => handleTabChange('general')}
					className="sm:data-[state=active]:bg-surface-400-600/50 gap-3 data-[state=active]:bg-transparent data-[state=active]:text-inherit md:gap-2 md:px-2"
				>
					<div className="bg-surface-300-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-6 md:w-6 md:bg-transparent">
						<Bolt />
					</div>
					<span className="w-full">General</span>
					<ChevronRight className="flex md:hidden" />
				</TabsTrigger>

				<div className="flex h-2 w-full items-center justify-center px-3 md:hidden">
					<hr className="border-0.5 border-surface-200-800 w-full" />
				</div>

				{isOwnerOrAdmin && (
					<>
						<TabsTrigger
							value="members"
							onClick={() => handleTabChange('members')}
							className="sm:data-[state=active]:bg-surface-400-600/50 gap-3 data-[state=active]:bg-transparent data-[state=active]:text-inherit md:gap-2 md:px-2"
						>
							<div className="bg-surface-300-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-6 md:w-6 md:bg-transparent">
								<UserIcon />
							</div>
							<span className="w-full">Members</span>
							<ChevronRight className="flex md:hidden" />
						</TabsTrigger>

						<div className="flex h-2 w-full items-center justify-center px-3 md:hidden">
							<hr className="border-0.5 border-surface-200-800 w-full" />
						</div>

						<TabsTrigger
							value="billing"
							onClick={() => handleTabChange('billing')}
							className="sm:data-[state=active]:bg-surface-400-600/50 gap-3 data-[state=active]:bg-transparent data-[state=active]:text-inherit md:gap-2 md:px-2"
						>
							<div className="bg-surface-300-700 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg md:h-6 md:w-6 md:bg-transparent">
								<Wallet />
							</div>
							<span className="w-full">Billing</span>
							<ChevronRight className="flex md:hidden" />
						</TabsTrigger>
					</>
				)}
			</TabsList>
		</div>
	);

	const content = (
		<div
			className={`flex transform flex-col gap-4 px-4 py-6 transition-transform duration-300 ${mobileTab ? 'translate-x-0' : 'translate-x-full'} bg-surface-100-900 absolute inset-0 md:translate-x-full`}
		>
			<button
				className="ring-offset-background focus:ring-ring hover:bg-surface-300-700 absolute top-5 left-4 rounded-lg p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
				onClick={() => setMobileTab('')}
			>
				<ChevronLeft />
			</button>
			{mobileTab === 'general' && (
				<>
					<OrganizationInfo />
					<DeleteOrganization onSuccessfulDelete={onSuccessfulDelete} />
					<LeaveOrganization />
				</>
			)}
			{mobileTab === 'members' && <MembersAndInvitations />}
			{mobileTab === 'billing' && (
				<h6 className="border-surface-300-700 text-surface-700-300 border-b pb-6 text-center text-sm font-medium sm:text-left">
					Billing
				</h6>
			)}
		</div>
	);

	return (
		<Tabs defaultValue="general" orientation="vertical" className="relative h-full overflow-hidden">
			{/* Desktop layout */}
			<div className="hidden h-full w-full md:flex">
				<div className="w-56">{navigation}</div>
				<div className="flex-1">
					<TabsContent value="general" className="flex h-full flex-col">
						<OrganizationInfo />
						<div className="pt-16">
							<LeaveOrganization />
							<DeleteOrganization onSuccessfulDelete={onSuccessfulDelete} />
						</div>
					</TabsContent>
					{isOwnerOrAdmin && (
						<>
							<TabsContent value="members">
								<MembersAndInvitations />
							</TabsContent>
							<TabsContent value="billing">
								<h6 className="border-surface-300-700 text-surface-700-300 w-full border-b pb-6 text-center text-sm font-medium sm:text-left">
									Billing
								</h6>
							</TabsContent>
						</>
					)}
				</div>
			</div>

			{/* Mobile layout */}
			<div className="relative h-full w-full md:hidden">
				{navigation}
				{mobileTab && content}
			</div>
		</Tabs>
	);
}
