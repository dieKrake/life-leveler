"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { addHours } from "date-fns/addHours";
import { CalendarIcon } from "lucide-react";
import { useState, useEffect } from "react";
import type { Todo } from "@/types";
import { handleCalendarSelect, handleTimeInputChange } from "@/lib/dateUtils";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Calendar } from "@/components/ui/calendar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

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
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      type: "event",
      xp_value: 20,
    },
  });

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

  async function onSubmit(values: z.infer<typeof formSchema>) {
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

      if (!response.ok) {
        if (response.status === 401) {
          await supabase.auth.signOut();
          window.location.href = "/login";
          return;
        }
        throw new Error("Fehler beim Erstellen des Todos.");
      }

      const newTodo: Todo = await response.json();
      onSuccess(newTodo);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Typ</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex space-x-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="event" id="type-event" />
                    <Label htmlFor="type-event" className="font-normal">
                      Termin
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="task" id="type-task" />
                    <Label htmlFor="type-task" className="font-normal">
                      Aufgabe
                    </Label>
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
              <FormLabel>Titel</FormLabel>
              <FormControl>
                <Input placeholder="Neues Todo..." {...field} />
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
              <FormLabel>Start</FormLabel>
              <FormControl>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "pl-3 text-left font-normal",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP HH:mm")
                      ) : (
                        <span>Wähle ein Datum</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
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
                            form.setValue(
                              "endDateTime",
                              addHours(newDateTime, 1)
                            );
                          } else {
                            form.setValue("endDateTime", newDateTime);
                          }
                        }
                      }}
                      initialFocus
                    />
                    <div className="p-3 border-t border-border">
                      <Input
                        type="time"
                        defaultValue={format(
                          field.value || new Date(),
                          "HH:mm"
                        )}
                        onChange={(e) => {
                          const newDateTime = handleTimeInputChange(
                            e.target.value,
                            field.value
                          );
                          field.onChange(newDateTime);
                        }}
                      />
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
                <FormLabel>Ende</FormLabel>
                <FormControl>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP HH:mm")
                        ) : (
                          <span>Wähle ein Datum</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
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
                      />
                      <div className="p-3 border-t border-border">
                        <Input
                          type="time"
                          defaultValue={format(
                            field.value ||
                              addHours(
                                form.getValues("startDateTime") || new Date(),
                                1
                              ),
                            "HH:mm"
                          )}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value
                              .split(":")
                              .map(Number);
                            const newDate = new Date(field.value || new Date());
                            newDate.setHours(hours, minutes);
                            field.onChange(newDate);
                          }}
                        />
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
              <FormLabel>Schwierigkeit</FormLabel>
              <FormControl className="flex justify-start gap-2">
                <ToggleGroup
                  type="single"
                  variant="outline"
                  onValueChange={field.onChange}
                >
                  <ToggleGroupItem value="10" aria-label="Leicht">
                    Easy
                  </ToggleGroupItem>
                  <ToggleGroupItem value="20" aria-label="Mittel">
                    Medium
                  </ToggleGroupItem>
                  <ToggleGroupItem value="30" aria-label="Schwer">
                    Hard
                  </ToggleGroupItem>
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Speichere..." : "Todo erstellen"}
        </Button>
      </form>
    </Form>
  );
}
