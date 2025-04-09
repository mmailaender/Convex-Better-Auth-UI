import { useState, useImperativeHandle, forwardRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { optimizeImage } from "@/components/primitives/utils/optimizeImage";
import { UploadCloud } from "lucide-react";
import { Avatar, FileUpload, ProgressRing } from "@skeletonlabs/skeleton-react";

import type { Id } from "@/convex/_generated/dataModel";
import type { FileChangeDetails } from "@zag-js/file-upload";

export interface ImageUploadOptions {
  maxWidth?: number;
  maxHeight?: number;
  maxSizeKB?: number;
  quality?: number;
  format?: "webp" | "jpeg" | "png";
  forceConvert?: boolean;
}

export interface ImageUploaderProps {
  /**
   * Current image URL for preview
   */
  currentImageUrl?: string;

  /**
   * Display name to use for the avatar when there's no image
   */
  displayName?: string;

  /**
   * Whether to upload immediately on file selection
   */
  uploadImmediate?: boolean;

  /**
   * Image optimization options
   */
  optimizationOptions?: ImageUploadOptions;

  /**
   * Callback when a file is selected but not yet uploaded (only used when uploadImmediate is false)
   */
  onFileSelected?: (file: File, previewUrl: string) => void;

  /**
   * Callback when upload is successful
   */
  onUploadSuccess?: (storageId: Id<"_storage">) => Promise<void> | void;

  /**
   * Callback when an error occurs
   */
  onError?: (message: string) => void;

  /**
   * Avatar size class
   */
  avatarSize?: string;

  /**
   * Progress ring size class
   */
  progressRingSize?: string;

  /**
   * Additional CSS classes for the container
   */
  className?: string;
}

/**
 * Methods that can be accessed via ref
 */
export interface ImageUploaderRef {
  /**
   * Upload the currently selected file
   */
  upload: () => Promise<void>;
}

/**
 * Reusable component for image uploads with preview and optimization
 */
const ImageUploader = forwardRef<ImageUploaderRef, ImageUploaderProps>(
  function ImageUploader(
    {
      currentImageUrl = "",
      displayName = "",
      uploadImmediate = false,
      optimizationOptions = {
        maxWidth: 512,
        maxHeight: 512,
        maxSizeKB: 500,
        quality: 0.85,
        format: "webp",
        forceConvert: true,
      },
      onFileSelected,
      onUploadSuccess,
      onError,
      avatarSize = "size-16",
      progressRingSize = "size-14",
      className = "",
    },
    ref
  ) {
    // Mutations
    const generateUploadUrl = useMutation(api.storage.generateUploadUrl);

    // Component state
    const [isUploading, setIsUploading] = useState<boolean>(false);
    const [previewUrl, setPreviewUrl] = useState<string>(currentImageUrl);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    /**
     * Uploads an image to Convex storage
     */
    const uploadImage = async (file: File): Promise<void> => {
      try {
        setIsUploading(true);

        // Get a storage upload URL from Convex
        const uploadUrl = await generateUploadUrl();

        // Upload the file to Convex storage
        const response = await fetch(uploadUrl, {
          method: "POST",
          headers: {
            "Content-Type": file.type,
          },
          body: file,
        });

        if (!response.ok) {
          throw new Error("Failed to upload file");
        }

        // Get the storage ID from the response
        const result = await response.json();
        const storageId = result.storageId as Id<"_storage">;

        // Call the success callback with the storage ID
        if (onUploadSuccess) {
          await onUploadSuccess(storageId);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        if (onError) {
          onError(`Failed to upload image: ${errorMessage}`);
        }
      } finally {
        setIsUploading(false);
      }
    };

    /**
     * Handles file selection and optional immediate upload
     */
    const handleFileChange = async (
      details: FileChangeDetails
    ): Promise<void> => {
      const file = details.acceptedFiles.at(0);
      if (!file) return;

      try {
        setIsUploading(true);

        // Optimize the image
        const optimizedFile = await optimizeImage(file, optimizationOptions);

        // Create a preview URL
        const objectUrl = URL.createObjectURL(optimizedFile);
        setPreviewUrl(objectUrl);
        setSelectedFile(optimizedFile);

        // If immediate upload is enabled, upload the file now
        if (uploadImmediate) {
          await uploadImage(optimizedFile);
        } else if (onFileSelected) {
          // Otherwise notify the parent component
          onFileSelected(optimizedFile, objectUrl);
        }
      } catch (err: unknown) {
        const errorMessage =
          err instanceof Error ? err.message : "An unknown error occurred";
        if (onError) {
          onError(`Failed to process image: ${errorMessage}`);
        }
      } finally {
        setIsUploading(false);
      }
    };

    /**
     * Public method to trigger upload of the selected file
     * This can be called by the parent component using a ref
     */
    const upload = async (): Promise<void> => {
      if (!selectedFile) {
        if (onError) {
          onError("No file selected for upload");
        }
        return;
      }

      await uploadImage(selectedFile);
    };

    // Expose methods to parent component via ref
    useImperativeHandle(ref, () => ({
      upload,
    }));

    return (
      <FileUpload
        accept="image/*"
        allowDrop
        maxFiles={1}
        onFileChange={handleFileChange}
      >
        <div className={`group relative cursor-pointer ${className}`}>
          <Avatar src={previewUrl} name={displayName} size={avatarSize} />
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <UploadCloud className="size-6 text-white" />
          </div>
          {isUploading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <ProgressRing
                value={null}
                size={progressRingSize}
                meterStroke="stroke-primary-600-400"
                trackStroke="stroke-primary-50-950"
              />
            </div>
          )}
        </div>
      </FileUpload>
    );
  }
);

export default ImageUploader;
