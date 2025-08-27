"use client";

import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { Checkbox } from "./ui/checkbox";
import { ScrollArea } from "./ui/scroll-area";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Trash2 } from "lucide-react";
import { addTodo, deleteTodo, getTodos, setTodoCompleted, TodoItem } from "@/lib/todos";

const TodoList = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getTodos();
        setTodos(data);
      } catch (e) {
        setTodos([]);
      }
    };
    load();
  }, []);

  const handleAdd = async () => {
    if (!newTodo.trim()) return;
    const created = await addTodo(newTodo, new Date().toISOString().split('T')[0]);
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
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(item.id!)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
          {todos.length === 0 && (
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">No todos yet.</div>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TodoList;
