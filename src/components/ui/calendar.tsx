"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import { DayButton, DayPicker, getDefaultClassNames } from "react-day-picker";

import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "bg-slate-800 text-slate-200 group/calendar p-4 [--cell-size:2.5rem] border border-slate-600 rounded-lg shadow-lg",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-4 md:flex-row",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 mb-2",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50 text-slate-300 hover:text-purple-400 hover:bg-purple-500/20 border-slate-600",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "h-[--cell-size] w-[--cell-size] select-none p-0 aria-disabled:opacity-50 text-slate-300 hover:text-purple-400 hover:bg-purple-500/20 border-slate-600",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-[--cell-size] w-full items-center justify-center px-[--cell-size] text-slate-200 font-semibold",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-[--cell-size] w-full items-center justify-center gap-1.5 text-sm font-medium text-slate-200",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "has-focus:border-purple-500 border-slate-600 shadow-xs has-focus:ring-purple-500/50 has-focus:ring-[3px] relative rounded-md border bg-slate-700",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "bg-slate-700 text-slate-200 absolute inset-0 opacity-0",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "select-none font-medium text-slate-200",
          captionLayout === "label"
            ? "text-base"
            : "[&>svg]:text-slate-400 flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5",
          defaultClassNames.caption_label
        ),
        table: "w-full border-collapse",
        weekdays: cn("flex", defaultClassNames.weekdays),
        weekday: cn(
          "text-slate-400 flex-1 select-none rounded-md text-[0.8rem] font-semibold uppercase tracking-wider",
          defaultClassNames.weekday
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-[--cell-size] select-none text-slate-400",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-slate-400 select-none text-[0.8rem] font-medium",
          defaultClassNames.week_number
        ),
        day: cn(
          "group/day relative aspect-square h-full w-full select-none p-0 text-center [&:first-child[data-selected=true]_button]:rounded-l-md [&:last-child[data-selected=true]_button]:rounded-r-md",
          defaultClassNames.day
        ),
        range_start: cn(
          "bg-purple-500/30 border-purple-400 rounded-l-md",
          defaultClassNames.range_start
        ),
        range_middle: cn(
          "bg-purple-500/20 rounded-none",
          defaultClassNames.range_middle
        ),
        range_end: cn(
          "bg-purple-500/30 border-purple-400 rounded-r-md",
          defaultClassNames.range_end
        ),
        today: cn(
          "bg-purple-500/20 text-purple-300 border-purple-400 rounded-md data-[selected=true]:rounded-none font-semibold",
          defaultClassNames.today
        ),
        outside: cn(
          "text-slate-500 aria-selected:text-slate-500 opacity-50",
          defaultClassNames.outside
        ),
        disabled: cn("text-slate-600 opacity-30", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          );
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon
                className={cn("size-4 text-slate-300", className)}
                {...props}
              />
            );
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon
                className={cn("size-4 text-slate-300", className)}
                {...props}
              />
            );
          }

          return (
            <ChevronDownIcon
              className={cn("size-4 text-slate-300", className)}
              {...props}
            />
          );
        },
        DayButton: CalendarDayButton,
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-[--cell-size] items-center justify-center text-center text-slate-400">
                {children}
              </div>
            </td>
          );
        },
        ...components,
      }}
      {...props}
    />
  );
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  ...props
}: React.ComponentProps<typeof DayButton>) {
  const defaultClassNames = getDefaultClassNames();

  const ref = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus();
  }, [modifiers.focused]);

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString()}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "text-slate-200 hover:bg-purple-500/20 hover:text-purple-300 hover:border-purple-500/50 transition-colors duration-200",
        "data-[selected-single=true]:bg-purple-500 data-[selected-single=true]:text-white data-[selected-single=true]:border-purple-400",
        "data-[range-middle=true]:bg-purple-500/30 data-[range-middle=true]:text-purple-200",
        "data-[range-start=true]:bg-purple-500 data-[range-start=true]:text-white data-[range-start=true]:border-purple-400",
        "data-[range-end=true]:bg-purple-500 data-[range-end=true]:text-white data-[range-end=true]:border-purple-400",
        "group-data-[focused=true]/day:border-purple-400 group-data-[focused=true]/day:ring-purple-500/50",
        "flex aspect-square h-auto w-full min-w-[--cell-size] flex-col gap-1 font-medium leading-none",
        "data-[range-end=true]:rounded-md data-[range-middle=true]:rounded-none data-[range-start=true]:rounded-md",
        "group-data-[focused=true]/day:relative group-data-[focused=true]/day:z-10 group-data-[focused=true]/day:ring-[3px]",
        "[&>span]:text-xs [&>span]:opacity-70",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  );
}

export { Calendar, CalendarDayButton };
