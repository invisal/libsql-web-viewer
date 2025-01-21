import OptimizeTable, {
  OptimizeTableHeaderWithIndexProps,
} from "@/components/gui/table-optimized";
import OptimizeTableState from "@/components/gui/table-optimized/OptimizeTableState";
import { KEY_BINDING } from "@/lib/key-matcher";
import {
  LucideChevronDown,
  LucidePin,
  LucideSortAsc,
  LucideSortDesc,
} from "lucide-react";
import React, {
  PropsWithChildren,
  useCallback,
  useMemo,
  useState,
} from "react";
import { ColumnSortOption } from "@/drivers/base-driver";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";
import useTableResultContextMenu from "./table-result/context-menu";
import { cn } from "@/lib/utils";
import { exportDataAsDelimitedText } from "../lib/export-helper";

interface ResultTableProps {
  data: OptimizeTableState;
  tableName?: string;
  onSortColumnChange?: (columns: ColumnSortOption[]) => void;
  sortColumns?: ColumnSortOption[];
  visibleColumnIndexList?: number[];
}

function Header({
  children,
  header,
  internalState,
}: PropsWithChildren<{
  header: OptimizeTableHeaderWithIndexProps;
  internalState: OptimizeTableState;
}>) {
  const [open, setOpen] = useState(false);
  const colIndex = header.index;

  let textClass = "grow line-clamp-1 font-mono font-bold";
  let thClass = "flex grow items-center px-2 overflow-hidden";

  if (internalState.getSelectedColIndex().includes(colIndex)) {
    if (internalState.isFullSelectionCol(colIndex)) {
      textClass = "grow line-clamp-1 font-mono font-bold text-white font-bold";
      thClass =
        "flex grow items-center px-2 overflow-hidden bg-blue-600 dark:bg-blue-900";
    } else {
      textClass =
        "grow line-clamp-1 font-mono font-bold dark:text-white font-bold";
      thClass =
        "flex grow items-center px-2 overflow-hidden bg-blue-200 dark:bg-blue-400";
    }
  }

  return (
    <div className={thClass}>
      <div
        className={thClass}
        onMouseDown={(e) => {
          if (e.button === 2) {
            setOpen(true);
            e.preventDefault();
          } else {
            const focusCell = internalState.getFocus();
            if (e.shiftKey && focusCell) {
              internalState.selectColRange(focusCell.x, colIndex);
            } else if (e.ctrlKey && focusCell) {
              internalState.addSelectionCol(colIndex);
              internalState.setFocus(0, colIndex);
            } else {
              internalState.selectColumn(colIndex);
              internalState.setFocus(0, colIndex);
            }
          }
        }}
      >
        {header.icon ? <div className="mr-2">{header.icon}</div> : null}
        <div className={textClass}>{header.displayName}</div>
      </div>
      <div>
        <DropdownMenu modal={false} onOpenChange={setOpen} open={open}>
          <DropdownMenuTrigger asChild>
            <LucideChevronDown
              className={cn(
                "text-mute w-4 h-4 cursor-pointer flex-shrink-0",
                textClass
              )}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={"w-[300px]"}
            side="bottom"
            align="start"
            sideOffset={0}
          >
            {children}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

export default function ResultTable({
  data,
  tableName,
  onSortColumnChange,
  visibleColumnIndexList,
}: ResultTableProps) {
  const [stickyHeaderIndex, setStickHeaderIndex] = useState<number>();

  const headerIndex = useMemo(() => {
    if (visibleColumnIndexList) return visibleColumnIndexList;
    return data.getHeaders().map((_, idx) => idx);
  }, [data, visibleColumnIndexList]);

  const renderHeader = useCallback(
    (header: OptimizeTableHeaderWithIndexProps) => {
      const foreignKeyInfo = header.foreignKey ? (
        <div className="p-2">
          <div className="text-xs p-2 bg-yellow-200 text-black rounded">
            <h2 className="font-semibold">Foreign Key</h2>
            <p className="mt-1 font-mono">
              {header.foreignKey.foreignTableName}.
              {(header.foreignKey.foreignColumns ?? [])[0]}
            </p>
          </div>
        </div>
      ) : undefined;

      const generatedExpression =
        header.headerData?.constraint?.generatedExpression;
      const generatedInfo = generatedExpression ? (
        <div className="p-2">
          <div className="text-xs p-2 bg-blue-200 text-black rounded">
            <h2 className="font-semibold">Generated Expression</h2>
            <pre className="text-sm">
              <code>{generatedExpression}</code>
            </pre>
          </div>
        </div>
      ) : undefined;

      return (
        <Header header={header} internalState={data}>
          {foreignKeyInfo}
          {generatedInfo}
          <DropdownMenuItem
            onClick={() => {
              setStickHeaderIndex(
                header.index === stickyHeaderIndex ? undefined : header.index
              );
            }}
          >
            <LucidePin className="w-4 h-4 mr-2" />
            Pin Header
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!tableName}
            onClick={() => {
              if (onSortColumnChange) {
                onSortColumnChange([{ columnName: header.name, by: "ASC" }]);
              }
            }}
          >
            <LucideSortAsc className="w-4 h-4 mr-2" />
            Sort A → Z
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!tableName}
            onClick={() => {
              if (onSortColumnChange) {
                onSortColumnChange([{ columnName: header.name, by: "DESC" }]);
              }
            }}
          >
            <LucideSortDesc className="w-4 h-4 mr-2" />
            Sort Z → A
          </DropdownMenuItem>
        </Header>
      );
    },
    [data, tableName, stickyHeaderIndex, onSortColumnChange]
  );

  const onHeaderContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const copyCallback = useCallback(
    (state: OptimizeTableState) => {
      const focus = state.getFocus();
      if (focus) {
        const y = focus.y;
        const x = focus.x;
        const selectedRange = state.getSelectionRange(y, x);
        if (
          selectedRange &&
          (selectedRange.x1 !== selectedRange.x2 ||
            selectedRange.y1 !== selectedRange.y2)
        ) {
          const headers = data
            .getHeaders()
            .filter(
              (_, index) =>
                index >= selectedRange.x1 && index <= selectedRange.x2
            )
            .map((header) => header.name);
          const records = data
            .getAllRows()
            .filter(
              (_, index) =>
                index >= selectedRange.y1 && index <= selectedRange.y2
            )
            .map((row) => headers.map((header) => row.raw[header]));
          exportDataAsDelimitedText(
            [],
            records,
            "\t",
            "\r\n",
            '"',
            "clipboard"
          );
        } else {
          window.navigator.clipboard.writeText(state.getValue(y, x) as string);
        }
      }
    },
    [data]
  );

  const pasteCallback = useCallback((state: OptimizeTableState) => {
    const focus = state.getFocus();
    if (focus) {
      const y = focus.y;
      const x = focus.x;
      window.navigator.clipboard.readText().then((pasteValue) => {
        const data = pasteValue.split("\r\n").map((row) => row.split("\t"));

        for (let row = 0; row < data.length; row++) {
          for (let col = 0; col < data[row].length; col++) {
            console.log(row, col, data[row][col]);
            state.changeValue(
              y + row,
              x + col,
              data[row][col].toLowerCase() === "null" ? null : data[row][col]
            );
          }
        }
      });
    }
  }, []);

  const onCellContextMenu = useTableResultContextMenu({
    tableName,
    data,
    copyCallback,
    pasteCallback,
  });

  const onShiftKeyDownCallBack = useCallback(
    (state: OptimizeTableState, e: React.KeyboardEvent) => {
      const focus = state.getFocus();
      if (e.shiftKey && focus) {
        let lastMove = null;
        if (state.getLastMove()) {
          lastMove = state.getLastMove();
        } else {
          const selectedRange = state.getSelectionRange(focus.y, focus.x);
          if (selectedRange)
            lastMove = { x: selectedRange.x2, y: selectedRange.y2 };
        }

        if (lastMove) {
          const rows = state.getRowsCount();
          const cols = state.getHeaderCount();
          let newRow = lastMove.y;
          let newCol = lastMove.x;
          let horizontal: "right" | "left" = "left";
          let vertical: "top" | "bottom" = "bottom";
          if (e.key === "ArrowUp") {
            newRow = Math.max(lastMove.y - 1, 0);
            horizontal = "left";
            vertical = "top";
          }
          if (e.key === "ArrowDown") {
            horizontal = "left";
            vertical = "bottom";
            newRow = Math.min(lastMove.y + 1, rows - 1);
          }
          if (e.key === "ArrowLeft") {
            horizontal = "left";
            vertical = "top";
            newCol = Math.max(lastMove.x - 1, 0);
          }
          if (e.key === "ArrowRight") {
            horizontal = "right";
            vertical = "top";
            newCol = Math.min(lastMove.x + 1, cols - 1);
          }

          state.selectCellRange(focus.y, focus.x, newRow, newCol);
          state.setLastMove(newRow, newCol);
          state.scrollToCell(horizontal, vertical, { x: newCol, y: newRow });
        }
      }
    },
    []
  );

  const onKeyDown = useCallback(
    (state: OptimizeTableState, e: React.KeyboardEvent) => {
      if (state.isInEditMode()) return;

      if (KEY_BINDING.copy.match(e as React.KeyboardEvent<HTMLDivElement>)) {
        copyCallback(state);
      } else if (
        KEY_BINDING.paste.match(e as React.KeyboardEvent<HTMLDivElement>)
      ) {
        pasteCallback(state);
      } else if (e.key === "ArrowRight") {
        if (e.shiftKey) {
          onShiftKeyDownCallBack(state, e);
        } else {
          const focus = state.getFocus();
          if (focus && focus.x + 1 < state.getHeaderCount()) {
            state.setFocus(focus.y, focus.x + 1);
            state.scrollToCell("right", "top", { y: focus.y, x: focus.x + 1 });
          }
        }
      } else if (e.key === "ArrowLeft") {
        if (e.shiftKey) {
          onShiftKeyDownCallBack(state, e);
        } else {
          const focus = state.getFocus();
          if (focus && focus.x - 1 >= 0) {
            state.setFocus(focus.y, focus.x - 1);
            state.scrollToCell("left", "top", { y: focus.y, x: focus.x - 1 });
          }
        }
      } else if (e.key === "ArrowUp") {
        if (e.shiftKey) {
          onShiftKeyDownCallBack(state, e);
        } else {
          const focus = state.getFocus();
          if (focus && focus.y - 1 >= 0) {
            state.setFocus(focus.y - 1, focus.x);
            state.scrollToCell("left", "top", { y: focus.y - 1, x: focus.x });
          }
        }
      } else if (e.key === "ArrowDown") {
        if (e.shiftKey) {
          onShiftKeyDownCallBack(state, e);
        } else {
          const focus = state.getFocus();
          if (focus && focus.y + 1 < state.getRowsCount()) {
            state.setFocus(focus.y + 1, focus.x);
            state.scrollToCell("left", "bottom", {
              y: focus.y + 1,
              x: focus.x,
            });
          }
        }
      } else if (e.key === "Tab") {
        const focus = state.getFocus();
        if (focus) {
          const colCount = state.getHeaderCount();
          const n = focus.y * colCount + focus.x + 1;
          const x = n % colCount;
          const y = Math.floor(n / colCount);
          if (y >= state.getRowsCount()) return;
          state.setFocus(y, x);
          state.scrollToCell(x === 0 ? "left" : "right", "bottom", {
            y: y,
            x: x,
          });
        }
      } else if (e.key === "Enter") {
        state.enterEditMode();
      }

      e.preventDefault();
    },
    [copyCallback, onShiftKeyDownCallBack, pasteCallback]
  );

  return (
    <OptimizeTable
      internalState={data}
      onContextMenu={onCellContextMenu}
      onHeaderContextMenu={onHeaderContextMenu}
      stickyHeaderIndex={stickyHeaderIndex}
      arrangeHeaderIndex={headerIndex}
      renderAhead={20}
      renderHeader={renderHeader}
      rowHeight={35}
      onKeyDown={onKeyDown}
    />
  );
}
