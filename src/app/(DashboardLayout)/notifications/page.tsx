import React from "react";
import { NotificationsPanel } from "./BasicTableOne";

export default function BasicTables() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <NotificationsPanel />
    </div>
  );
}