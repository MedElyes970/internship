"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar } from "./ui/calendar";
import { Input } from "./ui/input";
import { addTodo, deleteTodo, getTodosByDate, setTodoCompleted, toDateKey, TodoItem } from "@/lib/todos";

const TodoList = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [open, setOpen] = useState(false);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");

  const dateKey = useMemo(() => (date ? toDateKey(date) : toDateKey(new Date())), [date]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTodosByDate(dateKey);
        setTodos(data);
      } catch (e) {
        setTodos([]);
      }
    };
    load();
  }, [dateKey]);

  const handleAdd = async () => {
    if (!newTodo.trim()) return;
    const created = await addTodo(newTodo, dateKey);
    setTodos((prev) => [...prev, created]);
    setNewTodo("");
  };

  const handleToggle = async (id: string, checked: boolean) => {
    await setTodoCompleted(id, checked);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: checked } : t)));
  };

  const handleDelete = async (id: string) => {
    await deleteTodo(id);
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };
  return (
    <div className="">
      <h1 className="text-lg font-medium mb-6">Todo List</h1>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button className="w-full">
            <CalendarIcon />
            {date ? format(date, "PPP") : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-auto">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(date) => {
              setDate(date);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
      {/* Add */}
      <div className="flex gap-2 mt-4">
        <Input
          placeholder="Add a todo..."
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
        />
        <Button onClick={handleAdd}>Add</Button>
      </div>

      {/* LIST */}
      <ScrollArea className="max-h-[400px] mt-4 overflow-y-auto">
        <div className="flex flex-col gap-4">
          {todos.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center gap-4">
                <Checkbox
                  id={item.id}
                  checked={item.completed}
                  onCheckedChange={(c) => handleToggle(item.id!, Boolean(c))}
                />
                <label htmlFor={item.id} className="text-sm text-muted-foreground flex-1">
                  {item.text}
                </label>
                <Button variant="outline" size="sm" onClick={() => handleDelete(item.id!)}>
                  Delete
                </Button>
              </div>
            </Card>
          ))}
          {todos.length === 0 && (
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">No todos for this date.</div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TodoList;
