import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
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
 * If the user is the owner, they must select a successor before leaving
 */
export default function LeaveOrganization(): React.ReactNode {
  // State hooks
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [selectedSuccessor, setSelectedSuccessor] =
    useState<Id<"users"> | null>(null);

  // Convex queries and mutations
  const activeOrganization = useQuery(api.organizations.getActiveOrganization);
  const members = useQuery(api.organizations.members.getOrganizationMembers);
  const user = useQuery(api.users.getUser);
  const leaveOrganization = useMutation(
    api.organizations.members.leaveOrganization
  );

  // Navigation
  const router = useRouter();

  // Check if user is an organization owner
  const isOrgOwner = useIsOwner();

  // Get organization members excluding current user for successor selection
  const organizationMembers =
    members?.filter(
      (member) =>
        // Don't include the current user
        member.user.id !== user?._id
    ) || [];

  /**
   * Validates form input before submission
   */
  const validateForm = (): boolean => {
    if (isOrgOwner && !selectedSuccessor) {
      setErrorMessage(
        "As the organization owner, you must select a successor before leaving."
      );
      return false;
    }
    return true;
  };

  /**
   * Handles the leave organization action
   */
  const handleLeaveOrganization = async (): Promise<void> => {
    if (!validateForm()) return;

    if (!activeOrganization?._id) {
      setErrorMessage("No active organization found.");
      return;
    }

    try {
      await leaveOrganization({
        organizationId: activeOrganization._id,
        // Only send successorId if the user is an owner and a successor is selected
        ...(isOrgOwner && selectedSuccessor
          ? { successorId: selectedSuccessor }
          : {}),
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
            <>
              <div className="bg-warning-100 border-warning-300 rounded-md border p-3">
                <p className="text-warning-800 text-sm font-medium">
                  As the organization owner, you must designate a successor
                  before leaving.
                </p>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="successor"
                  className="text-surface-800-200 font-medium"
                >
                  Select a successor:
                </label>
                <select
                  id="successor"
                  value={selectedSuccessor?.toString() || ""}
                  onChange={(e) =>
                    setSelectedSuccessor(
                      e.target.value ? (e.target.value as Id<"users">) : null
                    )
                  }
                  className="select w-full"
                  required={isOrgOwner}
                >
                  <option value="" disabled>
                    Choose a successor
                  </option>
                  {organizationMembers.map((member) => (
                    <option
                      key={member.user.id.toString()}
                      value={member.user.id.toString()}
                    >
                      {member.user.name} ({member.user.email})
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {errorMessage && <p className="text-error-600-400">{errorMessage}</p>}

          <div className="flex justify-end gap-4 mt-6">
            <ModalClose className="btn bg-surface-300">Cancel</ModalClose>
            <button
              type="button"
              className="btn bg-error-500 text-white hover:bg-error-600"
              onClick={handleLeaveOrganization}
              disabled={isOrgOwner && !selectedSuccessor}
            >
              Confirm
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
