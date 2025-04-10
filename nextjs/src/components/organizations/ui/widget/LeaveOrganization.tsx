import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useIsOwner } from "@/components/organizations/api/hooks";
import {
  Modal,
  ModalContent,
  ModalTrigger,
  ModalHeading,
  ModalDescription,
  ModalClose,
} from "@/components/primitives/ui/Modal";

/**
 * LeaveOrganization component allows a user to leave the current organization
 * If the user is the owner, they cannot leave and must transfer ownership first
 */
export default function LeaveOrganization(): React.ReactNode {
  // State hooks
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Convex queries and mutations
  const activeOrganization = useQuery(api.organizations.getActiveOrganization);
  const members = useQuery(api.organizations.members.getOrganizationMembers);
  const leaveOrganization = useMutation(api.organizations.leaveOrganization);

  // Navigation
  const router = useRouter();

  // Check if user is an organization owner
  const isOrgOwner = useIsOwner();

  /**
   * Handles the leave organization action
   */
  const handleLeaveOrganization = async (): Promise<void> => {
    // If user is the owner, they cannot leave the organization
    if (isOrgOwner) {
      setErrorMessage(
        "As the organization owner, you cannot leave. You must first transfer ownership or delete the organization."
      );
      return;
    }

    if (!activeOrganization?._id) {
      setErrorMessage("No active organization found.");
      return;
    }

    try {
      await leaveOrganization({
        organizationId: activeOrganization._id,
      });

      setIsOpen(false);

      // Navigate to home page after leaving
      router.push("/");
      router.refresh();
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Failed to leave organization. Please try again."
      );
      console.error(err);
    }
  };

  // Only show the component if there is an active organization with more than one member
  if (!activeOrganization || !members || members.length <= 1) {
    return null;
  }

  return (
    <Modal open={isOpen} onOpenChange={setIsOpen}>
      <ModalTrigger className="btn text-error-500 hover:bg-error-100 hover:text-error-600">
        Leave organization
      </ModalTrigger>

      <ModalContent>
        <ModalHeading>Leave organization</ModalHeading>

        <div className="space-y-4">
          <ModalDescription>
            Are you sure you want to leave your organization? You will lose
            access to all projects and resources.
          </ModalDescription>

          {isOrgOwner && (
            <div className="bg-warning-100 border-warning-300 rounded-md border p-3">
              <p className="text-warning-800 text-sm font-medium">
                As the organization owner, you cannot leave. You must first
                transfer ownership to another member or delete the organization.
              </p>
            </div>
          )}

          {errorMessage && <p className="text-error-600-400">{errorMessage}</p>}

          <div className="flex justify-end gap-4 mt-6">
            <ModalClose className="btn bg-surface-300">Cancel</ModalClose>
            <button
              type="button"
              className="btn bg-error-500 text-white hover:bg-error-600"
              onClick={handleLeaveOrganization}
              disabled={isOrgOwner}
            >
              Confirm
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
