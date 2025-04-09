import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Shield, ShieldCheck } from "lucide-react";
import { useIsOwnerOrAdmin } from "@/components/organizations/api/hooks";
import {
  Modal,
  ModalContent,
  ModalTrigger,
  ModalHeading,
  ModalDescription,
  ModalClose,
} from "@/components/primitives/ui/Modal";
import { Avatar } from "@skeletonlabs/skeleton-react";

type Role =
  | "role_organization_member"
  | "role_organization_admin"
  | "role_organization_owner";

/**
 * Component that displays a list of organization members with role management functionality
 */
export function MembersList(): React.ReactNode {
  // State hooks
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [selectedUserId, setSelectedUserId] = useState<Id<"users"> | null>(
    null
  );

  // Get current user and organization data
  const currentUser = useQuery(api.organizations.getActiveOrganization);
  const isOwnerOrAdmin = useIsOwnerOrAdmin();

  // Get members data and mutations
  const members = useQuery(api.organizations.members.getOrganizationMembers);
  const updateMemberRole = useMutation(
    api.organizations.members.updateMemberRole
  );
  const removeMember = useMutation(api.organizations.members.removeMember);

  /**
   * Handles updating a member's role
   */
  const handleUpdateRole = async (
    userId: Id<"users">,
    newRole: Role
  ): Promise<void> => {
    if (newRole === "role_organization_owner") return; // Cannot set someone as owner this way

    try {
      await updateMemberRole({
        userId,
        newRole,
      });

      setErrorMessage("");
      setSuccessMessage("Role updated successfully!");
    } catch (err) {
      setSuccessMessage("");
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to update role"
      );
      console.error(err);
    }
  };

  /**
   * Handles removing a member from the organization
   */
  const handleRemoveMember = async (): Promise<void> => {
    if (!selectedUserId) return;

    try {
      await removeMember({
        userId: selectedUserId,
      });

      setErrorMessage("");
      setSuccessMessage("Member removed successfully!");
    } catch (err) {
      setSuccessMessage("");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unknown error. Please try again. If it persists, contact support."
      );
    }
  };

  if (!members) {
    return <div>Loading members...</div>;
  }

  return (
    <div>
      {errorMessage && <p className="text-error-500">{errorMessage}</p>}
      {successMessage && <p className="text-success-500">{successMessage}</p>}
      <table className="table caption-bottom">
        <thead>
          <tr className="border-surface-300-700 border-b">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Email</th>
            <th className="p-2 text-left">Role</th>
            {isOwnerOrAdmin && <th className="p-2 text-right">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member._id}>
              <td>
                <div className="flex items-center space-x-4">
                  <div className="avatar">
                    <div className="size-12">
                      {member.user.image ? (
                        <Avatar
                          src={member.user.image}
                          name={member.user.name}
                          size="size-12"
                        />
                      ) : (
                        <div className="flex items-center justify-center bg-primary-100 h-full w-full rounded-full text-primary-700">
                          {member.user.name?.charAt(0) || "U"}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="font-semibold">{member.user.name}</span>
                </div>
              </td>
              <td>{member.user.email}</td>
              <td>
                <div className="flex items-center">
                  {isOwnerOrAdmin &&
                  currentUser &&
                  member.user.id.toString() !== currentUser._id.toString() &&
                  member.role !== "role_organization_owner" ? (
                    <select
                      value={member.role}
                      onChange={(e) =>
                        handleUpdateRole(member.user.id, e.target.value as Role)
                      }
                      className="select"
                    >
                      <option value="role_organization_admin">Admin</option>
                      <option value="role_organization_member">Member</option>
                    </select>
                  ) : member.role === "role_organization_owner" ? (
                    <>
                      <ShieldCheck className="text-primary-500 mr-1 size-4" />
                      <span className="font-medium">Owner</span>
                    </>
                  ) : member.role === "role_organization_admin" ? (
                    <>
                      <Shield className="text-primary-400 mr-1 size-4" />
                      <span className="font-medium">Admin</span>
                    </>
                  ) : (
                    <span>Member</span>
                  )}
                </div>
              </td>
              <td>
                <div className="flex space-x-2 justify-end">
                  {isOwnerOrAdmin &&
                    currentUser &&
                    member.user.id.toString() !== currentUser._id.toString() &&
                    member.role !== "role_organization_owner" && (
                      <Modal>
                        <ModalTrigger
                          className="btn text-error-500 hover:preset-tonal-error-500"
                          onClick={() => setSelectedUserId(member.user.id)}
                        >
                          Remove
                        </ModalTrigger>
                        <ModalContent className="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-(--breakpoint-sm)">
                          <ModalClose />
                          <header className="flex justify-between">
                            <ModalHeading className="h2">
                              Remove member
                            </ModalHeading>
                          </header>
                          <article>
                            <ModalDescription className="opacity-60">
                              Are you sure you want to remove the member{" "}
                              {member.user.name}?
                            </ModalDescription>
                          </article>
                          <footer className="flex justify-end gap-4">
                            <ModalClose className="btn preset-tonal">
                              Cancel
                            </ModalClose>
                            <button
                              type="button"
                              className="btn preset-filled-error-400-600"
                              onClick={handleRemoveMember}
                            >
                              Confirm
                            </button>
                          </footer>
                          {errorMessage && (
                            <p className="text-error-600-400">{errorMessage}</p>
                          )}
                        </ModalContent>
                      </Modal>
                    )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
