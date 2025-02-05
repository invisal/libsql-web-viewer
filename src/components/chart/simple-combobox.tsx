"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface SimpleComboValue {
  value: string;
  label: string;
}
interface SimpleComboboxProps {
  values: SimpleComboValue[];
  onChange: (v: string) => void;
  placeholder?: string;
  selected?: string;
}

export function SimpleCombobox({
  values,
  onChange,
  placeholder,
  selected,
}: SimpleComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedValue, setSelectedValue] = React.useState<string | null>(
    selected || null
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {values
            ? values.find((value) => value.value === selectedValue)?.label
            : placeholder || ""}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {values.map((value) => (
                <CommandItem
                  key={value.value}
                  value={value.value}
                  onSelect={(currentValue) => {
                    setSelectedValue(currentValue);
                    onChange(currentValue);
                    setOpen(false);
                  }}
                >
                  {value.label}
                  <Check
                    className={cn(
                      "ml-auto",
                      selectedValue === value.value
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
