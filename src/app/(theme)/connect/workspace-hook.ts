import { getOuterbaseWorkspace } from "@/outerbase-cloud/api";
import { OuterbaseAPIWorkspace } from "@/outerbase-cloud/api-type";
import { useEffect, useState } from "react";

export function useOuterbaseWorkspaceList() {
  const [workspaces, setWorkspaces] = useState<OuterbaseAPIWorkspace[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.localStorage.getItem("ob-token")) {
      getOuterbaseWorkspace().then((r) => setWorkspaces(r.items));
    }
  }, []);

  return { workspaces };
}
