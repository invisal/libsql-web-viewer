import { OuterbaseAPIWorkspace } from "@/outerbase-cloud/api-type";
import ConnectionListItem from "./connection-list-item";

interface WorkspaceBaseListProps {
  workspace: OuterbaseAPIWorkspace;
}

export default function WorkspaceBaseList({
  workspace,
}: WorkspaceBaseListProps) {
  return (
    <div className="flex flex-wrap gap-4 p-8">
      {workspace.bases
        .filter((base) => !!base.sources[0])
        .map((base) => {
          return (
            <ConnectionListItem
              href={`/w/${workspace.short_name}/${base.short_name}`}
              key={base.id}
              type={base.sources[0].type}
              name={base.name}
              lastUsed=""
            />
          );
        })}
    </div>
  );
}
