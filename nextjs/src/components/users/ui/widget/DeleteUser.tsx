import {
  Modal,
  ModalContent,
  ModalTrigger,
} from "@/components/primitives/ui/Modal";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

export default function DeleteUser() {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const deleteMutation = useAction(api.users.invalidateAndDeleteUser);
  const { signOut } = useAuthActions();

  async function handleConfirm() {
    try {
      await deleteMutation();
      await signOut();
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  }

  function handleCancel() {
    setDeleteConfirmationOpen(false);
  }

  return (
    <Modal
      open={deleteConfirmationOpen}
      onOpenChange={setDeleteConfirmationOpen}
    >
      <ModalTrigger className="btn preset-faded-surface-50-950 justify-between hover:bg-error-200-800 hover:text-error-950-50 gap-1 text-sm h-10 w-full">
        Delete account
      </ModalTrigger>
      <ModalContent>
        <header className="flex justify-between">
          <h2 className="h2">Delete your account</h2>
        </header>
        <article>
          <p className="opacity-60">
            Are you sure you want to delete your account? All of your data will
            be permanently deleted.
          </p>
        </article>
        <footer className="flex justify-end gap-4">
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
      </ModalContent>
    </Modal>
  );
}
