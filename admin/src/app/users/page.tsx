"use client";

import { User, columns } from "./columns";
import { DataTable } from "./data-table";
import { useEffect, useState } from "react";
import { getAllUsers, AdminUserListItem } from "@/lib/users";

const UsersPage = () => {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const users = await getAllUsers();
        const mapped: User[] = users.map((u) => ({
          id: u.id,
          avatar: u.avatar || "/users/1.png",
          fullName: u.fullName || u.email || u.id,
          email: u.email || "",
          status: (u.status as any) || "active",
        }));
        setData(mapped);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="">
      <div className="mb-8 px-4 py-2 bg-secondary rounded-md">
        <h1 className="font-semibold">All Users</h1>
      </div>
      {loading ? (
        <div className="p-6">Loading users...</div>
      ) : (
        <DataTable columns={columns} data={data} />
      )}
    </div>
  );
};

export default UsersPage;
