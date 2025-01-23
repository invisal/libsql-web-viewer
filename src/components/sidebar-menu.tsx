import { cn } from "@/lib/utils";
import Link from "next/link";

interface SidebarMenuItemProps {
  text: string;
  onClick?: () => void;
  href?: string;
  selected?: boolean;
  icon?: React.FC<React.SVGProps<SVGSVGElement>>;
}

interface SidebarMenuHeader {
  text: string;
}

export function SidebarMenuItem({
  text,
  onClick,
  icon: IconComponent,
  href,
  selected,
}: SidebarMenuItemProps) {
  const className = cn(
    "flex p-2 pl-4 text-xs hover:cursor-pointer hover:bg-muted",
    {
      "bg-secondary": selected,
    }
  );

  const body = (
    <>
      {IconComponent ? (
        <IconComponent className="mr-2 h-4 w-4" />
      ) : (
        <span className="mr-2 h-4 w-4"></span>
      )}
      {text}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }

  return (
    <button className={className} onClick={onClick}>
      {body}
    </button>
  );
}

export function SidebarLoadingMenuItem() {
  return (
    <div className="flex h-[32px] items-center px-4 text-xs">
      <div className="h-4 w-full animate-pulse rounded bg-accent duration-300"></div>
    </div>
  );
}

export function SidebarMenuHeader({ text }: SidebarMenuHeader) {
  return <div className="mt-2 flex p-2 pl-4 text-xs font-bold">{text}</div>;
}
