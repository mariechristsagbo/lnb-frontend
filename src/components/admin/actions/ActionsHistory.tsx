"use client";
import React, { useState } from "react";
import Badge from "../../ui/badge/Badge";
import { ClockIcon, UserIcon, TrashIcon, ChevronDownIcon, ChevronRightIcon, DocumentIcon, FolderIcon } from "@heroicons/react/24/outline";

interface ActionItem {
  id: number;
  user: string;
  role: string;
  action: string;
  date: string;
  status: string;
  deletedObjects?: DeletedObject[];
}

interface DeletedObject {
  id: string;
  type: "document" | "folder";
  name: string;
  children?: DeletedObject[]; // For tree structure
}

const deletedSampleObjects: DeletedObject[] = [
  {
    id: "1",
    type: "folder",
    name: "Dossiers RH",
    children: [
      {
        id: "1-1",
        type: "document",
        name: "Contrat_JeanD.pdf",
      },
      {
        id: "1-2",
        type: "document",
        name: "Evaluation_2025.xlsx",
      },
      {
        id: "1-3",
        type: "folder",
        name: "Archives 2024",
        children: [
          {
            id: "1-3-1",
            type: "document",
            name: "Ancien_CV.pdf",
          },
        ],
      },
    ],
  },
  {
    id: "2",
    type: "document",
    name: "Règlement_Interne.docx",
  },
];

const actionsStatic: ActionItem[] = [
  {
    id: 1,
    user: "Jean Dupont",
    role: "Administrateur",
    action: "Création d'un nouvel utilisateur",
    date: "2025-05-08 10:15",
    status: "Succès",
  },
  {
    id: 2,
    user: "Marie Leroy",
    role: "Utilisateur",
    action: "Modification de son mot de passe",
    date: "2025-05-08 09:42",
    status: "Succès",
  },
  {
    id: 3,
    user: "Pierre Martin",
    role: "Administrateur",
    action: "Suppression d'un ou plusieurs objets",
    date: "2025-05-07 16:05",
    status: "Succès",
    deletedObjects: deletedSampleObjects,
  },
  {
    id: 4,
    user: "Sarah Bernard",
    role: "Utilisateur",
    action: "Tentative de connexion",
    date: "2025-05-07 08:23",
    status: "Échec",
  },
  {
    id: 5,
    user: "Admin LNB",
    role: "Administrateur",
    action: "Ajout d'un nouveau département",
    date: "2025-05-06 15:02",
    status: "Succès",
  },
];

const TreeObject: React.FC<{
  object: DeletedObject;
  onDelete: (id: string) => void;
}> = ({ object, onDelete }) => {
  const [open, setOpen] = useState(false);

  const hasChildren = object.children && object.children.length > 0;
  return (
    <div className="ml-4 my-1">
      <div className="flex items-center gap-2">
        {hasChildren ? (
          <button
            className="focus:outline-none"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Réduire" : "Dérouler"}
          >
            {open ? (
              <ChevronDownIcon className="w-4 h-4 text-yellow-600" />
            ) : (
              <ChevronRightIcon className="w-4 h-4 text-yellow-600" />
            )}
          </button>
        ) : (
          <span className="w-4 h-4" />
        )}
        {object.type === "folder" ? (
          <FolderIcon className="w-5 h-5 text-yellow-700" />
        ) : (
          <DocumentIcon className="w-5 h-5 text-yellow-700" />
        )}
        <span className="text-gray-800">{object.name}</span>
        <button
          className="ml-1 rounded hover:bg-red-100 p-1 transition"
          title="Supprimer définitivement"
          onClick={() => onDelete(object.id)}
        >
          <TrashIcon className="w-4 h-4 text-red-600" />
        </button>
      </div>
      {hasChildren && open && (
        <div>
          {object.children?.map((child) => (
            <TreeObject key={child.id} object={child} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
};

export const ActionsHistory: React.FC = () => {
  const [actions, setActions] = useState<ActionItem[]>(actionsStatic);

  const handleDeleteObject = (actionId: number, objectId: string) => {
    setActions((prev) =>
      prev.map((a) => {
        if (a.id !== actionId || !a.deletedObjects) return a;
        // Recursively remove object with objectId
        const removeObj = (objs: DeletedObject[]): DeletedObject[] =>
          objs
            .filter((obj) => obj.id !== objectId)
            .map((obj) =>
              obj.children
                ? { ...obj, children: removeObj(obj.children) }
                : obj
            );
        return { ...a, deletedObjects: removeObj(a.deletedObjects) };
      })
    );
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-sm border border-yellow-100">
      <div className="flex items-center space-x-2 p-6 border-b border-yellow-100">
        <ClockIcon className="text-yellow-700 w-7 h-7" />
        <h2 className="text-xl font-semibold text-yellow-800">
          Historique des actions
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-yellow-100">
          <thead>
            <tr className="bg-yellow-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-yellow-700 uppercase tracking-wider">
                Statut
              </th>
            </tr>
          </thead>
          <tbody>
            {actions.map((item) => (
              <React.Fragment key={item.id}>
                <tr className="hover:bg-yellow-50 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-yellow-700" />
                    <span className="font-medium text-gray-800">{item.user}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={item.role === "Administrateur" ? "warning" : "info"}>
                      {item.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {item.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{item.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge color={item.status === "Succès" ? "success" : "error"}>
                      {item.status}
                    </Badge>
                  </td>
                </tr>
                {/* Affichage de l'arbre pour les objets supprimés */}
                {item.deletedObjects && (
                  <tr className="bg-yellow-50">
                    <td colSpan={5} className="px-6 py-2">
                      <div className="mb-2 flex items-center gap-2">
                        <TrashIcon className="w-5 h-5 text-red-600" />
                        <span className="text-base font-medium text-red-700">
                          Objets supprimés :
                        </span>
                      </div>
                      <div>
                        {item.deletedObjects.map((obj) => (
                          <TreeObject
                            key={obj.id}
                            object={obj}
                            onDelete={(objId) => handleDeleteObject(item.id, objId)}
                          />
                        ))}
                        {item.deletedObjects.length === 0 && (
                          <span className="text-gray-400 text-sm">
                            Tous les objets supprimés ont été définitivement effacés.
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 text-xs text-gray-500 border-t border-yellow-100">
        Historique affiché à titre d&apos;exemple. (Actions statiques, gestion locale de la suppression visuelle)
      </div>
    </div>
  );
};

export default ActionsHistory;