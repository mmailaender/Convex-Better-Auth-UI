import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Shield, ShieldCheck, Search } from "lucide-react";
import { useIsOwnerOrAdmin } from "@/components/organizations/api/hooks";
import {
  Modal,
  ModalContent,
  ModalTrigger,
  ModalHeading,
  ModalDescription,
  ModalClose,
} from "@/components/primitives/ui/Modal";

type Role =
  | "role_organization_member"
  | "role_organization_admin"
  | "role_organization_owner";

/**
 * Component that displays a list of organization invitations with revoke functionality
 */
export function InvitationsList(): React.ReactNode {
  // State hooks
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [selectedInvitationId, setSelectedInvitationId] =
    useState<Id<"invitations"> | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Check if current user is an owner or admin
  const isOwnerOrAdmin = useIsOwnerOrAdmin();

  // Get invitations data and mutations
  const invitations = useQuery(api.organizations.invitations.db.getInvitations);
  const revokeInvitation = useMutation(
    api.organizations.invitations.db.revokeInvitation
  );

  /**
   * Filter invitations based on search query
   */
  const filteredInvitations = useMemo(() => {
    if (!invitations) return [];

    return invitations
      .filter((invitation) => {
        if (!searchQuery) return true;

        return invitation.email
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        // Sort by role (owner first, then admin, then member)
        const roleOrder: Record<Role, number> = {
          role_organization_owner: 0,
          role_organization_admin: 1,
          role_organization_member: 2,
        };

        // Primary sort by role
        const roleDiff = roleOrder[a.role] - roleOrder[b.role];
        if (roleDiff !== 0) return roleDiff;

        // Secondary sort by email
        return a.email.localeCompare(b.email);
      });
  }, [invitations, searchQuery]);

  /**
   * Handles revoking an invitation
   */
  const handleRevokeInvitation = async (): Promise<void> => {
    if (!selectedInvitationId) return;

    try {
      await revokeInvitation({
        invitationId: selectedInvitationId,
      });

      setErrorMessage("");
      setSuccessMessage("Invitation revoked successfully!");
    } catch (err) {
      setSuccessMessage("");
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Unknown error. Please try again. If it persists, contact support."
      );
    }
  };

  if (!invitations) {
    return <div>Loading invitations...</div>;
  }

  if (invitations.length === 0 && !searchQuery) {
    return (
      <div className="text-surface-600-400 p-8 text-center">
        <p>No pending invitations.</p>
      </div>
    );
  }

  return (
    <div>
      {errorMessage && <p className="text-error-500">{errorMessage}</p>}
      {successMessage && <p className="text-success-500">{successMessage}</p>}

      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="size-4 text-surface-400-600" />
          </div>
          <input
            type="text"
            className="input pl-10 w-full"
            placeholder="Search invitations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredInvitations.length === 0 && searchQuery ? (
        <div className="text-surface-600-400 p-8 text-center">
          <p>No invitations match your search.</p>
        </div>
      ) : (
        <table className="table caption-bottom">
          <thead>
            <tr className="border-surface-300-700 border-b">
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Role</th>
              <th className="p-2 text-left">Invited By</th>
              {isOwnerOrAdmin && <th className="p-2 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredInvitations.map((invitation) => (
              <tr
                key={invitation._id}
                className="border-surface-300-700 border-b"
              >
                <td className="p-2">{invitation.email}</td>
                <td className="p-2">
                  <div className="flex items-center">
                    {invitation.role === "role_organization_owner" ? (
                      <>
                        <ShieldCheck className="text-primary-500 mr-1 size-4" />
                        <span className="font-medium">Owner</span>
                      </>
                    ) : invitation.role === "role_organization_admin" ? (
                      <>
                        <Shield className="text-primary-400 mr-1 size-4" />
                        <span className="font-medium">Admin</span>
                      </>
                    ) : (
                      <span>Member</span>
                    )}
                  </div>
                </td>
                <td className="p-2">{invitation.invitedBy.name}</td>
                <td className="p-2 text-right">
                  {isOwnerOrAdmin && (
                    <Modal>
                      <ModalTrigger
                        className="btn text-error-500 hover:preset-tonal-error-500"
                        onClick={() => setSelectedInvitationId(invitation._id)}
                      >
                        Revoke
                      </ModalTrigger>
                      <ModalContent className="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-(--breakpoint-sm)">
                        <ModalClose />
                        <header className="flex justify-between">
                          <ModalHeading className="h2">
                            Revoke invitation
                          </ModalHeading>
                        </header>
                        <article>
                          <ModalDescription className="opacity-60">
                            Are you sure you want to revoke the invitation sent
                            to {invitation.email}?
                          </ModalDescription>
                        </article>
                        <footer className="flex justify-end gap-4">
                          <ModalClose className="btn preset-tonal">
                            Cancel
                          </ModalClose>
                          <button
                            type="button"
                            className="btn preset-filled-error-400-600"
                            onClick={handleRevokeInvitation}
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
