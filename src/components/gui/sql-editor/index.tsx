import CodeMirror, {
  EditorView,
  Extension,
  ReactCodeMirrorRef,
} from "@uiw/react-codemirror";
import { indentUnit, LanguageSupport } from "@codemirror/language";
import {
  acceptCompletion,
  completionStatus,
  startCompletion,
} from "@codemirror/autocomplete";
import { sql, SQLNamespace, MySQL as MySQLDialect } from "@codemirror/lang-sql";
import { forwardRef, KeyboardEventHandler, useMemo } from "react";

import { defaultKeymap, insertTab } from "@codemirror/commands";
import { keymap } from "@codemirror/view";
import { KEY_BINDING } from "@/lib/key-matcher";
import useCodeEditorTheme from "./use-editor-theme";
import createSQLTableNameHighlightPlugin from "./sql-tablename-highlight";
import { sqliteDialect } from "@/drivers/sqlite/sqlite-dialect";
import { functionTooltip } from "./function-tooltips";
import sqliteFunctionList from "@/drivers/sqlite/function-tooltip.json";
import { toast } from "sonner";
import SqlStatementHighlightPlugin from "./statement-highlight";
import { SupportedDialect } from "@/drivers/base-driver";

interface SqlEditorProps {
  value: string;
  dialect: SupportedDialect;
  readOnly?: boolean;
  onChange?: (value: string) => void;
  schema?: SQLNamespace;
  onKeyDown?: KeyboardEventHandler<HTMLDivElement>;
  fontSize?: number;
  onFontSizeChanged?: (fontSize: number) => void;
  onCursorChange?: (
    pos: number,
    lineNumber: number,
    columnNumber: number
  ) => void;
}

const SqlEditor = forwardRef<ReactCodeMirrorRef, SqlEditorProps>(
  function SqlEditor(
    {
      dialect,
      value,
      onChange,
      schema,
      onKeyDown,
      onCursorChange,
      readOnly,
      fontSize,
      onFontSizeChanged,
    }: SqlEditorProps,
    ref
  ) {
    const theme = useCodeEditorTheme({ fontSize });

    const tableNameHighlightPlugin = useMemo(() => {
      if (schema) {
        return createSQLTableNameHighlightPlugin(Object.keys(schema));
      }
      return createSQLTableNameHighlightPlugin([]);
    }, [schema]);

    const keyExtensions = useMemo(() => {
      return keymap.of([
        {
          key: KEY_BINDING.run.toCodeMirrorKey(),
          preventDefault: true,
          run: () => true,
        },
        {
          key: "Tab",
          preventDefault: true,
          run: (target) => {
            if (completionStatus(target.state) === "active") {
              acceptCompletion(target);
            } else {
              insertTab(target);
            }
            return true;
          },
        },
        {
          key: "Space",
          preventDefault: true,
          run: (target) => {
            if (completionStatus(target.state) === "active") {
              acceptCompletion(target);
            } else {
              target.dispatch({
                changes: {
                  from: target.state.selection.main.from,
                  insert: " ",
                },
                selection: { anchor: target.state.selection.main.anchor + 1 },
              });
            }
            return true;
          },
        },
        {
          key: "Ctrl-Space",
          mac: "Cmd-i",
          preventDefault: true,
          run: startCompletion,
        },
        {
          key: "Ctrl-=",
          mac: "Cmd-=",
          preventDefault: true,
          run: () => {
            if (onFontSizeChanged) {
              const newFontSize = Math.min(2, (fontSize ?? 1) + 0.2);
              onFontSizeChanged(newFontSize);
              toast.info(
                `Change code editor font size to ${Math.floor(newFontSize * 100)}%`,
                { duration: 1000, id: "font-size" }
              );
            }
            return true;
          },
        },
        {
          key: "Ctrl--",
          mac: "Cmd--",
          preventDefault: true,
          run: () => {
            if (onFontSizeChanged) {
              const newFontSize = Math.max(0.4, (fontSize ?? 1) - 0.2);
              onFontSizeChanged(newFontSize);
              toast.info(
                `Change code editor font size to ${Math.floor(newFontSize * 100)}%`,
                { duration: 1000, id: "font-size" }
              );
            }
            return true;
          },
        },
        ...defaultKeymap,
      ]);
    }, [fontSize, onFontSizeChanged]);

    const extensions = useMemo(() => {
      let sqlDialect: LanguageSupport | undefined = undefined;
      let tooltipExtension: Extension | undefined = undefined;

      if (dialect === "sqlite") {
        sqlDialect = sql({
          dialect: sqliteDialect,
          schema,
        });
        tooltipExtension = functionTooltip(sqliteFunctionList);
      } else {
        sqlDialect = sql({
          dialect: MySQLDialect,
          schema,
        });
      }

      return [
        EditorView.baseTheme({
          "& .cm-line": {
            borderLeft: "3px solid transparent",
            paddingLeft: "10px",
          },
          "& .cm-focused": {
            outline: "none !important",
          },
        }),
        keyExtensions,
        indentUnit.of("  "),
        sqlDialect,
        tooltipExtension,
        tableNameHighlightPlugin,
        SqlStatementHighlightPlugin,
        EditorView.updateListener.of((state) => {
          const pos = state.state.selection.main.head;
          const line = state.state.doc.lineAt(pos);
          const lineNumber = line.number;
          const columnNumber = pos - line.from;
          if (onCursorChange) onCursorChange(pos, lineNumber, columnNumber);
        }),
      ].filter(Boolean) as Extension[];
    }, [
      dialect,
      onCursorChange,
      keyExtensions,
      schema,
      tableNameHighlightPlugin,
    ]);

    return (
      <CodeMirror
        ref={ref}
        autoFocus
        readOnly={readOnly}
        onKeyDown={onKeyDown}
        basicSetup={{
          defaultKeymap: false,
          drawSelection: false,
        }}
        theme={theme}
        indentWithTab={false}
        value={value}
        height="100%"
        onChange={onChange}
        style={{
          fontSize: 20,
          height: "100%",
        }}
        extensions={extensions}
      />
    );
  }
);

export default SqlEditor;
