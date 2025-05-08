import * as React from 'react';
import {
	useFloating,
	useClick,
	useDismiss,
	useRole,
	useInteractions,
	useMergeRefs,
	FloatingPortal,
	FloatingFocusManager,
	FloatingOverlay,
	useId,
	useTransitionStyles
} from '@floating-ui/react';
import { X } from 'lucide-react';

// Create a context to track modal nesting level
const ModalNestingContext = React.createContext<number>(0);

interface ModalOptions {
	initialOpen?: boolean;
	open?: boolean;
	onOpenChange?: (open: boolean) => void;
}

export function useModal({
	initialOpen = false,
	open: controlledOpen,
	onOpenChange: setControlledOpen
}: ModalOptions = {}) {
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);
	const [labelId, setLabelId] = React.useState<string | undefined>();
	const [descriptionId, setDescriptionId] = React.useState<string | undefined>();

	const open = controlledOpen ?? uncontrolledOpen;
	const setOpen = setControlledOpen ?? setUncontrolledOpen;

	const data = useFloating({
		open,
		onOpenChange: setOpen
	});

	const context = data.context;

	const click = useClick(context, {
		enabled: controlledOpen == null
	});
	const dismiss = useDismiss(context, { outsidePressEvent: 'mousedown' });
	const role = useRole(context);

	const interactions = useInteractions([click, dismiss, role]);

	return React.useMemo(
		() => ({
			open,
			setOpen,
			...interactions,
			...data,
			labelId,
			descriptionId,
			setLabelId,
			setDescriptionId
		}),
		[open, setOpen, interactions, data, labelId, descriptionId]
	);
}

type ContextType =
	| (ReturnType<typeof useModal> & {
			setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
			setDescriptionId: React.Dispatch<React.SetStateAction<string | undefined>>;
	  })
	| null;

const ModalContext = React.createContext<ContextType>(null);

export const useModalContext = () => {
	const context = React.useContext(ModalContext);

	if (context == null) {
		throw new Error('Modal components must be wrapped in <Modal />');
	}

	return context;
};

export function Modal({
	children,
	...options
}: {
	children: React.ReactNode;
} & ModalOptions) {
	const modal = useModal(options);
	const nestingLevel = React.useContext(ModalNestingContext);

	return (
		<ModalContext.Provider value={modal}>
			<ModalNestingContext.Provider value={nestingLevel + 1}>
				{children}
			</ModalNestingContext.Provider>
		</ModalContext.Provider>
	);
}

interface ModalTriggerProps {
	children: React.ReactNode;
	asChild?: boolean;
}

export const ModalTrigger = React.forwardRef<
	HTMLElement,
	React.HTMLProps<HTMLElement> & ModalTriggerProps
>(function ModalTrigger({ children, asChild = false, ...props }, propRef) {
	const context = useModalContext();

	const refs = [context.refs.setReference, propRef].filter(Boolean) as React.Ref<HTMLElement>[];
	const ref = useMergeRefs(refs);

	// Handle clicks with no propagation for nested modals
	const handleClick = (e: React.MouseEvent<HTMLElement>) => {
		e.stopPropagation();
		// Toggle the modal state directly
		context.setOpen(!context.open);
		// Call the user's onClick handler if provided
		if (props.onClick && typeof props.onClick === 'function') {
			props.onClick(e);
		}
	};

	// For custom components passed as children
	if (asChild && React.isValidElement(children)) {
		// Wrap in a div that stops propagation instead of trying to clone with props
		return (
			<div onClick={handleClick} style={{ display: 'inline-block' }}>
				{children}
			</div>
		);
	}

	// For normal button trigger
	// Use normal HTML button with explicit type attribute
	return (
		<button
			ref={ref}
			{...props}
			onClick={handleClick}
			// Explicit typing for button
			type="button"
		>
			{children}
		</button>
	);
});

export const ModalContent = React.forwardRef<HTMLDivElement, React.HTMLProps<HTMLDivElement>>(
	function ModalContent(props, propRef) {
		const { context: floatingContext, ...context } = useModalContext();
		const ref = useMergeRefs([context.refs.setFloating, propRef]);
		const nestingLevel = React.useContext(ModalNestingContext);

		// Add transition animation styles
		const { styles } = useTransitionStyles(floatingContext, {
			duration: 200,
			initial: {
				opacity: 0,
				transform: 'translateY(50px)'
			}
		});

		if (!floatingContext.open) return null;

		// Calculate z-index based on nesting level
		const baseZIndex = 998;
		const zIndex = baseZIndex + nestingLevel;

		// Simple handler to stop event propagation
		const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
			e.stopPropagation();
		};

		return (
			<FloatingPortal>
				<FloatingOverlay
					className="bg-surface-50-950/75 fixed top-0 right-0 bottom-0 left-0 flex items-center justify-center p-4 backdrop-blur-sm"
					lockScroll
					style={{ zIndex }}
				>
					<FloatingFocusManager context={floatingContext}>
						<div
							ref={ref}
							aria-labelledby={context.labelId}
							aria-describedby={context.descriptionId}
							className="card bg-surface-100-900 relative space-y-4 p-4 shadow-xl"
							style={{
								...styles, // Transition styles
								zIndex: zIndex + 1 // Ensure content is above overlay
							}}
							onClick={handleClick}
							{...context.getFloatingProps(props)}
						>
							{props.children}
						</div>
					</FloatingFocusManager>
				</FloatingOverlay>
			</FloatingPortal>
		);
	}
);

export const ModalHeading = React.forwardRef<
	HTMLHeadingElement,
	React.HTMLProps<HTMLHeadingElement>
>(function ModalHeading({ children, ...props }, ref) {
	const { setLabelId } = useModalContext();
	const id = useId();

	// Only sets `aria-labelledby` on the Modal root element
	// if this component is mounted inside it.
	React.useLayoutEffect(() => {
		setLabelId(id);
		return () => setLabelId(undefined);
	}, [id, setLabelId]);

	return (
		<h2 {...props} ref={ref} id={id}>
			{children}
		</h2>
	);
});

export const ModalDescription = React.forwardRef<
	HTMLParagraphElement,
	React.HTMLProps<HTMLParagraphElement>
>(function ModalDescription({ children, ...props }, ref) {
	const { setDescriptionId } = useModalContext();
	const id = useId();

	// Only sets `aria-describedby` on the Modal root element
	// if this component is mounted inside it.
	React.useLayoutEffect(() => {
		setDescriptionId(id);
		return () => setDescriptionId(undefined);
	}, [id, setDescriptionId]);

	return (
		<p {...props} ref={ref} id={id}>
			{children}
		</p>
	);
});

export const ModalClose = React.forwardRef<
	HTMLButtonElement,
	React.ButtonHTMLAttributes<HTMLButtonElement>
>(function ModalClose({ className, children, ...props }, ref) {
	const { setOpen } = useModalContext();
	return (
		<button
			type="button"
			className={
				className ||
				`btn btn-sm preset-faded-surface hover:preset-filled-surface-200-800 absolute top-3 right-3 px-1 duration-200 ease-in-out`
			}
			{...props}
			ref={ref}
			onClick={(e) => {
				props.onClick?.(e);
				setOpen(false);
			}}
		>
			{children || <X size={16} />}
		</button>
	);
});
