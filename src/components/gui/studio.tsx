"use client";
import MainScreen from "@/components/gui/main-connection";
import { ConfigProvider } from "@/context/config-provider";
import { DriverProvider } from "@/context/driver-provider";
import type { BaseDriver } from "@/drivers/base-driver";
import { useEffect, useMemo } from "react";
import { CollaborationBaseDriver } from "@/drivers/collaboration-driver-base";
import { SavedDocDriver } from "@/drivers/saved-doc/saved-doc-driver";
import { FullEditorProvider } from "./providers/full-editor-provider";
import { CommonDialogProvider } from "../common-dialog";
import {
  BeforeQueryPipeline,
  StudioExtensionManager,
} from "@/core/extension-manager";

interface StudioProps {
  driver: BaseDriver;
  extensions?: StudioExtensionManager;
  collaboration?: CollaborationBaseDriver;
  docDriver?: SavedDocDriver;
  name: string;
  color: string;
  onBack?: () => void;
  theme?: "dark" | "light";
  containerClassName?: string;
}

export function Studio({
  driver,
  collaboration,
  docDriver,
  name,
  color,
  onBack,
  extensions,
  containerClassName,
}: Readonly<StudioProps>) {
  const proxyDriver = useMemo(() => {
    return new Proxy(driver, {
      get(...arg) {
        const [target, property] = arg;

        if (property === "query") {
          return async (statement: string) => {
            const beforePipeline = new BeforeQueryPipeline("query", [
              statement,
            ]);

            if (extensions) {
              await extensions.beforeQuery(beforePipeline);
            }

            return await target.query(beforePipeline.getStatments()[0]);
          };
        } else if (property === "transaction") {
          return async (statements: string[]) => {
            const beforePipeline = new BeforeQueryPipeline("transaction", [
              ...statements,
            ]);

            if (extensions) {
              await extensions.beforeQuery(beforePipeline);
            }

            return await target.transaction(beforePipeline.getStatments());
          };
        }

        return Reflect.get(...arg);
      },
    });
  }, [driver, extensions]);

  const finalExtensionManager = useMemo(() => {
    return extensions ?? new StudioExtensionManager([]);
  }, [extensions]);

  useEffect(() => {
    finalExtensionManager.init();
    return () => finalExtensionManager.cleanup();
  }, [finalExtensionManager]);

  const config = useMemo(() => {
    return {
      name,
      color,
      onBack,
      extensions: finalExtensionManager,
      containerClassName,
    };
  }, [name, color, onBack, finalExtensionManager, containerClassName]);

  const saveDocDriver = useMemo(() => {
    if (window.outerbaseIpc.docs) {
      return window.outerbaseIpc.docs;
    }
    return docDriver;
  }, [docDriver]);

  return (
    <DriverProvider
      driver={proxyDriver}
      collaborationDriver={collaboration}
      docDriver={saveDocDriver}
    >
      <ConfigProvider config={config}>
        <CommonDialogProvider>
          <FullEditorProvider>
            <MainScreen />
          </FullEditorProvider>
        </CommonDialogProvider>
      </ConfigProvider>
    </DriverProvider>
  );
}
