export interface OptimizeImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  format?: "webp" | "jpeg" | "jpg" | "png";
  forceConvert?: boolean;
}

export async function optimizeImage(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  // Check if we're in a browser environment
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    return optimizeImageBrowser(file, options);
  } else {
    // For server-side, we just return the file as-is
    // Server-side optimization would require a different approach in Next.js
    return optimizeImageServer(file, options);
  }
}

async function optimizeImageBrowser(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 0.8,
    maxSizeKB = 800,
    format = "webp",
    forceConvert = true,
  } = options;

  // Skip resizing but still convert format if file is small enough
  const needsResize = file.size > maxSizeKB * 1024;

  // Skip processing entirely if file is already in target format and small enough
  if (!needsResize && !forceConvert && file.type === `image/${format}`) {
    return file;
  }

  // Create image from file
  const img = document.createElement("img");
  const imgUrl = URL.createObjectURL(file);

  // Wait for image to load
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imgUrl;
  });

  // Calculate new dimensions while maintaining aspect ratio
  let width = img.width;
  let height = img.height;

  if (needsResize && (width > maxWidth || height > maxHeight)) {
    const aspectRatio = width / height;

    if (width > height) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
    } else {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }
  }

  // Create canvas and draw resized image
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get canvas context");
  }

  ctx.drawImage(img, 0, 0, width, height);
  URL.revokeObjectURL(imgUrl); // Clean up

  // Convert to blob with target format and quality
  const mimeType = `image/${format}`;

  // Start with initial quality
  let currentQuality = quality;
  let blob: Blob;

  // Try progressive compression if needed until we get under max size
  do {
    blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob(
        (result) => resolve(result as Blob),
        mimeType,
        currentQuality
      );
    });

    // Reduce quality for next iteration if still too large
    currentQuality *= 0.9;
  } while (needsResize && blob.size > maxSizeKB * 1024 && currentQuality > 0.1);

  // Create new file from blob
  return new File([blob], file.name.replace(/\.[^/.]+$/, `.${format}`), {
    type: mimeType,
  });
}

async function optimizeImageServer(
  file: File,
  options: OptimizeImageOptions = {}
): Promise<File> {
  const {
    maxWidth = 800,
    maxHeight = 800,
    quality = 80, // Sharp uses 1-100 scale instead of 0-1
    maxSizeKB = 800,
    format = "webp",
  } = options;

  // Import sharp dynamically to avoid issues with browser environments
  const sharp = await import("sharp");

  // Convert File to Buffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Process the image
  let sharpInstance = sharp.default(buffer);

  // Get image metadata to calculate resize dimensions
  const metadata = await sharpInstance.metadata();

  // Calculate new dimensions while maintaining aspect ratio
  if (metadata.width && metadata.height) {
    const needsResize =
      file.size > maxSizeKB * 1024 ||
      metadata.width > maxWidth ||
      metadata.height > maxHeight;

    if (needsResize) {
      const aspectRatio = metadata.width / metadata.height;

      let width = metadata.width;
      let height = metadata.height;

      if (width > height) {
        width = Math.min(width, maxWidth);
        height = Math.round(width / aspectRatio);
      } else {
        height = Math.min(height, maxHeight);
        width = Math.round(height * aspectRatio);
      }

      sharpInstance = sharpInstance.resize(width, height);
    }
  }

  // Convert to desired format with quality
  if (format === "webp") {
    sharpInstance = sharpInstance.webp({ quality });
  } else if (format === "jpeg" || format === "jpg") {
    sharpInstance = sharpInstance.jpeg({ quality });
  } else if (format === "png") {
    sharpInstance = sharpInstance.png({ quality });
  }

  // Process and get the buffer
  const outputBuffer = await sharpInstance.toBuffer();

  // Create a new file from the buffer
  return new File(
    [outputBuffer],
    file.name.replace(/\.[^/.]+$/, `.${format}`),
    {
      type: `image/${format}`,
    }
  );
}
