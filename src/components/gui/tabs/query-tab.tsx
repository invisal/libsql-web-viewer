import { format } from "sql-formatter";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  LucideGrid,
  LucideMessageSquareWarning,
  LucidePlay,
} from "lucide-react";
import SqlEditor from "@/components/gui/sql-editor";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button, buttonVariants } from "@/components/ui/button";
import { KEY_BINDING } from "@/lib/key-matcher";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import QueryProgressLog from "../query-progress-log";
import { useDatabaseDriver } from "@/context/driver-provider";
import {
  MultipleQueryProgress,
  MultipleQueryResult,
  multipleQuery,
} from "@/components/lib/multiple-query";
import WindowTabs, { useTabsContext, WindowTabItemProps } from "../windows-tab";
import QueryResult from "../tabs-result/query-result-tab";
import { useSchema } from "@/context/schema-provider";
import SaveDocButton from "../save-doc-button";
import {
  SavedDocData,
  SavedDocInput,
} from "@/drivers/saved-doc/saved-doc-driver";
import { TAB_PREFIX_SAVED_QUERY } from "@/const";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  resolveToNearestStatement,
  splitSqlQuery,
} from "../sql-editor/statement-highlight";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isExplainQueryPlan } from "../query-explanation";
import ExplainResultTab from "../tabs-result/explain-result-tab";
import { tokenizeSql } from "@/lib/sql/tokenizer";
import { QueryPlaceholder } from "./query-placeholder";
import { escapeSqlValue } from "@/drivers/sqlite/sql-helper";

interface QueryWindowProps {
  initialCode?: string;
  initialName: string;
  initialSavedKey?: string;
  initialNamespace?: string;
}

export default function QueryWindow({
  initialCode,
  initialName,
  initialSavedKey,
  initialNamespace,
}: QueryWindowProps) {
  const { databaseDriver, docDriver } = useDatabaseDriver();
  const { refresh: refreshSchema, autoCompleteSchema } = useSchema();
  const [code, setCode] = useState(initialCode ?? "");
  const editorRef = useRef<ReactCodeMirrorRef>(null);

  const [fontSize, setFontSize] = useState(0.875);
  const [lineNumber, setLineNumber] = useState(0);
  const [columnNumber, setColumnNumber] = useState(0);

  const [queryTabIndex, setQueryTabIndex] = useState(0);
  const [progress, setProgress] = useState<MultipleQueryProgress>();
  const [data, setData] = useState<MultipleQueryResult[]>();
  const [name, setName] = useState(initialName);
  const { changeCurrentTab } = useTabsContext();

  const [namespaceName, setNamespaceName] = useState(
    initialNamespace ?? "Unsaved Query"
  );
  const [savedKey, setSavedKey] = useState<string | undefined>(initialSavedKey);
  const [placeHolders, setPlaceHolders] = useState<Record<string, string>>({});

  useEffect(() => {
    const timer = setTimeout(() => {
      const editorState = editorRef.current?.view?.state;
      if (!editorState) return;
      const finalStatements = splitSqlQuery(editorState).map((q) => q.text);
      const newPlaceholders: Record<string, string> = {};
      for (const statement of finalStatements) {
        const token = tokenizeSql(statement);
        const placeholders = token
          .filter((t) => t.type === "PLACEHOLDER")
          .map((t) => t.value.split(":")[1]);
        for (const placeholder of placeholders) {
          newPlaceholders[placeholder] = "";
        }
      }
      for (const newKey of Object.keys(newPlaceholders)) {
        newPlaceholders[newKey] = placeHolders[newKey] ?? "";
      }
      setPlaceHolders(newPlaceholders);
    }, 1000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  const onFormatClicked = () => {
    try {
      setCode(
        format(code, {
          language: "sqlite",
          tabWidth: 2,
        })
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const onRunClicked = (all = false, explained = false) => {
    let finalStatements: string[] = [];

    const editorState = editorRef.current?.view?.state;

    if (!editorState) return;

    if (all) {
      finalStatements = splitSqlQuery(editorState).map((q) => q.text);
    } else {
      const segment = resolveToNearestStatement(editorState);
      if (!segment) return;

      let statement = editorState.doc.sliceString(segment.from, segment.to);

      if (
        explained &&
        statement.toLowerCase().indexOf("explain query plan") !== 0
      ) {
        if (databaseDriver.getFlags().dialect === "sqlite") {
          statement = "explain query plan " + statement;
        } else if (databaseDriver.getFlags().dialect === "mysql") {
          statement = "explain format=json " + statement;
        } else if (databaseDriver.getFlags().dialect === "postgres") {
          statement = "explain (format json) " + statement;
        }
      }

      if (statement) {
        finalStatements = [statement];
      }
    }

    if (finalStatements.length > 0) {
      // Reset the result and make a new query
      setData(undefined);
      setProgress(undefined);
      setQueryTabIndex(0);

      //inject placeholders
      for (const statement of finalStatements) {
        const token = tokenizeSql(statement);
        const variables = token
          .filter((t) => t.type === "PLACEHOLDER")
          .map((t) => t.value.split(":")[1]);
        if (
          variables.length > 0 &&
          variables.some((p) => placeHolders[p] === "")
        ) {
          toast.error("Please fill in all placeholders");
          return;
        }
      }
      for (const key of Object.keys(placeHolders)) {
        finalStatements = finalStatements.map((s) =>
          s.replace(
            new RegExp(`:${key}`, "g"),
            escapeSqlValue(placeHolders[key])
          )
        );
      }

      multipleQuery(databaseDriver, finalStatements, (currentProgress) => {
        setProgress(currentProgress);
      })
        .then(({ result: completeQueryResult, logs: completeLogs }) => {
          setData(completeQueryResult);

          // Check if sql contain any CREATE/DROP
          let hasAlterSchema = false;
          for (const log of completeLogs) {
            if (
              log.sql.trim().substring(0, "create ".length).toLowerCase() ===
              "create "
            ) {
              hasAlterSchema = true;
              break;
            } else if (
              log.sql.trim().substring(0, "drop ".length).toLowerCase() ===
              "drop "
            ) {
              hasAlterSchema = true;
              break;
            } else if (
              databaseDriver.getFlags().supportUseStatement &&
              log.sql.trim().substring(0, "use ".length).toLowerCase() ===
                "use "
            ) {
              hasAlterSchema = true;
              break;
            }
          }

          if (hasAlterSchema) {
            refreshSchema();
          }
        })
        .catch(console.error);
    }
  };

  const onSaveComplete = useCallback(
    (doc: SavedDocData) => {
      setNamespaceName(doc.namespace.name);
      setSavedKey(doc.id);
      changeCurrentTab({ identifier: TAB_PREFIX_SAVED_QUERY + doc.id });
    },
    [changeCurrentTab]
  );

  const onPrepareSaveContent = useCallback((): SavedDocInput => {
    return { content: code, name };
  }, [code, name]);

  const windowTab = useMemo(() => {
    const queryTabs: WindowTabItemProps[] = [];

    for (const queryResult of data ?? []) {
      if (
        isExplainQueryPlan(queryResult.sql, databaseDriver.getFlags().dialect)
      ) {
        queryTabs.push({
          component: <ExplainResultTab data={queryResult.result} />,
          key: "explain_" + queryResult.order,
          identifier: "explain_" + queryResult.order,
          title: "Explain (Visual)",
          icon: LucideMessageSquareWarning,
        });
      }

      queryTabs.push({
        component: <QueryResult result={queryResult} key={queryResult.order} />,
        key: "query_" + queryResult.order,
        identifier: "query_" + queryResult.order,
        title:
          `${getSingleTableName(queryResult.sql) ?? "Query " + (queryResult.order + 1)}` +
          ` (${queryResult.result.rows.length}x${queryResult.result.headers.length})`,
        icon: LucideGrid,
      });
    }

    if (progress) {
      queryTabs.push({
        key: "summary",
        identifier: "summary",
        title: "Summary",
        icon: LucideMessageSquareWarning,
        component: (
          <div className="w-full h-full overflow-y-auto overflow-x-hidden">
            <QueryProgressLog progress={progress} />
          </div>
        ),
      });
    }

    return (
      <WindowTabs
        key="main-window-tab"
        onSelectChange={setQueryTabIndex}
        onTabsChange={() => {}}
        hideCloseButton
        selected={queryTabIndex}
        tabs={queryTabs}
      />
    );
  }, [progress, queryTabIndex, data, databaseDriver]);

  return (
    <ResizablePanelGroup direction="vertical">
      <ResizablePanel style={{ position: "relative" }}>
        <div className="absolute left-0 right-0 top-0 bottom-0 flex flex-col">
          <div className="border-b pl-3 pr-1 py-3 flex dark:bg-neutral-950 bg-neutral-50">
            <div className="text-sm shrink-0 items-center flex text-secondary-foreground p-1">
              {namespaceName} /
            </div>
            <div className="inline-block relative">
              <span className="inline-block text-sm p-1 outline-none font-semibold min-w-[175px] border border-background opacity-0">
                &nbsp;{name}
              </span>
              <input
                onBlur={(e) => {
                  changeCurrentTab({
                    title: e.currentTarget.value || "Unnamed Query",
                  });
                }}
                placeholder="Please name your query"
                spellCheck="false"
                className="absolute top-0 right-0 left-0 bottom-0 text-sm p-1 outline-none font-semibold focus:border-secondary-foreground rounded bg-transparent"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
              />
            </div>

            <div className="flex-1" />

            <div className="flex gap-2">
              {docDriver && (
                <SaveDocButton
                  onComplete={onSaveComplete}
                  onPrepareContent={onPrepareSaveContent}
                  docId={savedKey}
                />
              )}

              <div className="flex">
                <button
                  onClick={() => onRunClicked()}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "rounded-r-none"
                  )}
                >
                  <LucidePlay className="w-4 h-4 mr-2" />
                  Run
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className={cn(
                        buttonVariants({ size: "sm" }),
                        "rounded-l-none border-l"
                      )}
                    >
                      <CaretDown size={12} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onRunClicked()}>
                      Run Current Statement
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onRunClicked(true)}>
                      Run All Statements
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onRunClicked(false, true)}>
                      Explain Current Statement
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          <div className="grow overflow-hidden p-2 dark:bg-neutral-950 bg-neutral-50">
            <SqlEditor
              ref={editorRef}
              dialect={databaseDriver.getFlags().dialect}
              value={code}
              onChange={setCode}
              schema={autoCompleteSchema}
              fontSize={fontSize}
              onFontSizeChanged={setFontSize}
              onCursorChange={(_, line, col) => {
                setLineNumber(line);
                setColumnNumber(col);
              }}
              onKeyDown={(e) => {
                if (KEY_BINDING.run.match(e)) {
                  onRunClicked();
                  e.preventDefault();
                } else if (KEY_BINDING.format.match(e)) {
                  onFormatClicked();
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            />
          </div>
          <div className="grow-0 shrink-0">
            <div className="flex gap-1 pb-2 px-2">
              <div className="grow items-center flex text-xs mr-2 gap-2 pl-4">
                <div>Ln {lineNumber}</div>
                <div>Col {columnNumber + 1}</div>
              </div>
              <div>
                {Object.keys(placeHolders).length > 0 && (
                  <QueryPlaceholder
                    placeHolders={placeHolders}
                    onChange={setPlaceHolders}
                  />
                )}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={"ghost"}
                    size="sm"
                    onClick={onFormatClicked}
                    className="text-neutral-800 dark:text-neutral-200"
                  >
                    Format
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="p-4">
                  <p className="mb-2">
                    <span className="inline-block py-1 px-2 rounded bg-secondary text-secondary-foreground">
                      {KEY_BINDING.format.toString()}
                    </span>
                  </p>
                  <p>Format SQL queries for readability</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>
      </ResizablePanel>
      <ResizableHandle orientation="horizontal" withHandle />
      <ResizablePanel defaultSize={50} style={{ position: "relative" }}>
        {windowTab}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

export function getSingleTableName(query: string): string | null {
  try {
    // Normalize query by removing extra spaces and converting to lowercase
    const normalizedQuery = query.replace(/\s+/g, " ").trim().toLowerCase();

    // Match the table names after "from" keyword
    const fromMatch = normalizedQuery.match(
      /from\s+([^\s,;]+(?:\s*,\s*[^\s,;]+)*)/i
    );
    const joinMatches = normalizedQuery.match(/join\s+([^\s,;]+)/gi);

    // If there are JOINs, more than one table is referenced
    if (joinMatches && joinMatches.length > 0) {
      return null;
    }

    // Check if a single table is present
    if (fromMatch) {
      const tableName = fromMatch[1];

      // Ensure no additional tables are mentioned
      const additionalTablesMatch = tableName.match(/,\s*[^\s,;]+/);
      if (additionalTablesMatch) {
        return null;
      }

      return tableName;
    }

    // No table found
    return null;
  } catch (e) {
    return null;
  }
}
