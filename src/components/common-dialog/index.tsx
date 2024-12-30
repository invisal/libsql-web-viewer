"use client";
import { noop } from "lodash";
import {
  PropsWithChildren,
  ReactElement,
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Icon } from "@phosphor-icons/react";
import { Loader } from "lucide-react";
import CodePreview from "../gui/code-preview";
import { DialogTitle } from "@radix-ui/react-dialog";

interface ShowDialogProps {
  title: string;
  content: string | ReactElement;
  destructive?: boolean;
  previewCode?: string;
  actions?: {
    text: string;
    icon?: Icon;
    onClick: () => Promise<void>;
    onComplete?: () => void;
  }[];
}

interface CommonDialogContextProps {
  showDialog(option: ShowDialogProps): void;
}

const CommonDialogContext = createContext<CommonDialogContextProps>({
  showDialog: noop,
});

export function CommonDialogProvider({ children }: PropsWithChildren) {
  const [dialogOption, setDialogOption] = useState<ShowDialogProps | null>(
    null
  );

  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const hideDialog = useCallback(() => {
    setErrorMessage("");
    setDialogOption(null);
  }, []);

  const showDialog = useCallback((option: ShowDialogProps) => {
    setDialogOption(option);
    setErrorMessage("");
  }, []);

  return (
    <CommonDialogContext.Provider value={{ showDialog }}>
      {children}
      {dialogOption && (
        <Dialog
          open={dialogOption !== null}
          onOpenChange={(openState) => {
            if (!openState) {
              hideDialog();
            }
          }}
        >
          <DialogContent>
            <DialogTitle
              className={dialogOption?.destructive ? "text-red-500" : ""}
            >
              {dialogOption.title}
            </DialogTitle>

            <DialogDescription className="flex flex-col gap-2" asChild>
              <div>
                {errorMessage && (
                  <div className="text-sm text-red-500 font-mono flex gap-4 items-end">
                    <p>{errorMessage}</p>
                  </div>
                )}

                <div>{dialogOption.content}</div>
              </div>
            </DialogDescription>

            {dialogOption.previewCode && (
              <CodePreview code={dialogOption.previewCode} />
            )}

            <DialogFooter>
              {dialogOption.actions?.map((action) => (
                <Button
                  key={action.text}
                  className={
                    dialogOption.destructive ? "bg-red-500 text-white" : ""
                  }
                  disabled={loading}
                  onClick={() => {
                    setLoading(true);

                    action
                      .onClick()
                      .then(() => {
                        hideDialog();
                        if (action.onComplete) {
                          action.onComplete();
                        }
                      })
                      .catch((e) => {
                        if (e instanceof Error) {
                          setErrorMessage(e.message);
                        } else {
                          setErrorMessage("An error occurred");
                        }
                      })
                      .finally(() => {
                        setLoading(false);
                      });
                  }}
                >
                  {loading && <Loader className="w-4 h-4 mr-2 animate-spin" />}
                  {action.icon && !loading && (
                    <action.icon className="w-4 h-4 mr-2" />
                  )}
                  {action.text}
                </Button>
              ))}

              <Button
                disabled={loading}
                variant={"secondary"}
                onClick={() => {
                  hideDialog();
                }}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </CommonDialogContext.Provider>
  );
}

export function useCommonDialog() {
  return useContext(CommonDialogContext);
}
