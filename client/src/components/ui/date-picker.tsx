import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  className?: string
  mode?: "single" | "range" | "multiple"
  selected?: Date | DateRange | Date[]
  onSelect?: (date: Date | DateRange | Date[] | undefined) => void
}

export function DatePicker({
  className,
  mode = "single",
  selected,
  onSelect,
}: DatePickerProps) {
  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !selected && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selected instanceof Date ? (
              format(selected, "PPP")
            ) : selected instanceof Object && "from" in selected && selected.from ? (
              selected.to ? (
                <>
                  {format(selected.from, "LLL dd, y")} -{" "}
                  {format(selected.to, "LLL dd, y")}
                </>
              ) : (
                format(selected.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode={mode}
            defaultMonth={
              selected instanceof Date
                ? selected
                : selected instanceof Object && "from" in selected && selected.from
                  ? selected.from
                  : new Date()
            }
            selected={selected}
            onSelect={onSelect}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}