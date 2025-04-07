import * as React from "react";
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
  useTransitionStyles,
} from "@floating-ui/react";

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
  onOpenChange: setControlledOpen,
}: ModalOptions = {}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(initialOpen);
  const [labelId, setLabelId] = React.useState<string | undefined>();
  const [descriptionId, setDescriptionId] = React.useState<
    string | undefined
  >();

  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = setControlledOpen ?? setUncontrolledOpen;

  const data = useFloating({
    open,
    onOpenChange: setOpen,
  });

  const context = data.context;

  const click = useClick(context, {
    enabled: controlledOpen == null,
  });
  const dismiss = useDismiss(context, { outsidePressEvent: "mousedown" });
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
      setDescriptionId,
    }),
    [open, setOpen, interactions, data, labelId, descriptionId]
  );
}

type ContextType =
  | (ReturnType<typeof useModal> & {
      setLabelId: React.Dispatch<React.SetStateAction<string | undefined>>;
      setDescriptionId: React.Dispatch<
        React.SetStateAction<string | undefined>
      >;
    })
  | null;

const ModalContext = React.createContext<ContextType>(null);

export const useModalContext = () => {
  const context = React.useContext(ModalContext);

  if (context == null) {
    throw new Error("Modal components must be wrapped in <Modal />");
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

  const refs = [context.refs.setReference, propRef].filter(
    Boolean
  ) as React.Ref<HTMLElement>[];
  const ref = useMergeRefs(refs);

  // Custom click handler to prevent event bubbling to parent modals
  const handleClick = (e: React.MouseEvent<HTMLElement>) => {
    // Stop propagation to prevent parent modals from capturing this event
    e.stopPropagation();

    // Manually toggle the modal state instead of relying on context handlers
    context.setOpen(!context.open);

    // If there's a click handler in props, call it
    if (props.onClick) {
      (props.onClick as React.MouseEventHandler<HTMLElement>)(e);
    }
  };

  // `asChild` allows the user to pass any element as the anchor
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref,
      ...props,
      onClick: handleClick,
      ...(children.props ?? {}),
      "data-state": context.open ? "open" : "closed",
    });
  }

  return (
    <button
      ref={ref}
      type="button"
      // The user can style the trigger based on the state
      data-state={context.open ? "open" : "closed"}
      {...props}
      onClick={handleClick}
    >
      {children}
    </button>
  );
});

export const ModalContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLProps<HTMLDivElement>
>(function ModalContent(props, propRef) {
  const { context: floatingContext, ...context } = useModalContext();
  const ref = useMergeRefs([context.refs.setFloating, propRef]);
  const nestingLevel = React.useContext(ModalNestingContext);

  // Add transition animation styles
  const { styles } = useTransitionStyles(floatingContext, {
    duration: 200,
    initial: {
      opacity: 0,
      transform: "translateY(50px)",
    },
  });

  if (!floatingContext.open) return null;

  // Calculate z-index based on nesting level
  const baseZIndex = 998;
  const zIndex = baseZIndex + nestingLevel;

  return (
    <FloatingPortal>
      <FloatingOverlay
        className={`fixed top-0 left-0 right-0 bottom-0 bg-surface-50-950/75 backdrop-blur-sm flex justify-center items-center p-4`}
        lockScroll
        style={{ zIndex }}
      >
        <FloatingFocusManager context={floatingContext}>
          <div
            ref={ref}
            aria-labelledby={context.labelId}
            aria-describedby={context.descriptionId}
            className="card bg-surface-100-900 p-4 space-y-4 shadow-xl max-w-screen-sm"
            style={{
              ...styles, // Transition styles
              zIndex: zIndex + 1, // Ensure content is above overlay
            }}
            // Stop propagation on all clicks within modal content
            onClick={(e: React.MouseEvent<HTMLDivElement>) =>
              e.stopPropagation()
            }
            {...context.getFloatingProps(props)}
          >
            {props.children}
          </div>
        </FloatingFocusManager>
      </FloatingOverlay>
    </FloatingPortal>
  );
});

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
>(function ModalClose(props, ref) {
  const { setOpen } = useModalContext();
  return (
    <button type="button" {...props} ref={ref} onClick={() => setOpen(false)} />
  );
});
