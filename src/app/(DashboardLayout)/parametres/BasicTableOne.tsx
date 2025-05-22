import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { BoxIcon } from "@/icons";

interface Task {
  id: number;
  title: string;
  description: string;
  created_at: string;
  updated_at: string;
  status: string;
  priority: string;
  workflow: number;
  assigned_to: number;
  created_by: number;
  updated_by: number;
}

const tasksData: Task[] = [
  {
    id: 0,
    title: "Titre de la tâche",
    description: "Description de la tâche",
    created_at: "2019-08-24T14:15:22Z",
    updated_at: "2019-08-24T14:15:22Z",
    status: "pending",
    priority: "low",
    workflow: 0,
    assigned_to: 0,
    created_by: 0,
    updated_by: 0,
  },
  // Ajoutez d'autres tâches ici
];

export default function TasksPage() {
  return (
    <div>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full text-center">
          <div className="mb-6">
            <div className="flex items-center gap-5 justify-center">
              <Button size="sm" variant="outline" startIcon={<BoxIcon />}>
                Ajouter
              </Button>
              <Button size="md" variant="outline" startIcon={<BoxIcon />}>
                Modifier
              </Button>
              <Button size="md" variant="outline" startIcon={<BoxIcon />}>
                Supprimer
              </Button>
              <Button size="md" variant="outline" startIcon={<BoxIcon />}>
                Attributions
              </Button>
              <Button size="md" variant="outline" startIcon={<BoxIcon />}>
                Notifications
              </Button>
            </div>
          </div>

          {/* Tableau listant les tâches */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] w-full">
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      ID
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Titre
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Description
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Date de création
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Date de modification
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Statut
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Priorité
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Workflow
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Assignée à
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Créée par
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Mise à jour par
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {tasksData.map((task) => (
                    <TableRow key={task.id}>
                      <TableCell className="px-5 py-4 text-start">{task.id}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{task.title}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{task.description}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{new Date(task.created_at).toLocaleString()}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{new Date(task.updated_at).toLocaleString()}</TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <Badge
                          size="sm"
                          color={
                            task.status === "pending"
                              ? "warning"
                              : task.status === "completed"
                              ? "success"
                              : "error"
                          }
                        >
                          {task.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">{task.priority}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{task.workflow}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{task.assigned_to}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{task.created_by}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{task.updated_by}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          {/* Fin du tableau */}
        </div>
      </div>
    </div>
  );
}
