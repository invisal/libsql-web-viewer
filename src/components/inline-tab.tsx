import { cn } from "@/lib/utils";
import React, { PropsWithChildren, ReactElement } from "react";

interface InlineTabItemProps {
  title: string;
}

interface InlineTabProps {
  children: ReactElement<PropsWithChildren<InlineTabItemProps>>[];
  selected?: number;
  onChange?: (selected: number) => void;
}

export function InlineTab({ children, selected, onChange }: InlineTabProps) {
  const childrenArray = React.Children.toArray(children) as ReactElement<
    PropsWithChildren<InlineTabItemProps>
  >[];

  // Loop through children and get its props
  return (
    <div>
      <ul className="flex text-xs">
        <li className="w-6 border-b"></li>
        {childrenArray.map((child, idx) => {
          return (
            <li
              onClick={() => {
                if (selected !== idx && onChange) {
                  onChange(idx);
                }
              }}
              className={cn(
                "px-3 py-2 cursor-pointer",
                selected === idx
                  ? "font-bold border-x border-t rounded-t"
                  : "border-b"
              )}
              key={idx}
            >
              {child.props.title}
            </li>
          );
        })}
        <li className="grow border-b"></li>
      </ul>
      <div>{childrenArray[selected ?? 0]}</div>
    </div>
  );
}

export function InlineTabItem({
  children,
}: PropsWithChildren<InlineTabItemProps>) {
  return <div>{children}</div>;
}
