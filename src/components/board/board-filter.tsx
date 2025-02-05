"use client";
import { convertTimeToMilliseconds } from "@/lib/convertNumber";
import {
  CalendarDays,
  Check,
  ChevronDown,
  Ellipsis,
  ListFilter,
  ListOrdered,
  RefreshCcw,
  Search,
} from "lucide-react";
import { useCallback, useState } from "react";
import { buttonVariants } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import {
  BoardFilterDialog,
  BoardFilterProps,
  DEFAULT_DATE_FILTER,
} from "./board-filter-dialog";
import { BoardTool } from "./board-tool";

interface Props {
  name: string;
  filters: BoardFilterProps[];
  onFilters: (f: BoardFilterProps[]) => void;
  editMode: "ADD_CHART" | "REARRANGING_CHART" | null;
  setEditMode: (v: "ADD_CHART" | "REARRANGING_CHART") => void;
  interval: number;
  setInterval: (v: number) => void;
  onRefresh?: () => void;
}

export function BoardFilter(props: Props) {
  const [show, setShow] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectIndex, setSelectIndex] = useState<number | undefined>(undefined);

  const toggleShow = useCallback(() => setShow(!show), [show]);

  const intervals = [
    "5s",
    "10s",
    "30s",
    "1m",
    "5m",
    "15m",
    "30m",
    "1h",
    "2h",
    "1d",
  ];

  const onFilter = useCallback(() => {
    const data = [
      ...props.filters,
      {
        type: "search",
        default_value: "",
        value: "",
        name: "",
        new: true,
      },
    ];
    props.onFilters(data);
    setSelectIndex(data.length - 1);
    setOpen(true);
  }, [props]);

  const mapFilterItem = props.filters.map((x, i) => {
    const icon =
      x.type === "search" ? (
        <Search className="h-3 w-3" />
      ) : x.type === "enum" ? (
        <ListOrdered className="h-3 w-3" />
      ) : (
        <CalendarDays className="h-3 w-3" />
      );
    const input =
      x.type === "search" ? (
        <input
          placeholder={`Enter ${x.name}`}
          value={x.default_value}
          onChange={(v) => {
            const data = structuredClone(props.filters);
            data[i].default_value = v.target.value;
            props.onFilters(data);
          }}
          className="max-w-14 outline-0"
        />
      ) : x.type === "enum" ? (
        <div className="z-100">
          <Popover>
            <PopoverTrigger asChild>
              <div
                className={
                  x.default_value
                    ? "px-2 py-1"
                    : "text-muted-foreground px-2 py-1"
                }
              >
                <div>{x.default_value || `Select ${x.name}`}</div>
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
              {x.value.split(",").map((v, idx) => {
                return (
                  <div
                    key={v + idx}
                    className="flex items-center justify-center gap-2"
                  >
                    <Checkbox
                      id={v + idx}
                      checked={x.default_value.split(",").includes(v)}
                      onCheckedChange={(checked) => {
                        const value = x.default_value.split(",");
                        const data = structuredClone(props.filters);

                        if (checked) {
                          data[i].default_value = [...value, v]
                            .filter((f) => !!f)
                            .join(",");
                        } else {
                          value.filter((f) => f !== v);
                          data[i].default_value = value
                            .filter((f) => f !== v)
                            .join(",");
                        }
                        props.onFilters(data);
                      }}
                    />
                    <label htmlFor={v + idx}>{v}</label>
                  </div>
                );
              })}
            </PopoverContent>
          </Popover>
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div
              className={
                x.default_value
                  ? "px-2 py-1"
                  : "text-muted-foreground px-2 py-1"
              }
            >
              <div>{x.default_value || `Select ${x.name}`}</div>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {DEFAULT_DATE_FILTER.map((date) => {
              return (
                <DropdownMenuItem
                  key={date}
                  onClick={() => {
                    const data = structuredClone(props.filters);
                    data[i].default_value = date;
                    props.onFilters(data);
                  }}
                >
                  <div className="flex items-center gap-2">
                    {date}
                    {date === x.default_value && <Check className="h-3 w-3" />}
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      );
    return (
      <div
        key={i}
        className="bg-secondary flex items-center rounded-md text-xs"
      >
        <div className="border-background flex items-center gap-1 border-r-[1px] border-solid px-2 py-1">
          {icon}
          {x.name}
        </div>
        <div
          className={
            x.default_value ? "px-2 py-1" : "text-muted-foreground px-2 py-1"
          }
        >
          {input}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <div className="hover:bg-background mr-2 cursor-pointer rounded-md p-1">
              <Ellipsis className="h-3 w-3" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              className="text-xs"
              onClick={() => {
                setSelectIndex(i);
                setOpen(true);
              }}
            >
              Edit filter
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-xs"
              onClick={() => {
                props.onFilters([
                  ...props.filters.filter((_, idx) => idx !== i),
                ]);
              }}
            >
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  });

  return (
    <>
      <BoardTool editMode={props.editMode} setEditMode={props.setEditMode} />
      <div className="sticky top-0 z-50 bg-neutral-100 px-1 pt-0 pb-2 dark:bg-neutral-950">
        <div className="flex items-center justify-between border border-x-0 px-1 py-2">
          <div>
            <button
              className={buttonVariants({ size: "sm", variant: "ghost" })}
              onClick={toggleShow}
            >
              {show ? "Hide" : "Show"} Filter
            </button>
          </div>
          <div>{props.name}</div>
          <div>
            <button
              className={buttonVariants({ size: "sm", variant: "ghost" })}
              onClick={() => {
                props.onRefresh && props.onRefresh();
              }}
            >
              <div className="flex items-center gap-2">
                <div>
                  <RefreshCcw className="h-4 w-4" />
                </div>
                <div>
                  {props.interval === 0 ? "" : `${props.interval / 1000}s`}
                </div>
              </div>
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={buttonVariants({ size: "sm", variant: "ghost" })}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem
                  checked={props.interval === 0}
                  onClick={() => {
                    props.setInterval(0);
                  }}
                >
                  Off
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={props.interval === convertTimeToMilliseconds("5m")}
                  onClick={() => {
                    props.setInterval(convertTimeToMilliseconds("5m"));
                  }}
                >
                  Auto
                </DropdownMenuCheckboxItem>
                {intervals.map((interval) => {
                  const ms = convertTimeToMilliseconds(interval);
                  return (
                    <DropdownMenuCheckboxItem
                      key={interval}
                      checked={props.interval === ms}
                      onClick={() => {
                        props.setInterval(ms);
                      }}
                    >
                      {interval}
                    </DropdownMenuCheckboxItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className={show ? "px-2 pt-4" : "hidden"}>
          {open && selectIndex !== undefined && (
            <BoardFilterDialog
              onClose={() => {
                setOpen(false);
                if (props.filters[selectIndex].new === true) {
                  props.onFilters([
                    ...props.filters.filter((_, i) => i !== selectIndex),
                  ]);
                  setSelectIndex(undefined);
                }
              }}
              filter={props.filters[selectIndex]}
              onFilter={(v) => {
                const data = structuredClone(props.filters);
                data[selectIndex] = v;
                props.onFilters(data);
              }}
              onAddFilter={() => {
                const data = structuredClone(props.filters);
                data[selectIndex].new = false;
                setOpen(false);
                props.onFilters(data);
              }}
            />
          )}
          <div className="flex flex-wrap gap-3">
            {mapFilterItem}
            <button
              className={buttonVariants({ size: "sm", variant: "ghost" })}
              onClick={onFilter}
            >
              <ListFilter className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
