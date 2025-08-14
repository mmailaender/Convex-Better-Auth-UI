// React
import { useState } from 'react';

/** UI **/
// Primitives
import * as Tabs from '@/components/primitives/ui/tabs';
// Icons
import { Bolt, ChevronLeft, ChevronRight, UserIcon, Wallet } from 'lucide-react';
// Widgets
import OrganizationInfo from '@/components/organizations/ui/OrganizationInfo';
import DeleteOrganization from '@/components/organizations/ui/DeleteOrganization';
import MembersAndInvitations from '@/components/organizations/ui/MembersAndInvitations';
import LeaveOrganization from '@/components/organizations/ui/LeaveOrganization';

// API
import { useRoles } from '@/components/organizations/api/hooks';

type OrganizationProfileProps = {
	/**
	 * Optional callback that will be called when an organization is successfully deleted
	 */
	onSuccessfulDelete?: () => void;
};

export default function OrganizationProfile({ onSuccessfulDelete }: OrganizationProfileProps) {
	const isOwnerOrAdmin = useRoles().hasOwnerOrAdminRole;
	const [activeMobileTab, setActiveMobileTab] = useState<string>('');

	// Tab configuration
	const tabs = [
		{
			value: 'general',
			label: 'General',
			icon: Bolt,
			showForAllUsers: true
		},
		{
			value: 'members',
			label: 'Members',
			icon: UserIcon,
			showForAllUsers: false
		},
		{
			value: 'billing',
			label: 'Billing',
			icon: Wallet,
			showForAllUsers: false
		}
	];

	const visibleTabs = tabs.filter((tab) => tab.showForAllUsers || isOwnerOrAdmin);

	const handleMobileTabChange = (value: string) => {
		// Slight delay to allow tab state to update before showing content
		setTimeout(() => setActiveMobileTab(value), 10);
	};

	const closeMobileTab = () => {
		setActiveMobileTab('');
	};

	return (
		<Tabs.Root
			defaultValue="general"
			orientation="vertical"
			className="relative h-full overflow-hidden"
		>
			{/* Desktop Layout */}
			<div className="hidden h-full w-full md:flex">
				{/* Desktop Navigation */}
				<div className="bg-surface-50 dark:bg-surface-900 sm:bg-surface-300-700 h-full w-56 p-2">
					<div className="px-3 py-4 text-xl font-medium">Organization</div>
					<Tabs.List className="flex flex-col">
						{visibleTabs.map((tab) => {
							const IconComponent = tab.icon;
							return (
								<Tabs.Trigger key={tab.value} value={tab.value} className="gap-2 pl-2">
									<div className="flex h-6 w-6 shrink-0 items-center justify-center">
										<IconComponent />
									</div>
									<span className="w-full">{tab.label}</span>
								</Tabs.Trigger>
							);
						})}
					</Tabs.List>
				</div>

				{/* Desktop Content */}
				<div className="flex-1">
					<Tabs.Content value="general" className="flex h-full flex-col">
						<div className="h-full">
							<h6 className="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-left text-sm font-medium">
								General settings
							</h6>
							<OrganizationInfo />
						</div>
						<div className="pt-16">
							<LeaveOrganization />
							<DeleteOrganization onSuccessfulDelete={onSuccessfulDelete} />
						</div>
					</Tabs.Content>

					{isOwnerOrAdmin && (
						<>
							<Tabs.Content value="members">
								<h6 className="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-left text-sm font-medium">
									Members
								</h6>
								<MembersAndInvitations />
							</Tabs.Content>
							<Tabs.Content value="billing">
								<h6 className="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-left text-sm font-medium">
									Billing
								</h6>
							</Tabs.Content>
						</>
					)}
				</div>
			</div>

			{/* Mobile Layout */}
			<div className="relative h-full w-full md:hidden">
				{/* Mobile Navigation */}
				<div
					className={`bg-surface-50 dark:bg-surface-900 sm:bg-surface-300-700 h-full w-full transform p-2 transition-transform duration-300 ${
						activeMobileTab ? '-translate-x-full' : 'translate-x-0'
					}`}
				>
					<div className="px-3 py-4 text-2xl font-medium">Organization</div>
					<Tabs.List className="flex flex-col pt-8">
						{visibleTabs.map((tab, index) => {
							const IconComponent = tab.icon;
							return (
								<div key={tab.value}>
									<Tabs.Trigger
										value={tab.value}
										onClick={() => handleMobileTabChange(tab.value)}
										className="gap-3 aria-selected:bg-transparent aria-selected:text-inherit"
									>
										<div className="bg-surface-300-700 rounded-base flex h-7 w-7 shrink-0 items-center justify-center">
											<IconComponent />
										</div>
										<span className="w-full">{tab.label}</span>
										<ChevronRight className="flex" />
									</Tabs.Trigger>
									{index < visibleTabs.length - 1 && (
										<div className="flex h-2 w-full items-center justify-center px-3">
											<hr className="border-0.5 border-surface-200-800 w-full" />
										</div>
									)}
								</div>
							);
						})}
					</Tabs.List>
				</div>

				{/* Mobile Content */}
				{activeMobileTab && (
					<div className="bg-surface-100-900 absolute inset-0 flex translate-x-0 transform flex-col gap-4 px-4 py-6 transition-transform duration-300">
						<button
							className="ring-offset-background focus:ring-ring hover:bg-surface-300-700 rounded-base absolute top-5 left-4 p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
							onClick={closeMobileTab}
						>
							<ChevronLeft />
						</button>

						{activeMobileTab === 'general' && (
							<>
								<div className="h-full">
									<h6 className="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-center text-sm font-medium">
										General settings
									</h6>
									<OrganizationInfo />
								</div>
								<LeaveOrganization />
								<DeleteOrganization onSuccessfulDelete={onSuccessfulDelete} />
							</>
						)}

						{activeMobileTab === 'members' && (
							<>
								<h6 className="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-center text-sm font-medium">
									Members
								</h6>
								<MembersAndInvitations />
							</>
						)}

						{activeMobileTab === 'billing' && (
							<h6 className="border-surface-300-700 text-surface-700-300 mb-6 border-b pb-6 text-center text-sm font-medium">
								Billing
							</h6>
						)}
					</div>
				)}
			</div>
		</Tabs.Root>
	);
}
