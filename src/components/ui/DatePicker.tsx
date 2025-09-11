import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Calendar } from "./calendar";
import { format } from "date-fns";
import { Button } from "./button";

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

export function DatePicker({ date, onDateChange }: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleSelect = (selected?: Date) => {
    if (selected) {
      onDateChange(selected);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full h-12 justify-start text-left font-normal rounded-2xl bg-white text-black border-exv-border hover:bg-white"
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {format(date, "dd/MM/yyyy")}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border border-exv-border bg-white text-black">
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          initialFocus
          className="p-3 text-black"
          classNames={{
            months: "flex flex-col space-y-4",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center",
            caption_label: "text-sm font-medium",
            nav: "space-x-1 flex items-center",
            nav_button:
              "h-8 w-8 rounded-full border border-exv-border hover:bg-gray-100",
            nav_button_previous: "absolute left-2",
            nav_button_next: "absolute right-2",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell: "w-8 h-8 font-normal text-[0.8rem] text-gray-500",
            row: "flex w-full mt-2",
            cell: "relative p-0 text-center",
            // ↓↓↓ petits ronds + focus + hover
            day:
              "h-8 w-8 p-0 rounded-full font-normal hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-exv-accent aria-selected:opacity-100",
            day_today: "bg-gray-100 text-black",
            day_selected: "bg-exv-accent text-exv-primary hover:bg-exv-accent",
            day_outside: "text-gray-300 opacity-60",
            day_disabled: "text-gray-300 opacity-50",
            day_range_middle: "rounded-full",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
