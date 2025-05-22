"use client";
import React, { useEffect, useState } from "react";
import Badge from "../ui/badge/Badge";
import { BoxIconLine, GroupIcon } from "@/icons";
import axios, {  } from "axios";
import Cookies from "js-cookie";

export const EcommerceMetrics = () => {
  const [userCount, setUserCount] = useState<number | null>(null);
  const [departmentCount, setDepartmentCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Récupération du token depuis les cookies
        const tokenCookie = Cookies.get("authTokens");
        if (!tokenCookie) {
          console.error("Token d'accès introuvable");
          setError("Utilisateur non authentifié");
          return;
        }
        const tokenData = JSON.parse(tokenCookie);
        const accessToken = tokenData.access;

        // Récupération de la liste des utilisateurs
        const userListResponse = await axios.get(
          "https://www.backend.lnb-intranet.globalitnet.org/utilisateurs/user-list/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        setUserCount(userListResponse.data.length);

        // Récupération de la liste des départements
        const departmentsResponse = await axios.get(
          "https://www.backend.lnb-intranet.globalitnet.org/services/departments/",
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (
          departmentsResponse.data &&
          Array.isArray(departmentsResponse.data.departments)
        ) {
          setDepartmentCount(departmentsResponse.data.departments.length);
        } else {
          setError("La structure des données pour les départements n'est pas celle attendue.");
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          console.error("Erreur axios :", error);
          setError(
            error.response && error.response.status === 404
              ? "Endpoint non trouvé. Vérifiez l'URL de l'API."
              : "Erreur lors de la récupération des métriques"
          );
        } else {
          console.error("Erreur inattendue :", error);
          setError("Erreur lors de la récupération des métriques");
        }
      }
    };

    fetchMetrics();
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* Metric Utilisateurs */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Utilisateurs</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {userCount !== null ? userCount : "Chargement..."}
            </h4>
          </div>
          <Badge color="success">Inscrits</Badge>
        </div>
      </div>

      {/* Metric Départements */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Départements</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {departmentCount !== null ? departmentCount : "Chargement..."}
            </h4>
          </div>
          <Badge color="error">
            Actifs
          </Badge>
        </div>
      </div>

      {error && <div className="col-span-2 text-red-500">{error}</div>}
    </div>
  );
};
