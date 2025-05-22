"use client"; // Nécessaire car useParams est un hook client

import React from "react";
import { useParams } from "next/navigation";
import EditWorkflowClient from "./EditWorkflowClient"; // Assurez-vous que le chemin est correct

export default function EditWorkflowPage() {
  const params = useParams();
  // Extrait l'ID et s'assure que c'est une chaîne ou undefined
  const id = params?.id as string | undefined;

  // Gère le cas où l'ID n'est pas présent dans l'URL
  if (!id) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-600 text-lg">
          Erreur : ID du workflow manquant dans l&apos;URL.
        </p>
      </div>
    );
  }

  // Affiche le composant client en lui passant l'ID
  return (
    // Vous pouvez ajuster la structure/style externe si nécessaire
    <div className="container mx-auto px-4 py-8">
      {/* Le composant client prend l'ID comme prop */}
      <EditWorkflowClient id={id} />
    </div>
  );
}