import { useState } from "react";
import { useRouter } from "next/router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Modal,
  ModalTrigger,
  ModalContent,
  ModalHeading,
  ModalClose,
} from "@/components/primitives/ui/Modal";

import { useIsOwner } from "@/components/organizations/api/hooks";

/**
 * Component for deleting an organization
 * Only available to organization owners
 */
export default function DeleteOrganization() {
  const router = useRouter();
  const [open, setOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const activeOrganization = useQuery(api.organizations.getActiveOrganization);
  const isOwner = useIsOwner();

  const deleteOrganization = useMutation(api.organizations.deleteOrganization);

  if (!activeOrganization) {
    return null;
  }

  const handleConfirm = async (): Promise<void> => {
    try {
      await deleteOrganization({ organizationId: activeOrganization._id });
      setOpen(false);
      // Navigate to home and force a refresh
      router.push("/");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(
          "Unknown error. Please try again. If it persists, contact support."
        );
      }
    }
  };

  const handleCancel = (): void => {
    setOpen(false);
  };

  // If user is not an owner, don't render anything
  if (!isOwner) {
    return null;
  }

  return (
    <Modal open={open} onOpenChange={(open) => setOpen(open)}>
      <ModalTrigger className="btn text-error-500 hover:preset-tonal-error-500">
        Delete organization
      </ModalTrigger>

      <ModalContent>
        <ModalClose />
        <ModalHeading className="h2">Delete organization</ModalHeading>

        <article>
          <p className="opacity-60">
            Are you sure you want to delete the organization{" "}
            {activeOrganization.name}? All organization data will be permanently
            deleted.
          </p>
        </article>

        <footer className="flex justify-end gap-4 mt-4">
          <button
            type="button"
            className="btn preset-tonal"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn preset-filled-error-500"
            onClick={handleConfirm}
          >
            Confirm
          </button>
        </footer>

        {error && <p className="text-error-600-400 mt-2">{error}</p>}
      </ModalContent>
    </Modal>
  );
}
