"use client";

import { useState } from "react";
import { X, ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

/**
 * MultiSelectPopover Component
 *
 * A reusable multi-select component with popover interface
 *
 * @param {Array} options - Array of options to select from
 * @param {Array} selected - Array of currently selected values
 * @param {Function} onSelectionChange - Callback when selection changes
 * @param {string} placeholder - Placeholder text when nothing is selected
 * @param {boolean} loading - Whether options are loading
 * @param {string} className - Additional CSS classes
 * @param {string} popoverContentClassName - Additional CSS classes for PopoverContent. Use z-[60] for dropdowns inside a Sheet to ensure proper layering above the sheet (z-50).
 */
export default function MultiSelectPopover({
  options = [],
  selected = [],
  onSelectionChange,
  placeholder = "Select items...",
  loading = false,
  className = "",
  popoverContentClassName = "",
}) {
  const [open, setOpen] = useState(false);

  const handleSelect = (value) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value];
    onSelectionChange?.(newSelected);
  };

  const removeItem = (value, e) => {
    e.stopPropagation();
    const newSelected = selected.filter((item) => item !== value);
    onSelectionChange?.(newSelected);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-full justify-between h-auto min-h-[40px] p-2 bg-transparent ${className}`}
        >
          <div className="flex flex-wrap gap-1 flex-1">
            {selected.length === 0 ? (
              <span className="text-muted-foreground">{placeholder}</span>
            ) : (
              selected.map((item) => (
                <Badge key={item} variant="secondary" className="text-xs">
                  {item}
                  <button
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        removeItem(item, e);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => removeItem(item, e)}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={`w-full p-0 ${popoverContentClassName}`}
        align="start"
      >
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
          />
          <CommandList>
            <CommandEmpty>
              {loading
                ? "Loading..."
                : `No ${placeholder.toLowerCase()} found.`}
            </CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  value={option}
                  onSelect={() => handleSelect(option)}
                >
                  <Check
                    className={`mr-2 h-4 w-4 ${
                      selected.includes(option) ? "opacity-100" : "opacity-0"
                    }`}
                  />
                  {option}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
