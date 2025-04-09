import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, FileUpload, ProgressRing } from "@skeletonlabs/skeleton-react";
import { UploadCloud } from "lucide-react";
import { optimizeImage } from "@/components/primitives/utils/optimizeImage";

import type { Id } from "@/convex/_generated/dataModel";
import type { FileChangeDetails } from "@zag-js/file-upload";
import { useIsOwnerOrAdmin } from "@/components/organizations/api/hooks";

/**
 * Component that displays organization information and allows editing
 * for users with owner or admin roles
 */
export default function OrganizationInfo() {
  // Always call hooks at the top level of the component
  const user = useQuery(api.users.getUser);
  const activeOrganization = useQuery(api.organizations.getActiveOrganization);
  const isOwnerOrAdmin = useIsOwnerOrAdmin();
  const updateOrganization = useMutation(
    api.organizations.updateOrganizationProfile
  );
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  // Component state - these must be declared before any conditional returns
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [success, setSuccess] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [profileData, setProfileData] = useState<{
    organizationId: Id<"organizations">;
    name: string;
    slug: string;
    logo?: string;
    logoId?: Id<"_storage">;
  }>({
    organizationId: "" as Id<"organizations">,
    name: "",
    slug: "",
    logo: "",
    logoId: undefined,
  });

  // Use useEffect to update profileData when activeOrganization changes
  useEffect(() => {
    if (activeOrganization) {
      setProfileData({
        organizationId: activeOrganization._id,
        name: activeOrganization.name,
        slug: activeOrganization.slug,
        logo: activeOrganization.logo,
        logoId: activeOrganization.logoId,
      });
      setLogoPreview(activeOrganization.logo || "");
    }
  }, [activeOrganization]);

  // If data is not yet loaded, return null (after all hooks)
  if (!user || !activeOrganization) {
    return null;
  }

  /**
   * Toggles edit mode for organization profile
   */
  const toggleEdit = (): void => {
    if (!isOwnerOrAdmin) return;
    setIsEditing(true);
    setSuccess("");
    setError("");
    // Reset logo preview to current logo when entering edit mode
    setLogoPreview(activeOrganization.logo || "");
    setLogoFile(null);
  };

  /**
   * Cancels edit mode without saving changes
   */
  const cancelEdit = (): void => {
    setIsEditing(false);
    setSuccess("");
    setError("");
    setLogoFile(null);
    // Reset logo preview when canceling
    setLogoPreview(activeOrganization.logo || "");
  };

  /**
   * Handles file selection for organization logo but doesn't upload yet
   */
  const handleFileChange = async (
    details: FileChangeDetails
  ): Promise<void> => {
    const file = details.acceptedFiles.at(0);
    if (!file) return;

    try {
      setIsUploading(true);
      setError("");
      setSuccess("");

      // Optimize the image but don't upload yet
      const optimizedFile = await optimizeImage(file, {
        maxWidth: 512,
        maxHeight: 512,
        maxSizeKB: 500,
        quality: 0.85,
        format: "webp",
        forceConvert: true, // Always convert to WebP
      });

      // Store the optimized file for later upload
      setLogoFile(optimizedFile);
      setLogoPreview(URL.createObjectURL(optimizedFile)); // For preview
      setSuccess("Logo ready for upload!");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to process logo: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handles form submission to update organization profile
   */
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    try {
      setIsUploading(true);
      setSuccess("");
      setError("");

      let logoStorageId: Id<"_storage"> | undefined;

      // Upload the new logo if one was selected
      if (logoFile) {
        // Get a storage upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Upload the file to Convex storage
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": logoFile.type,
          },
          body: logoFile,
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        // Get the storage ID from the response
        const result = await response.json();
        logoStorageId = result.storageId as Id<"_storage">;
      } else {
        logoStorageId = profileData.logoId;
      }

      // Call the Convex mutation to update the organization
      await updateOrganization({
        organizationId: profileData.organizationId,
        name: profileData.name,
        slug: profileData.slug,
        logoId: logoStorageId,
      });

      // Update the local state
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
      setError("");
      setLogoFile(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setError(`Failed to update profile: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mb-6 flex items-center gap-4">
      {!isEditing ? (
        <>
          <Avatar
            src={activeOrganization.logo}
            name={activeOrganization.name}
          />
          <span className="text-surface-800-200 font-medium">
            {activeOrganization.name}
          </span>
          {isOwnerOrAdmin && (
            <button onClick={toggleEdit} className="btn">
              Edit
            </button>
          )}
        </>
      ) : (
        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex flex-col gap-4">
            <div className="mb-4">
              <label htmlFor="logo" className="block mb-1 font-medium">
                Logo
              </label>
              <FileUpload
                accept="image/*"
                allowDrop
                maxFiles={1}
                onFileChange={handleFileChange}
              >
                <div className="group relative cursor-pointer border-2 border-dashed border-surface-600-400 rounded-md flex flex-col items-center justify-center gap-2 hover:bg-surface-50-950 transition-colors p-4">
                  {isUploading ? (
                    <ProgressRing
                      value={null}
                      size="size-14"
                      meterStroke="stroke-primary-600-400"
                      trackStroke="stroke-primary-50-950"
                    />
                  ) : (
                    <>
                      <Avatar
                        src={logoPreview}
                        name={
                          profileData.name.length > 0
                            ? profileData.name
                            : "Organization"
                        }
                        size="size-16"
                      />
                      <div className="absolute inset-0 flex items-center justify-center rounded-md bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                        <UploadCloud className="size-6 text-white" />
                      </div>
                    </>
                  )}
                </div>
              </FileUpload>
            </div>

            <label htmlFor="name">Name</label>
            <input
              type="text"
              name="name"
              className="input"
              value={profileData.name}
              onChange={(e) =>
                setProfileData({ ...profileData, name: e.target.value })
              }
            />
            <label htmlFor="slug">Slug URL</label>
            <input
              type="text"
              name="slug"
              className="input"
              value={profileData.slug}
              onChange={(e) =>
                setProfileData({ ...profileData, slug: e.target.value })
              }
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="preset-filled-primary-500 btn"
                disabled={isUploading}
              >
                Save
              </button>
              <button
                type="button"
                className="btn hover:preset-tonal"
                onClick={cancelEdit}
                disabled={isUploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      {success && <p className="text-success-600-400">{success}</p>}
      {error && <p className="text-error-600-400">{error}</p>}
    </div>
  );
}
