'use client';

import {
	createContext,
	useContext,
	useEffect,
	useId,
	useMemo,
	useRef,
	useCallback,
	useState,
	type ReactNode
} from 'react';
import EasyCropper, { type Area, type Point } from 'react-easy-crop';

import * as DialogPrimitive from '@/components/primitives/ui/dialog';
import { cn } from '@/lib/utils';

export const VALID_IMAGE_TYPES = [
	'image/apng',
	'image/avif',
	'image/gif',
	'image/jpeg',
	'image/png',
	'image/svg+xml',
	'image/webp'
] as const;

export const getFileFromUrl = async (url: string, fileName = 'cropped.png'): Promise<File> => {
	const response = await fetch(url);

	if (!response.ok) {
		throw new Error(`Failed to fetch resource: ${response.status} ${response.statusText}`);
	}

	const blob = await response.blob();
	return new File([blob], fileName, { type: blob.type });
};

const createImage = (url: string): Promise<HTMLImageElement> =>
	new Promise((resolve, reject) => {
		const image = new Image();
		image.addEventListener('load', () => resolve(image));
		image.addEventListener('error', (error) => reject(error));
		image.setAttribute('crossOrigin', 'anonymous');
		image.src = url;
	});

const getRadianAngle = (degreeValue: number) => (degreeValue * Math.PI) / 180;

export const getCroppedImg = async (
	imageSrc: string,
	pixelCrop: Area,
	rotation = 0
): Promise<string> => {
	const image = await createImage(imageSrc);
	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d');

	if (!ctx) {
		throw new Error('Error getting 2d rendering context');
	}

	const maxSize = Math.max(image.width, image.height);
	const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2));

	canvas.width = safeArea;
	canvas.height = safeArea;

	ctx.translate(safeArea / 2, safeArea / 2);
	ctx.rotate(getRadianAngle(rotation));
	ctx.translate(-safeArea / 2, -safeArea / 2);

	ctx.drawImage(image, safeArea / 2 - image.width * 0.5, safeArea / 2 - image.height * 0.5);
	const data = ctx.getImageData(0, 0, safeArea, safeArea);

	canvas.width = pixelCrop.width;
	canvas.height = pixelCrop.height;

	ctx.putImageData(
		data,
		Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
		Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
	);

	return new Promise((resolve, reject) => {
		canvas.toBlob((file) => {
			if (!file) {
				reject(new Error('Failed to create cropped image.'));
				return;
			}
			resolve(URL.createObjectURL(file));
		}, 'image/png');
	});
};

type ImageCropperContextValue = {
	accept: string;
	inputId: string;
	open: boolean;
	tempUrl?: string;
	setOpen: (value: boolean) => void;
	handleUpload: (file: File) => void;
	handleCancel: () => void;
	handleCrop: () => Promise<void>;
	setPixelCrop: (value?: Area) => void;
};

const ImageCropperContext = createContext<ImageCropperContextValue | null>(null);

function useImageCropperContext() {
	const context = useContext(ImageCropperContext);
	if (!context) {
		throw new Error('ImageCropper components must be used inside ImageCropper.Root.');
	}
	return context;
}

export function Root({
	children,
	src,
	onSrcChange,
	accept = 'image/*',
	onCropped,
	onUnsupportedFile
}: {
	children: ReactNode;
	src: string;
	onSrcChange: (value: string) => void;
	accept?: string;
	onCropped: (url: string) => void | Promise<void>;
	onUnsupportedFile?: (file: File) => void;
}) {
	const inputId = useId();
	const createdUrlsRef = useRef<string[]>([]);
	const [open, setOpen] = useState(false);
	const [tempUrl, setTempUrl] = useState<string>();
	const [pixelCrop, setPixelCrop] = useState<Area>();
	const disposedRef = useRef(false);
	void src;

	useEffect(() => {
		disposedRef.current = false;
		const createdUrls = createdUrlsRef.current;
		return () => {
			disposedRef.current = true;
			for (const url of createdUrls) {
				URL.revokeObjectURL(url);
			}
		};
	}, []);

	const handleCancel = useCallback(() => {
		setTempUrl(undefined);
		setPixelCrop(undefined);
		setOpen(false);
	}, []);

	const handleUpload = useCallback(
		(file: File) => {
			if (!VALID_IMAGE_TYPES.includes(file.type as (typeof VALID_IMAGE_TYPES)[number])) {
				onUnsupportedFile?.(file);
				return;
			}

			const nextTempUrl = URL.createObjectURL(file);
			createdUrlsRef.current.push(nextTempUrl);
			setTempUrl(nextTempUrl);
			setOpen(true);
		},
		[onUnsupportedFile]
	);

	const handleCrop = useCallback(async () => {
		if (!pixelCrop || !tempUrl) return;

		const croppedUrl = await getCroppedImg(tempUrl, pixelCrop);
		/* A crop answers to the callback of the moment it was confirmed, and to nothing once the
		   cropper is gone, so a caller that binds the callback to what it crops for never has a crop
		   land on something else. */
		if (disposedRef.current) {
			URL.revokeObjectURL(croppedUrl);
			return;
		}
		createdUrlsRef.current.push(croppedUrl);
		onSrcChange(croppedUrl);
		setOpen(false);
		await onCropped(croppedUrl);
	}, [onCropped, onSrcChange, pixelCrop, tempUrl]);

	const contextValue = useMemo<ImageCropperContextValue>(
		() => ({
			accept,
			inputId,
			open,
			tempUrl,
			setOpen,
			handleUpload,
			handleCancel,
			handleCrop,
			setPixelCrop
		}),
		[accept, handleCancel, handleCrop, handleUpload, inputId, open, tempUrl]
	);

	return (
		<ImageCropperContext.Provider value={contextValue}>{children}</ImageCropperContext.Provider>
	);
}

export function UploadTrigger({ children, className, ...props }: React.ComponentProps<'label'>) {
	const { accept, inputId, handleUpload } = useImageCropperContext();

	return (
		<label className={className} {...props}>
			<input
				id={inputId}
				type="file"
				accept={accept}
				className="sr-only"
				onChange={(event) => {
					const file = event.currentTarget.files?.[0];
					event.currentTarget.value = '';
					if (file) handleUpload(file);
				}}
			/>
			{children}
		</label>
	);
}

export function DialogContent({
	children,
	className
}: {
	children: ReactNode;
	className?: string;
}) {
	const { open, setOpen, handleCancel } = useImageCropperContext();

	return (
		<DialogPrimitive.Root
			open={open}
			onOpenChange={(nextOpen: boolean) => {
				setOpen(nextOpen);
				if (!nextOpen) handleCancel();
			}}
		>
			<DialogPrimitive.Content
				className={cn('max-h-[85vh] min-h-96 max-w-full p-4 sm:max-w-md sm:p-5', className)}
			>
				<div className="flex min-h-0 w-full flex-1 flex-col gap-4">{children}</div>
			</DialogPrimitive.Content>
		</DialogPrimitive.Root>
	);
}

export const Dialog = DialogContent;

export function Cropper({
	cropShape = 'round',
	aspect = 1,
	showGrid = false
}: {
	cropShape?: 'rect' | 'round';
	aspect?: number;
	showGrid?: boolean;
}) {
	const { tempUrl, setPixelCrop } = useImageCropperContext();
	const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);

	useEffect(() => {
		setCrop({ x: 0, y: 0 });
		setZoom(1);
	}, [tempUrl]);

	if (!tempUrl) return null;

	return (
		<div className="flex min-h-0 w-full flex-1 items-center justify-center">
			<div className="rounded-container ring-surface-300-700 bg-surface-200-800 relative aspect-square w-full max-w-md overflow-hidden ring-1">
				<EasyCropper
					image={tempUrl}
					crop={crop}
					zoom={zoom}
					aspect={aspect}
					cropShape={cropShape}
					showGrid={showGrid}
					onCropChange={setCrop}
					onZoomChange={setZoom}
					onCropComplete={(_, croppedAreaPixels) => setPixelCrop(croppedAreaPixels)}
				/>
			</div>
		</div>
	);
}

export function Controls({ children, className }: { children: ReactNode; className?: string }) {
	return (
		<div className={cn('flex w-full items-center justify-end gap-2 pt-3', className)}>
			{children}
		</div>
	);
}

export function Cancel({
	children = 'Cancel',
	className,
	...props
}: React.ComponentProps<'button'>) {
	const { handleCancel } = useImageCropperContext();

	return (
		<button
			type="button"
			className={cn('btn preset-tonal', className)}
			onClick={handleCancel}
			{...props}
		>
			{children}
		</button>
	);
}

export function Crop({ children = 'Crop', className, ...props }: React.ComponentProps<'button'>) {
	const { handleCrop } = useImageCropperContext();

	return (
		<button
			type="button"
			className={cn('btn preset-filled-primary-500', className)}
			onClick={() => void handleCrop()}
			{...props}
		>
			{children}
		</button>
	);
}
