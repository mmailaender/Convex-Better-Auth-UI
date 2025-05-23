// Components
import { useState, useEffect } from 'react';
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
  const [isDesktop, setIsDesktop] = useState(true);
  const [mobileTab, setMobileTab] = useState('');
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateMatch = () => setIsDesktop(mediaQuery.matches);
    updateMatch();
    mediaQuery.addEventListener('change', updateMatch);
    return () => mediaQuery.removeEventListener('change', updateMatch);
  }, []);

  const handleTabChange = (value: string) => {
    setAnimating(true);
    setTimeout(() => {
      setMobileTab(value);
      setAnimating(false);
    }, 10);
  };

  const navigation = (
    <div className={`bg-surface-50 dark:bg-surface-900 sm:bg-surface-300-700 h-full w-full p-2 transition-transform duration-300 ${mobileTab && !isDesktop ? '-translate-x-full' : 'translate-x-0'}`}>
      <div className="px-3 py-4 text-2xl md:text-xl font-medium">Organization</div>
      <TabsList className="flex flex-col pt-8 md:pt-0">
        <TabsTrigger
          value="general"
          onClick={() => handleTabChange('general')}
          className={!isDesktop ? 'data-[state=active]:bg-transparent data-[state=active]:text-inherit gap-3 ' : 'gap-2 px-2'}
        >
           <div className='flex justify-center items-center w-7 h-7 md:h-6 md:w-6 bg-surface-300-700 md:bg-transparent rounded-lg shrink-0'> <Bolt /></div><span className='w-full'>General </span><ChevronRight className='flex sm:hidden' />
        </TabsTrigger>
				<div className='flex items-center justify-center w-full px-3 h-2 sm:hidden'><hr className='w-full border-0.5 border-surface-200-800 '/></div>
        {isOwnerOrAdmin && (
          <>
            <TabsTrigger
              value="members"
              onClick={() => handleTabChange('members')}
              className={!isDesktop ? 'data-[state=active]:bg-transparent data-[state=active]:text-inherit gap-3' : 'gap-2 px-2'}
            >
              <div className='flex justify-center items-center w-7 h-7 md:h-6 md:w-6 bg-surface-300-700 md:bg-transparent rounded-lg shrink-0'> <UserIcon/></div><span className='w-full'>Members </span><ChevronRight className='flex sm:hidden' />
            </TabsTrigger>
						<div className='flex items-center justify-center w-full px-3 h-2 sm:hidden'><hr className='w-full border-0.5  border-surface-200-800 '/></div>
            <TabsTrigger
              value="billing"
              onClick={() => handleTabChange('billing')}
              className={!isDesktop ? 'data-[state=active]:bg-transparent data-[state=active]:text-inherit gap-3' : 'gap-2 px-2'}
            >
              <div className='flex justify-center items-center w-7 h-7 md:h-6 md:w-6 bg-surface-300-700 md:bg-transparent rounded-lg shrink-0'> <Wallet /></div><span className='w-full'>Billing </span><ChevronRight className='flex sm:hidden' />
            </TabsTrigger>
          </>
        )}
      </TabsList>
    </div>
  );

  const content = (
    <div className={`flex flex-col gap-4 px-4 py-6 transition-transform duration-300 ${mobileTab && !isDesktop ? 'translate-x-0' : 'translate-x-full'} absolute inset-0 bg-surface-100-900`}>
      <button
        className="ring-offset-background focus:ring-ring data-[state=open]:bg-primary-500 data-[state=open]:text-surface-700-300 hover:bg-surface-300-700 absolute top-5 left-4 rounded-lg p-2 opacity-70 transition-opacity hover:opacity-100 focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
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
        <h6 className="border-surface-300-700 text-surface-700-300 border-b pb-6 text-sm font-medium text-center sm:text-left">
          Billing
        </h6>
      )}
    </div>
  );

  return (
    <Tabs defaultValue="general" orientation="vertical" className="relative overflow-hidden h-full">
      {isDesktop ? (
        <div className="flex h-full w-full">
          <div className="w-56">{navigation}</div>
          <div className="flex-1">
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
                  <h6 className="border-surface-300-700 text-surface-700-300 border-b pb-6 text-sm font-medium text-center sm:text-left w-full">
                    Billing
                  </h6>
                </TabsContent>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="relative h-full w-full md:w-72">
          {navigation}
          {mobileTab && content}
        </div>
      )}
    </Tabs>
  );
}