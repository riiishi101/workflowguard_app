import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root> & { indeterminate?: boolean }
>(({ className, indeterminate, ...props }, ref) => {
  const defaultRef = React.useRef<HTMLButtonElement>(null);
  const resolvedRef = (ref as React.RefObject<HTMLButtonElement>) || defaultRef;

  React.useEffect(() => {
    if (resolvedRef.current && typeof indeterminate === 'boolean') {
      // Radix doesn't use a native input, but if you ever switch to one, this is how you'd set it:
      // (resolvedRef.current as any).indeterminate = indeterminate;
      // For Radix, you may need to set a data attribute or class for styling.
      if (indeterminate) {
        resolvedRef.current.setAttribute('data-indeterminate', 'true');
      } else {
        resolvedRef.current.removeAttribute('data-indeterminate');
      }
    }
  }, [indeterminate, resolvedRef]);

  return (
    <CheckboxPrimitive.Root
      ref={resolvedRef}
      className={cn(
        "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
        indeterminate ? 'data-[indeterminate=true]:bg-primary/50' : '',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        className={cn("flex items-center justify-center text-current")}
      >
        <Check className="h-4 w-4" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
