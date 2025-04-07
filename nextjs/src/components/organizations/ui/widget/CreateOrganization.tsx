import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { optimizeImage } from "@/components/primitives/utils/optimizeImage";
import { UploadCloud } from "lucide-react";
import { Avatar, FileUpload, ProgressRing } from "@skeletonlabs/skeleton-react";

import type { Id } from "@/convex/_generated/dataModel";
import type { FileChangeDetails } from "@zag-js/file-upload";

/**
 * Component for creating a new organization with logo upload support
 */
export default function CreateOrganization({
  onSuccessfulCreate,
  redirectTo,
}: {
  /**
   * Optional callback that will be called when an organization is successfully created
   */
  onSuccessfulCreate?: () => void;
  /**
   * Optional redirect URL after successful creation
   */
  redirectTo?: string;
}) {
  const router = useRouter();

  // Mutations
  const createOrganization = useMutation(api.organizations.createOrganization);
  const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

  // Component state
  const [name, setName] = useState<string>("");
  const [slug, setSlug] = useState<string>("");
  const [logo, setLogo] = useState<string>("");
  const [logoStorageId, setLogoStorageId] = useState<
    Id<"_storage"> | undefined
  >(undefined);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  /**
   * Generates a URL-friendly slug from the provided input string
   */
  const generateSlug = (input: string): string => {
    return input.toLowerCase().replace(/\s+/g, "-");
  };

  /**
   * Updates the name state and automatically generates a slug
   */
  const handleNameInput = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const input = event.target.value;
    setName(input);
    setSlug(generateSlug(input));
  };

  /**
   * Handles file upload for organization logo
   */
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

      // Save the storage ID for later use when creating the organization
      setLogoStorageId(storageId);
      setLogo(URL.createObjectURL(optimizedFile)); // For preview
      setSuccessMessage("Logo uploaded successfully!");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setErrorMessage(`Failed to upload logo: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handles form submission to create a new organization
   */
  const handleSubmit = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!name || !slug) {
      setErrorMessage("Name and slug are required");
      return;
    }

    try {
      // Create the organization with Convex
      await createOrganization({
        name,
        slug,
        logoId: logoStorageId,
      });

      setSuccessMessage("Organization created successfully!");

      // Call the onSuccessfulCreate callback if provided
      if (onSuccessfulCreate) {
        onSuccessfulCreate();
      }

      // Navigate to the home page
      if (redirectTo) {
        router.push(redirectTo);
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An unknown error occurred";
      setErrorMessage(`Failed to create organization: ${errorMessage}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <h2 className="mb-4 text-2xl font-bold">Create Organization</h2>

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
          <div className="group relative cursor-pointer border-2 border-dashed border-surface-600-400 rounded-md flex flex-col items-center justify-center gap-2 hover:bg-surface-50-950 transition-colors">
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
                  src={logo}
                  name={name.length > 0 ? name : "My Organization"}
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

      <div className="mb-4">
        <label htmlFor="name" className="block mb-1 font-medium">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={handleNameInput}
          required
          className="input w-full"
          placeholder="My Organization"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="slug" className="block mb-1 font-medium">
          Slug URL
        </label>
        <input
          type="text"
          id="slug"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          required
          className="input w-full"
          placeholder="my-organization"
        />
      </div>

      <button type="submit" className="btn preset-filled-primary-500 w-full">
        Create Organization
      </button>

      {successMessage && (
        <p className="text-success-600-400 mt-2">{successMessage}</p>
      )}
      {errorMessage && (
        <p className="text-error-600-400 mt-2">{errorMessage}</p>
      )}
    </form>
  );
}
