import {
  Modal,
  ModalContent,
  ModalTrigger,
} from "@/components/primitives/ui/Modal";
import { useState } from "react";

export default function DeleteUser() {
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  return (
    <Modal
      open={deleteConfirmationOpen}
      onOpenChange={setDeleteConfirmationOpen}
    >
      <ModalTrigger className="btn text-error-500 hover:preset-tonal-error-500">
        Delete account
      </ModalTrigger>
      <ModalContent>
        <h2 className="h2">Delete your account</h2>
      </ModalContent>
    </Modal>
  );
}
