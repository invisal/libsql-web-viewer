import { cn } from "@/lib/utils";
import { Icon } from "@phosphor-icons/react";
import { LucideCopy, LucideLoader } from "lucide-react";
import { cloneElement, forwardRef, PropsWithChildren, ReactElement, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import CodePreview from "./code-preview";


export function Toolbar({ children }: PropsWithChildren) {
  return <div className="flex p-1 gap-1">{children}</div>;
}

export function ToolbarSeparator() {
  return (
    <div className="mx-1">
      <Separator orientation="vertical" />
    </div>
  );
}

interface ToolbarButtonProps {
  icon?: React.ReactElement;
  disabled?: boolean;
  loading?: boolean;
  badge?: string;
  text: string;
  onClick?: () => void;
  tooltip?: ReactElement | string;
  destructive?: boolean;
}

export const ToolbarButton = forwardRef<HTMLButtonElement, ToolbarButtonProps>(
  function ToolbarButtonInternal(props: ToolbarButtonProps, ref) {
    const {
      disabled,
      loading,
      icon: Icon,
      onClick,
      badge,
      text,
      tooltip,
      destructive,
    } = props;

    const buttonContent = (
      <button
        className={cn(
          "flex gap-2",
          buttonVariants({ variant: "ghost", size: "sm" }),
          destructive ? "text-red-500 hover:text-red-500" : ""
        )}
        disabled={disabled}
        onClick={onClick}
        ref={ref}
      >
        {loading ? (
          <LucideLoader className="w-4 h-4 animate-spin" />
        ) : 
          Icon && cloneElement(Icon, { className: "w-4 h-4" })
        }
        <span>{text}</span>
        {badge && (
          <span
            className={
              "ml-2 bg-red-500 text-white leading-5 w-5 h-5 rounded-full"
            }
            style={{ fontSize: 9 }}
          >
            {badge}
          </span>
        )}
      </button>
    );

    if (tooltip) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
          <TooltipContent>{tooltip}</TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
  }
);

interface ToolbarCodePreviewProps {
  code: string;
  icon?: Icon;
  text: string;
}

export function ToolbarCodePreview({
  text,
  icon: Icon,
  code,
}: ToolbarCodePreviewProps) {
  const activator = (
    <button
      disabled={!code}
      className={cn(
        "flex gap-2",
        buttonVariants({ variant: "ghost", size: "sm" })
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {text}
    </button>
  );

  if (!code) return activator;

  return (
    <Popover>
      <PopoverTrigger asChild>{activator}</PopoverTrigger>
      <PopoverContent style={{ width: 500 }}>
        <Button
          variant={"outline"}
          size="sm"
          onClick={() => {
            toast.success("Copied create script successfully");
            window.navigator.clipboard.writeText(code);
          }}
        >
          <LucideCopy className="w-4 h-4 mr-2" />
          Copy
        </Button>

        <div style={{ maxHeight: 400 }} className="overflow-y-auto mt-2">
          <CodePreview code={code} />
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function ToolbarDropdown(props: PropsWithChildren<ToolbarButtonProps>) {
  const [open, setOpen] = useState(false);
  const { children, ...buttonProps } = props;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <ToolbarButton
          {...buttonProps}
          onClick={() => {
            setOpen(true);
          }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="start">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
