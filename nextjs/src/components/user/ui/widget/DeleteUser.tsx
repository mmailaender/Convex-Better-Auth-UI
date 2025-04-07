import {
  Modal,
  ModalContent,
  ModalTrigger,
} from "@/components/primitives/ui/Modal";
import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";

export default function DeleteUser() {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const deleteMutation = useAction(api.user.invalidateAndDeleteUser);
  const { signOut } = useAuthActions();
  // const router = useRouter();

  async function handleConfirm() {
    try {
      await deleteMutation();
      await signOut();
      // Redirect to login page
      // router.push("/login");
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
      <ModalTrigger className="btn text-error-500 hover:preset-tonal-error-500">
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
