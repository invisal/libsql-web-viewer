import { closeTabs, openTab } from "@/messages/open-tab";
import { useDatabaseDriver } from "@/context/driver-provider";
import {
  SavedDocData,
  SavedDocGroupByNamespace,
  SavedDocNamespace,
} from "@/drivers/saved-doc/saved-doc-driver";
import { ListView, ListViewItem } from "@/components/listview";
import { LucideTrash } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import RenameNamespaceDialog from "./rename-namespace-dialog";
import RemoveDocDialog from "./remove-doc-dialog";
import { TAB_PREFIX_SAVED_QUERY } from "@/const";
import RemoveNamespaceDialog from "./remove-namespace-dialog";
import { OpenContextMenuList } from "@/messages/open-context-menu";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Binoculars, Folder, Plus } from "@phosphor-icons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CreateNamespaceDialog from "./create-namespace-button";

type SavedDocListData =
  | {
      type: "namespace";
      data: SavedDocNamespace;
    }
  | {
      type: "doc";
      data: SavedDocData;
    };

function mapDoc(
  data: SavedDocGroupByNamespace[]
): ListViewItem<SavedDocListData>[] {
  return data.map((ns) => {
    return {
      data: { type: "namespace", data: ns.namespace },
      key: ns.namespace.id,
      icon: Folder,
      name: ns.namespace.name,
      children: ns.docs.map((d) => {
        return {
          key: d.id,
          data: { type: "doc", data: d },
          icon: Binoculars,
          name: d.name,
        };
      }) as ListViewItem<SavedDocListData>[],
    };
  });
}

export default function SavedDocTab() {
  const { docDriver } = useDatabaseDriver();
  const [selected, setSelected] = useState<string>();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const [namespaceCreating, setNamespaceCreating] = useState(false);
  const [namespaceToRename, setNamespaceToRename] =
    useState<SavedDocNamespace>();
  const [namespaceToRemove, setNamespaceToRemove] =
    useState<SavedDocNamespace>();
  const [docToRemove, setDocToRemove] = useState<SavedDocData | undefined>();

  const [docList, setDocList] = useState<ListViewItem<SavedDocListData>[]>([]);

  const refresh = useCallback(() => {
    if (docDriver) {
      docDriver
        .getDocs()
        .then((r) => setDocList(mapDoc(r)))
        .catch(console.error);
    }
  }, [docDriver]);

  useEffect(() => {
    refresh();

    if (docDriver) {
      const onDocChange = () => {
        refresh();
      };

      docDriver.addChangeListener(onDocChange);
      return () => docDriver.removeChangeListener(onDocChange);
    }
  }, [refresh, docDriver]);

  let dialog: JSX.Element | null = null;

  if (docToRemove) {
    dialog = (
      <RemoveDocDialog
        doc={docToRemove}
        onClose={() => {
          setDocToRemove(undefined);
        }}
        onComplete={() => {
          if (docDriver) {
            refresh();
            closeTabs([TAB_PREFIX_SAVED_QUERY + docToRemove.id]);
          }
        }}
      />
    );
  }

  if (namespaceToRename) {
    dialog = (
      <RenameNamespaceDialog
        onClose={() => setNamespaceToRename(undefined)}
        onComplete={() => {
          if (docDriver) {
            docDriver
              .getDocs()
              .then((r) => setDocList(mapDoc(r)))
              .catch(console.error);
          }
        }}
        value={namespaceToRename}
      />
    );
  }

  if (namespaceToRemove) {
    dialog = (
      <RemoveNamespaceDialog
        onClose={() => setNamespaceToRemove(undefined)}
        onComplete={(docs) => {
          if (docDriver) {
            closeTabs(docs.map((d) => TAB_PREFIX_SAVED_QUERY + d.id));
            refresh();
          }
        }}
        value={namespaceToRemove}
      />
    );
  }

  if (namespaceCreating) {
    dialog = (
      <CreateNamespaceDialog
        onCreated={refresh}
        onClose={() => setNamespaceCreating(false)}
      />
    );
  }

  return (
    <>
      {dialog}

      <div className="flex flex-col grow">
        <div className="flex justify-between mb-5 items-center mx-2 pt-4 px-2">
          <h1 className="text-xl font-medium text-primary">Queries</h1>

          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  buttonVariants({
                    size: "icon",
                  }),
                  "rounded-full h-8 w-8 bg-neutral-800 dark:bg-neutral-200"
                )}
              >
                <Plus size={16} weight="bold" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setNamespaceCreating(true)}>
                New Folder
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  openTab({
                    type: "query",
                  });
                }}
              >
                New Query
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <ListView
          full
          items={docList}
          selectedKey={selected}
          onSelectChange={setSelected}
          collapsedKeys={collapsed}
          onCollapsedChange={setCollapsed}
          onDoubleClick={(item: ListViewItem<SavedDocListData>) => {
            if (item.data.type === "doc") {
              openTab({
                type: "query",
                name: item.name,
                saved: {
                  key: item.key,
                  sql: item.data.data.content,
                  namespaceName: item.data.data.namespace.name,
                },
              });
            }
          }}
          onContextMenu={(item) => {
            let menu: OpenContextMenuList = [];

            if (item?.data.type === "namespace") {
              menu = [
                ...menu,
                {
                  title: "Rename",
                  disabled: !item,
                  onClick: () => {
                    if (item) setNamespaceToRename(item.data.data);
                  },
                },
                {
                  title: "Remove",
                  icon: LucideTrash,
                  destructive: true,
                  disabled: !item,
                  onClick: () => {
                    if (item) setNamespaceToRemove(item.data.data);
                  },
                },
              ];
            } else if (item?.data.type === "doc") {
              menu = [
                ...menu,
                {
                  title: "Remove",
                  onClick: () => {
                    if (item) {
                      setDocToRemove(item.data.data as SavedDocData);
                    }
                  },
                  icon: LucideTrash,
                  destructive: true,
                  disabled: !item,
                },
              ];
            }

            return menu;
          }}
        />
      </div>
    </>
  );
}
