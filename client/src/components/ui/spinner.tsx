import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const spinnerVariants = cva(
  "inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]",
  {
    variants: {
      size: {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8",
        xl: "h-12 w-12",
      },
      color: {
        default: "text-primary",
        white: "text-white",
      },
    },
    defaultVariants: {
      size: "md",
      color: "default",
    },
  }
);

interface SpinnerProps extends VariantProps<typeof spinnerVariants> {
  className?: string;
}

export function Spinner({ size, color, className }: SpinnerProps) {
  return (
    <div
      className={cn(spinnerVariants({ size, color }), className)}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}