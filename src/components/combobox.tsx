import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "./ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface ComboboxProps {
  value?: string;
  onChange: (value: string) => void;
  items?: { value: string; text: string }[];
}

export default function Combobox({ value, items, onChange }: ComboboxProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="flex justify-between w-full">
          {value || "No column selected"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[250px] p-0" side="bottom" align="start">
        <Command>
          <CommandInput placeholder="Search column name..." />

          <CommandEmpty>No column found.</CommandEmpty>
          <CommandGroup className="max-h-[250px] overflow-y-auto">
            {(items ?? []).map((item) => (
              <CommandItem
                key={item.value}
                value={item.value}
                onSelect={() => {
                  onChange(item.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {item.text}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
