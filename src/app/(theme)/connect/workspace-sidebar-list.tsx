import {
  SidebarLoadingMenuItem,
  SidebarMenuHeader,
  SidebarMenuItem,
} from "@/components/sidebar-menu";
import { OuterbaseAPIWorkspace } from "@/outerbase-cloud/api-type";
import { LucideCloud, LucideFolder } from "lucide-react";

interface WorkspaceSidebarListProps {
  workspaces: OuterbaseAPIWorkspace[];
  selected?: string;
  onSelectChange: (workspaceId: string) => void;
}

export default function WorkspaceSidebarList({
  workspaces,
  selected,
  onSelectChange,
}: WorkspaceSidebarListProps) {
  let workspaceConnections = (
    <>
      <SidebarLoadingMenuItem />
      <SidebarLoadingMenuItem />
    </>
  );

  if (workspaces.length > 0) {
    workspaceConnections = (
      <>
        {workspaces.map((workspace) => {
          return (
            <SidebarMenuItem
              key={workspace.id}
              text={workspace.name}
              icon={LucideCloud}
              selected={selected === workspace.id}
              onClick={() => {
                onSelectChange(workspace.id);
              }}
            />
          );
        })}
      </>
    );
  }

  return (
    <>
      <SidebarMenuHeader text="Workspaces" />
      <SidebarMenuItem
        icon={LucideFolder}
        text="Local Connections"
        selected={selected === "local"}
        onClick={() => {
          onSelectChange("local");
        }}
      />
      {workspaceConnections}
    </>
  );
}
