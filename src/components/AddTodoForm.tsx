"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { CalendarIcon, Gem, Bookmark } from "lucide-react";
import { useState, useEffect } from "react";
import type { Todo } from "@/types";
import { handleCalendarSelect } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { toast } from "sonner";

// Generate 15-minute intervals for time selection
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      const displayString = `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`;
      options.push({ value: timeString, label: displayString });
    }
  }
  return options;
};

const timeOptions = generateTimeOptions();

const formSchema = z
  .object({
    title: z
      .string()
      .min(2, { message: "Der Titel muss mindestens 2 Zeichen lang sein." }),
    startDateTime: z.date(),
    endDateTime: z.date(),
    type: z.enum(["event", "task"]),
    xp_value: z.transform(Number),
  })
  .refine((data) => data.endDateTime >= data.startDateTime, {
    message: "Die Endzeit muss nach der Startzeit liegen.",
    path: ["endDateTime"],
  });

type AddTodoFormProps = {
  onSuccess: (newTodo: Todo) => void;
};

export default function AddTodoForm({ onSuccess }: AddTodoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClientComponentClient();

  // Load favorite type from localStorage immediately (not in useEffect)
  const getInitialType = () => {
    if (typeof window !== "undefined") {
      const savedFavorite = localStorage.getItem("todo-favorite-type") as
        | "event"
        | "task"
        | null;
      return savedFavorite || "event";
    }
    return "event";
  };

  // Round current time to next 15-minute interval (00, 15, 30, 45)
  const getRoundedCurrentTime = () => {
    const now = new Date();
    const minutes = now.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 15) * 15;
    
    // If rounding goes to 60, add an hour and set minutes to 0
    if (roundedMinutes === 60) {
      now.setHours(now.getHours() + 1);
      now.setMinutes(0);
    } else {
      now.setMinutes(roundedMinutes);
    }
    
    now.setSeconds(0);
    now.setMilliseconds(0);
    return now;
  };

  const [favoriteType, setFavoriteType] = useState<"event" | "task">(
    getInitialType
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: getInitialType(),
      xp_value: 20,
      startDateTime: getRoundedCurrentTime(),
      endDateTime: (() => {
        const start = getRoundedCurrentTime();
        // Add 30 minutes for events
        start.setMinutes(start.getMinutes() + 30);
        return start;
      })(),
    },
  });

  const handleFavoriteClick = (type: "event" | "task") => {
    setFavoriteType(type);
    localStorage.setItem("todo-favorite-type", type);
    toast.success(
      `"${type === "event" ? "Termin" : "Aufgabe"}" als Favorit gespeichert!`
    );
  };

  const taskType = useWatch({ control: form.control, name: "type" });
  const startDateTimeValue = useWatch({
    control: form.control,
    name: "startDateTime",
  });

  useEffect(() => {
    if (taskType === "task" && startDateTimeValue) {
      if (
        form.getValues("endDateTime")?.getTime() !==
        startDateTimeValue.getTime()
      ) {
        form.setValue("endDateTime", startDateTimeValue, {
          shouldValidate: true,
        });
      }
    }
  }, [taskType, startDateTimeValue, form]);

  const handleTimeChange = (
    timeString: string,
    currentDate: Date | undefined
  ) => {
    if (!currentDate) return new Date();

    const [hours, minutes] = timeString.split(":").map(Number);
    const newDate = new Date(currentDate);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/create-todo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: values.title,
          startDateTime: values.startDateTime.toISOString(),
          endDateTime: values.endDateTime.toISOString(),
          type: values.type,
          xp_value: values.xp_value || 10,
        }),
      });

      if (response.status === 401) {
        toast.error(
          "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an."
        );
        await supabase.auth.signOut();
        window.location.href = "/login";
        return;
      }

      if (!response.ok) {
        toast.error(
          "Fehler beim Erstellen des Todos. Bitte versuche es erneut."
        );
        throw new Error("Fehler beim Erstellen des Todos");
      }

      const newTodo: Todo = await response.json();
      onSuccess(newTodo);
      form.reset();
      toast.success("Todo erfolgreich erstellt!");
    } catch (error) {
      console.error("Fehler beim Erstellen des Todos:", error);
      toast.error("Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-4">
              <FormLabel className="text-slate-200 font-semibold">
                Typ
              </FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  value={field.value}
                  className="flex space-x-6"
                >
                  <div className="flex items-center space-x-3 group">
                    <RadioGroupItem
                      value="event"
                      id="type-event"
                      className="border-purple-500 text-purple-200"
                    />
                    <Label
                      htmlFor="type-event"
                      className="font-normal text-slate-300 cursor-pointer"
                    >
                      Termin
                    </Label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleFavoriteClick("event");
                      }}
                      className={cn(
                        "ml-1 transition-opacity",
                        favoriteType === "event"
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                      title="Als Favorit markieren"
                    >
                      <Bookmark
                        className={cn(
                          "w-4 h-4 transition-all",
                          favoriteType === "event"
                            ? "fill-blue-400 text-blue-400"
                            : "text-slate-400 hover:text-blue-400"
                        )}
                      />
                    </button>
                  </div>
                  <div className="flex items-center space-x-3 group">
                    <RadioGroupItem
                      value="task"
                      id="type-task"
                      className="border-purple-500 text-purple-200"
                    />
                    <Label
                      htmlFor="type-task"
                      className="font-normal text-slate-300 cursor-pointer"
                    >
                      Aufgabe
                    </Label>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        handleFavoriteClick("task");
                      }}
                      className={cn(
                        "ml-1 transition-opacity",
                        favoriteType === "task"
                          ? "opacity-100"
                          : "opacity-0 group-hover:opacity-100"
                      )}
                      title="Als Favorit markieren"
                    >
                      <Bookmark
                        className={cn(
                          "w-4 h-4 transition-all",
                          favoriteType === "task"
                            ? "fill-blue-400 text-blue-400"
                            : "text-slate-400 hover:text-blue-400"
                        )}
                      />
                    </button>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200 font-semibold">
                Titel
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Neues Todo..."
                  {...field}
                  autoFocus
                  className="bg-slate-800/50 border-slate-600 text-slate-200 placeholder:text-slate-400 focus:border-purple-500 focus:ring-purple-500/20"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="startDateTime"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-slate-200 font-semibold">
                Start
              </FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700/50 hover:border-purple-500 hover:text-white",
                        !field.value && "text-slate-400"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP HH:mm")
                      ) : (
                        <span>Wähle ein Datum</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 text-white" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-auto p-0 bg-slate-800 border-slate-600"
                    align="start"
                  >
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        const newDateTime = handleCalendarSelect(
                          date,
                          field.value
                        );
                        field.onChange(newDateTime);

                        if (newDateTime) {
                          const currentType = form.getValues("type");
                          if (currentType === "event") {
                            const endTime = new Date(newDateTime);
                            endTime.setMinutes(endTime.getMinutes() + 30);
                            form.setValue("endDateTime", endTime);
                          } else {
                            form.setValue("endDateTime", newDateTime);
                          }
                        }
                      }}
                      initialFocus
                      className="bg-slate-800 text-slate-200"
                    />
                    <div className="p-3 border-t border-slate-600">
                      <Select
                        value={field.value ? format(field.value, "HH:mm") : ""}
                        onValueChange={(timeString) => {
                          const newDateTime = handleTimeChange(
                            timeString,
                            field.value
                          );
                          field.onChange(newDateTime);
                        }}
                      >
                        <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-200 hover:bg-slate-700/50 hover:border-purple-500 hover:text-white">
                          <SelectValue placeholder="Zeit wählen" />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600 text-slate-200 max-h-60">
                          {timeOptions.map((option) => (
                            <SelectItem
                              key={option.value}
                              value={option.value}
                              className="text-slate-200 hover:bg-purple-500/20 hover:text-purple-300 focus:bg-purple-500/30 focus:text-purple-200"
                            >
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </PopoverContent>
                </Popover>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {taskType === "event" && (
          <FormField
            control={form.control}
            name="endDateTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-slate-200 font-semibold">
                  Ende
                </FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal bg-slate-800/50 border-slate-600 text-slate-200 hover:bg-slate-700/50 hover:border-purple-500 hover:text-white",
                          !field.value && "text-slate-400"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP HH:mm")
                        ) : (
                          <span>Wähle ein Datum</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 text-white" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-auto p-0 bg-slate-800 border-slate-600"
                      align="start"
                    >
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                        disabled={(date) => {
                          const startDate = form.getValues("startDateTime");
                          return startDate
                            ? date < new Date(startDate.toDateString())
                            : false;
                        }}
                        className="bg-slate-800 text-slate-200"
                      />
                      <div className="p-3 border-t border-slate-600">
                        <Select
                          value={
                            field.value ? format(field.value, "HH:mm") : ""
                          }
                          onValueChange={(timeString) => {
                            const newDateTime = handleTimeChange(
                              timeString,
                              field.value
                            );
                            field.onChange(newDateTime);
                          }}
                        >
                          <SelectTrigger className="bg-slate-700/50 border-slate-600 text-slate-200">
                            <SelectValue placeholder="Zeit wählen" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-600 text-slate-200 max-h-60">
                            {timeOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                                className="text-slate-200 hover:bg-purple-500/20 hover:text-purple-300 focus:bg-purple-500/30 focus:text-purple-200"
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </PopoverContent>
                  </Popover>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="xp_value"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200 font-semibold flex items-center gap-2">
                <Gem className="w-4 h-4 text-purple-400" />
                Schwierigkeit
              </FormLabel>
              <FormControl className="flex justify-start gap-2">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  onValueChange={field.onChange}
                  className="justify-start"
                >
                  <ToggleGroupItem
                    value="10"
                    aria-label="Leicht"
                    className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-green-500/20 hover:border-green-500 data-[state=on]:bg-green-500/30 data-[state=on]:border-green-400 data-[state=on]:text-green-300 hover:text-white px-4 py-2 h-auto min-w-[100px]"
                  >
                    <div className="flex flex-col items-center justify-center w-full">
                      <p>Easy</p>
                      <p className="text-xs opacity-80">(10 XP)</p>
                    </div>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="20"
                    aria-label="Mittel"
                    className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-yellow-500/20 hover:border-yellow-500 data-[state=on]:bg-yellow-500/30 data-[state=on]:border-yellow-400 data-[state=on]:text-yellow-300 hover:text-white px-4 py-2 h-auto min-w-[100px]"
                  >
                    <div className="flex flex-col items-center justify-center w-full">
                      <p>Medium</p>
                      <p className="text-xs opacity-80">(20 XP)</p>
                    </div>
                  </ToggleGroupItem>
                  <ToggleGroupItem
                    value="30"
                    aria-label="Schwer"
                    className="bg-slate-800/50 border-slate-600 text-slate-300 hover:bg-red-500/20 hover:border-red-500 data-[state=on]:bg-red-500/30 data-[state=on]:border-red-400 data-[state=on]:text-red-300 hover:text-white px-4 py-2 h-auto min-w-[100px]"
                  >
                    <div className="flex flex-col items-center justify-center w-full">
                      <p>Hard</p>
                      <p className="text-xs opacity-80">(30 XP)</p>
                    </div>
                  </ToggleGroupItem>
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold py-3 text-lg shadow-lg hover:shadow-purple-500/25 transition-all duration-200"
        >
          {isSubmitting ? "Speichere..." : "Todo erstellen"}
        </Button>
      </form>
    </Form>
  );
}
