let isDraggingFile = $state(false);
let dragCounter = 0;

const handleDragEnter = (e: DragEvent) => {
	e.preventDefault();
	dragCounter++;
	if (e.dataTransfer?.types.includes('Files')) {
		isDraggingFile = true;
	}
};

const handleDragLeave = (e: DragEvent) => {
	e.preventDefault();
	dragCounter--;
	if (dragCounter === 0) {
		isDraggingFile = false;
	}
};

const handleDragOver = (e: DragEvent) => {
	e.preventDefault();
};

const handleDrop = () => {
	dragCounter = 0;
	isDraggingFile = false;
};

const handleDragEnd = () => {
	dragCounter = 0;
	isDraggingFile = false;
};

// Initialize listeners once when first imported
if (typeof document !== 'undefined') {
	document.addEventListener('dragenter', handleDragEnter);
	document.addEventListener('dragleave', handleDragLeave);
	document.addEventListener('dragover', handleDragOver);
	document.addEventListener('drop', handleDrop);
	document.addEventListener('dragend', handleDragEnd);
}

export function createDragState() {
	return {
		get isDragging() {
			return isDraggingFile;
		},
		resetDragState() {
			dragCounter = 0;
			isDraggingFile = false;
		}
	};
}
