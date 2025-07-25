import * as React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar(props: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className="rounded-lg border bg-white p-2 shadow"
      classNames={{
        caption: "text-sm font-medium text-gray-800 mb-2",
        nav: "flex items-center justify-between",
        nav_button: "p-1 hover:bg-gray-100 rounded",
        head_row: "flex justify-between mb-1",
        head_cell: "text-xs text-gray-500 w-8 text-center",
        row: "flex justify-between",
        cell: "w-8 h-8 text-center text-sm hover:bg-blue-100 rounded-full",
        selected: "bg-blue-600 text-white hover:bg-blue-700",
      }}
      {...props}
    />
  );
}
