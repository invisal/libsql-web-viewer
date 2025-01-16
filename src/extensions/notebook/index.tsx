import { StudioExtension } from "@/core/extension-base";
import { StudioExtensionManager } from "@/core/extension-manager";
import { createTabExtension } from "@/core/extension-tab";
import { NotebookIcon } from "lucide-react";
import NotebookTab from "./notebook-tab";

const notebookTab = createTabExtension({
  name: "notebook",
  key: () => "notebook",
  generate: () => ({
    title: "New Notebook",
    component: <NotebookTab />,
    icon: NotebookIcon,
  }),
});

export default class NotebookExtension extends StudioExtension {
  extensionName = "notebook";

  init(studio: StudioExtensionManager): void {
    studio.registerWindowTabMenu({
      key: "notebook",
      title: "New Notebook",
      onClick: () => {
        notebookTab.open({});
      },
    });
  }
}
