import { SidebarMenuHeader, SidebarMenuItem } from "@/components/sidebar-menu";
import ThemeToggle from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Component, Layers2 } from "lucide-react";
import ThemeLayout from "../(theme)/theme_layout";

export default function StorybookRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeLayout>
      <div className="flex h-screen w-screen overflow-hidden">
        <div className="flex w-[300px] flex-col border-r">
          <div className="flex p-2">
            <ThemeToggle />
          </div>

          <SidebarMenuItem icon={Layers2} text="Guideline" href="/storybook" />
          <SidebarMenuHeader text="Basic UI Components" />
          <SidebarMenuItem
            icon={Layers2}
            text="Input"
            href="https://ui.shadcn.com/docs/components/input"
          />
          <SidebarMenuItem
            icon={Layers2}
            text="Dialog"
            href="https://ui.shadcn.com/docs/components/dialog"
          />
          <SidebarMenuItem
            icon={Layers2}
            text="Dropdown Menu"
            href="https://ui.shadcn.com/docs/components/dropdown-menu"
          />
          <SidebarMenuItem
            icon={Layers2}
            text="Popover"
            href="https://ui.shadcn.com/docs/components/popover"
          />
          <Separator />
          <SidebarMenuHeader text="Advanced UI Components" />
          <SidebarMenuItem
            icon={Layers2}
            text="Toolbar"
            href="/storybook/toolbar"
          />
          <SidebarMenuItem
            icon={Component}
            text="List View"
            href="/storybook/listview"
          />
          <SidebarMenuItem
            icon={Component}
            text="Chart Editor"
            href="/storybook/chart-editor"
          />
          <SidebarMenuItem text="Board" href="/storybook/board" />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <TooltipProvider>{children}</TooltipProvider>
        </div>
      </div>
    </ThemeLayout>
  );
}
