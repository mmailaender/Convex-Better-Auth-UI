"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, Settings, X } from "lucide-react";
import { Avatar } from "@skeletonlabs/skeleton-react";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import CreateOrganization from "./CreateOrganization";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/primitives/ui/Popover";
import {
  Modal,
  ModalContent,
  ModalClose,
  ModalTrigger,
} from "@/components/primitives/ui/Modal";

import type { Id } from "@/convex/_generated/dataModel";

/**
 * Organization switcher component that allows switching between organizations,
 * creating new organizations, and accessing organization settings.
 */
export default function OrganizationSwitcher() {
  const router = useRouter();

  // Queries and mutations
  const organizations = useQuery(api.organizations.getUserOrganizations);
  const activeOrganization = useQuery(api.organizations.getActiveOrganization);
  const setActiveOrg = useMutation(api.organizations.setActiveOrganization);

  // State
  const [openSwitcher, setOpenSwitcher] = useState<boolean>(false);
  const [openCreateOrganization, setOpenCreateOrganization] =
    useState<boolean>(false);
  const [openOrganizationProfile, setOpenOrganizationProfile] =
    useState<boolean>(false);

  /**
   * Updates the active organization
   */
  const updateActiveOrg = async (organizationId: Id<"organizations">) => {
    try {
      await setActiveOrg({ organizationId });

      // Close popover and refresh
      setOpenSwitcher(false);
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  /**
   * Temporary LeaveOrganization component (will be implemented separately)
   */
  const LeaveOrganization = ({
    organizationId,
  }: {
    organizationId: Id<"organizations">;
  }) => (
    <button
      onClick={() => console.log("Leave organization:", organizationId)}
      className="btn preset-outlined-error-500 flex gap-2"
    >
      <X size={16} />
      <span>Leave</span>
    </button>
  );

  /**
   * Temporary OrganizationProfile component (will be implemented separately)
   */
  const OrganizationProfile = () => (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Organization Profile</h2>
      <p>This component will be implemented separately.</p>
    </div>
  );

  // Loading state
  if (!organizations) {
    return (
      <div className="animate-pulse h-8 w-40 bg-gray-200 rounded-md"></div>
    );
  }

  // No organizations - just show the create button
  if (organizations.length === 0) {
    return (
      <Modal
        open={openCreateOrganization}
        onOpenChange={setOpenCreateOrganization}
      >
        <ModalTrigger className="btn preset-tonal flex items-center gap-2">
          <Plus size={16} />
          <span>Create Organization</span>
        </ModalTrigger>
        <ModalContent>
          <CreateOrganization
            onSuccessfulCreate={() => setOpenCreateOrganization(false)}
          />
          <ModalClose />
        </ModalContent>
      </Modal>
    );
  }

  // Has organizations - show the switcher
  return (
    <>
      <Popover
        open={openSwitcher}
        onOpenChange={setOpenSwitcher}
        placement="bottom-end"
      >
        <PopoverTrigger onClick={() => setOpenSwitcher(!openSwitcher)}>
          <div className="flex items-center gap-2">
            <Avatar
              src={activeOrganization?.logo || ""}
              name={activeOrganization?.name || ""}
              size="size-6"
            />
            <span className="text-surface-700-300 text-base font-semibold">
              {activeOrganization?.name}
            </span>
            <ChevronsUpDown size={12} />
          </div>
        </PopoverTrigger>

        <PopoverContent>
          <ul role="list" className="space-y-1">
            <li>
              <div className="rounded-base text-surface-700-300 flex items-center gap-x-3 p-4 text-sm/6 font-semibold">
                <Avatar
                  src={activeOrganization?.logo || ""}
                  name={activeOrganization?.name || ""}
                  size="size-6"
                />
                <span className="text-surface-700-300 text-base font-semibold">
                  {activeOrganization?.name}
                </span>
                {activeOrganization?.role === "role_organization_owner" ||
                activeOrganization?.role === "role_organization_admin" ? (
                  <button
                    onClick={() => {
                      setOpenOrganizationProfile(true);
                      setOpenSwitcher(false);
                    }}
                    className="btn preset-outlined-surface-500 flex gap-2"
                  >
                    <Settings size={16} />
                    <span>Manage</span>
                  </button>
                ) : (
                  activeOrganization && (
                    <LeaveOrganization
                      organizationId={activeOrganization._id}
                    />
                  )
                )}
              </div>
            </li>

            {organizations
              .filter((org) => org && org._id !== activeOrganization?._id)
              .map(
                (org) =>
                  org && (
                    <li key={org._id}>
                      <button
                        onClick={() => updateActiveOrg(org._id)}
                        className="group rounded-base text-surface-700-300 hover:text-primary-600-400 flex gap-x-3 p-4 text-sm/6 font-semibold hover:bg-gray-50 w-full"
                      >
                        <Avatar
                          src={org.logo || ""}
                          name={org.name}
                          size="size-6"
                        />
                        <span className="text-surface-700-300 text-base font-semibold">
                          {org.name}
                        </span>
                      </button>
                    </li>
                  )
              )}

            <li>
              <button
                onClick={() => {
                  setOpenCreateOrganization(true);
                  setOpenSwitcher(false);
                }}
                className="btn preset-tonal flex items-center gap-2 w-full"
              >
                <Plus size={16} />
                <span>Create Organization</span>
              </button>
            </li>
          </ul>
        </PopoverContent>
      </Popover>

      <Modal
        open={openCreateOrganization}
        onOpenChange={setOpenCreateOrganization}
      >
        <ModalContent>
          <CreateOrganization />
          <ModalClose />
        </ModalContent>
      </Modal>

      <Modal
        open={openOrganizationProfile}
        onOpenChange={setOpenOrganizationProfile}
      >
        <ModalContent>
          <OrganizationProfile />
          <ModalClose />
        </ModalContent>
      </Modal>
    </>
  );
}
