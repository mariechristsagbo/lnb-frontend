import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
//import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import { BoxIcon } from "@/icons";
import Link from 'next/link'; // Importez le composant Link

interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  telephone: string;
  adresse: string | null;
  date_naissance: string;
  lieu_naissance: string;
  statut: string;
  photo_profil: string | null;
  is_connected: boolean;
  session_count: number;
  last_login: string;
  otp_enabled: boolean;
  ip_info: {
    ip: string;
    bogon: boolean;
  };
}

const usersData: User[] = [
  {
    id: 12,
    nom: "DSI",
    prenom: "DSI",
    email: "dsi@lnb.bj",
    role: "Administrateur Système",
    telephone: "+2290197979797",
    adresse: null,
    date_naissance: "2024-01-01",
    lieu_naissance: "Ganhi",
    statut: "actif",
    photo_profil: null,
    is_connected: false,
    session_count: 0,
    last_login: "2025-02-25 17:00:22",
    otp_enabled: false,
    ip_info: {
      ip: "127.0.0.1",
      bogon: true,
    },
  },
  // Ajoutez d'autres utilisateurs ici
];

export default function UsersPage() {
  return (
    <div>
      <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
        <div className="mx-auto w-full text-center">
          <div className="mb-6">
            <div className="flex items-center gap-5 justify-center">
              <Link href="/adduser/"> {/* Lien vers la page d'ajout */}
                <Button size="sm" variant="outline" startIcon={<BoxIcon />}>
                  Ajouter
                </Button>
              </Link>
              <Link href="/updateuser/"> {/* Lien vers la page de modification */}
                <Button size="sm" variant="outline" startIcon={<BoxIcon />}>
                  Modifier
                </Button>
              </Link>
              <Link href="/deleteuser/"> {/* Lien vers la page de suppression */}
                <Button size="sm" variant="outline" startIcon={<BoxIcon />}>
                  Supprimer
                </Button>
              </Link>
              <Link href="/attributuser/"> {/* Lien vers la page d'attributions */}
                <Button size="sm" variant="outline" startIcon={<BoxIcon />}>
                  Attributions
                </Button>
              </Link>
              <Link href="/notifuser/"> {/* Lien vers la page de notifications */}
                <Button size="sm" variant="outline" startIcon={<BoxIcon />}>
                  Notifications
                </Button>
              </Link>
            </div>
          </div>

          {/* Tableau listant les utilisateurs */}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03] w-full">
            <div className="w-full overflow-x-auto">
              <Table className="w-full">
                <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      ID
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Nom
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Prénom
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Email
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Rôle
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Téléphone
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Statut
                    </TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                      Dernière connexion
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {usersData.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="px-5 py-4 text-start">{user.id}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{user.nom}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{user.prenom}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{user.email}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{user.role}</TableCell>
                      <TableCell className="px-5 py-4 text-start">{user.telephone}</TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        <Badge
                          size="sm"
                          color={user.statut === "actif" ? "success" : "warning"}
                        >
                          {user.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-4 text-start">
                        {new Date(user.last_login).toLocaleString()}
                      </TableCell>
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
