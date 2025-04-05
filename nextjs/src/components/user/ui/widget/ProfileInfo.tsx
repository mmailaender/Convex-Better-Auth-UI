import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { optimizeImage } from "@/components/primitives/utils/optimizeImage";
import { UploadCloud } from "lucide-react";
import { Avatar, FileUpload } from "@skeletonlabs/skeleton-react";

import type { Id } from "@/convex/_generated/dataModel";
import { type FileChangeDetails } from "@zag-js/file-upload";

export default function ProfileInfo() {
  // Get user data from Convex
  const user = useQuery(api.user.getUser);
  const generateUploadUrl = useMutation(api.user.generateUploadUrl);
  const updateUserName = useMutation(api.user.updateUserName);
  const updateAvatar = useMutation(api.user.updateAvatar);

  // Component state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [name, setName] = useState<string>("");

  if (user && name === "") {
    setName(user.name);
  }

  // Handle toggling edit mode
  const toggleEdit = (): void => {
    setIsEditing(true);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // Handle canceling edit
  const cancelEdit = (): void => {
    setIsEditing(false);
    setSuccessMessage("");
    setErrorMessage("");
  };

  // Handle form submission to update profile
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    try {
      await updateUserName({
        name,
      });

      setIsEditing(false);
      setSuccessMessage("Profile updated successfully!");
    } catch (err: any) {
      setErrorMessage(`Failed to update profile: ${err.message}`);
    }
  };

  // Handle file upload for avatar
  const handleFileChange = async (
    details: FileChangeDetails
  ): Promise<void> => {
    const file = details.acceptedFiles.at(0);
    if (!file) return;

    try {
      setIsUploading(true);
      setErrorMessage("");
      setSuccessMessage("");

      // Optimize the image before upload
      const optimizedFile = await optimizeImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        maxSizeKB: 500,
        quality: 0.85,
        format: "webp",
        forceConvert: true, // Always convert to WebP
      });

      // Get a storage upload URL from Convex
      const uploadUrl = await generateUploadUrl();

      // Upload the file to Convex storage
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: {
          "Content-Type": optimizedFile.type,
        },
        body: optimizedFile,
      });

      if (!response.ok) {
        throw new Error("Failed to upload file");
      }

      // Get the storage ID from the response
      const result = await response.json();
      const storageId = result.storageId as Id<"_storage">;

      // Update the user's avatar with the storage ID
      await updateAvatar({
        storageId,
      });

      setSuccessMessage("Avatar updated successfully!");
    } catch (err: any) {
      setErrorMessage(`Failed to upload avatar: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Return loading state if user data is not yet available
  if (!user) {
    return (
      <div className="animate-pulse h-16 w-full bg-gray-200 rounded-md"></div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        <div className="relative">
          <FileUpload
            accept="image/*"
            allowDrop
            maxFiles={1}
            onFileChange={handleFileChange}
          >
            <div className="group relative cursor-pointer">
              <Avatar src={user.image || ""} name={user.name} size="size-16" />
              <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                <UploadCloud className="size-6 text-white" />
              </div>
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50">
                  <div className="border-primary-500 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
                </div>
              )}
            </div>
          </FileUpload>
        </div>

        {!isEditing ? (
          <button onClick={toggleEdit} className="flex flex-col">
            <span className="text-surface-800-200 text-lg font-medium">
              {user.name}
            </span>
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="w-full">
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn preset-filled-primary-500">
                  Save
                </button>
                <button
                  type="button"
                  className="btn preset-tonal"
                  onClick={cancelEdit}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

      {successMessage && (
        <p className="text-success-600-400 mt-2">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="text-error-600-400 mt-2">{errorMessage}</p>
      )}
    </div>
  );
}
