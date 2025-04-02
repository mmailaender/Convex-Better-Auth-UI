export interface OptimizeImageOptions {
	maxWidth?: number;
	maxHeight?: number;
	quality?: number;
	maxSizeKB?: number;
	format?: 'jpeg' | 'png' | 'webp';
	forceConvert?: boolean;
}
