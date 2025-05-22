"use client";

import React from "react";
import Button from "@/components/ui/button/Button";
import Image from 'next/image';

export default function SecurityPage() {
  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto">
        {/* En-tête */}
        <div className="bg-blue-600 text-white p-6 rounded-lg mb-6">
          <h1 className="text-3xl font-bold">Sécurité</h1>
          <p className="text-lg">Protégez vos données et accédez aux outils de sécurité.</p>
          <Button className="bg-red-700 text-white mt-4">
            Signaler un incident
          </Button>   
        </div>

        {/* Section 1 : Alertes de Sécurité */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Alertes de Sécurité</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-100 p-4 rounded-lg flex items-center gap-4">
              <span className="text-2xl">⚠️</span>
              <div>
                <h3 className="font-semibold">Mise à jour critique disponible</h3>
                <p className="text-sm">Mettez à jour votre système dès que possible.</p>
              </div>
              <Button variant="primary" className="ml-auto">
                En savoir plus
              </Button>
            </div>
            <div className="bg-yellow-100 p-4 rounded-lg flex items-center gap-4">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-semibold">Nouvelle politique de sécurité</h3>
                <p className="text-sm">Consultez les nouvelles directives.</p>
              </div>
              <Button variant="primary" className="ml-auto">
                En savoir plus
              </Button>
            </div>
          </div>
        </div>

        {/* Section 2 : Politiques et Procédures */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Politiques et Procédures</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-2xl">📄</span>
              <div>
                <h3 className="font-semibold">Politique de sécurité</h3>
                <p className="text-sm">Téléchargez le document officiel.</p>
              </div>
              <Button variant="primary" className="ml-auto">
                Télécharger
              </Button>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <span className="text-2xl">📄</span>
              <div>
                <h3 className="font-semibold">Guide des bonnes pratiques</h3>
                <p className="text-sm">Découvrez les meilleures pratiques de sécurité.</p>
              </div>
              <Button variant="primary" className="ml-auto">
                Télécharger
              </Button>
            </div>
          </div>
        </div>

        {/* Section 3 : Outils de Sécurité */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Outils de Sécurité</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
              <span className="text-3xl">🔑</span>
              <h3 className="font-semibold mt-2">Gestion des mots de passe</h3>
              <p className="text-sm">Changez ou réinitialisez votre mot de passe.</p>
              <Button variant="primary" className="mt-4">
                Accéder
              </Button>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
              <span className="text-3xl">🔐</span>
              <h3 className="font-semibold mt-2">Authentification à deux facteurs</h3>
              <p className="text-sm">Activez l&apos;authentification à deux facteurs.</p>
              <Button variant="primary" className="mt-4">
                Accéder
              </Button>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow text-center">
              <span className="text-3xl">🛡️</span>
              <h3 className="font-semibold mt-2">Analyse de sécurité</h3>
              <p className="text-sm">Vérifiez la sécurité de votre compte.</p>
              <Button variant="primary" className="mt-4">
                Accéder
              </Button>
            </div>
          </div>
        </div>

        {/* Section 4 : Formation et Sensibilisation */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Formation et Sensibilisation</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Image src="/phishing-training.jpg" alt="Formation Phishing" className="rounded-lg mb-4" width={500} height={300} />
              <h3 className="font-semibold">Reconnaître les emails de phishing</h3>
              <p className="text-sm mb-4">Apprenez à identifier les emails suspects.</p>
              <Button variant="primary">Commencer la formation</Button>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
              <Image src="/cybersecurity-training.jpg" alt="Formation Cybersécurité" className="rounded-lg mb-4" width={500} height={300} />
              <h3 className="font-semibold">Introduction à la cybersécurité</h3>
              <p className="text-sm mb-4">Découvrez les bases de la cybersécurité.</p>
              <Button variant="primary">Commencer la formation</Button>
            </div>
          </div>
        </div>

        {/* Section 5 : Historique des Incidents */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Historique des Incidents</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
              <thead>
                <tr>
                  <th className="p-4 text-left">Date</th>
                  <th className="p-4 text-left">Type</th>
                  <th className="p-4 text-left">Statut</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t dark:border-gray-700">
                  <td className="p-4">2023-10-01</td>
                  <td className="p-4">Tentative de phishing</td>
                  <td className="p-4 text-green-500">Résolu</td>
                </tr>
                <tr className="border-t dark:border-gray-700">
                  <td className="p-4">2023-09-25</td>
                  <td className="p-4">Accès non autorisé</td>
                  <td className="p-4 text-yellow-500">En cours</td>
                </tr>
                <tr className="border-t dark:border-gray-700">
                  <td className="p-4">2023-09-20</td>
                  <td className="p-4">Virus détecté</td>
                  <td className="p-4 text-green-500">Résolu</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 6 : Contacts Sécurité */}
        <div className="mb-6">
          <h2 className="text-2xl font-semibold mb-4">Contacts Sécurité</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center gap-4">
              <span className="text-2xl">📧</span>
              <div>
                <h3 className="font-semibold">Email</h3>
                <p className="text-sm">securite&apos;@lnb.intranet</p>
              </div>
            </div>
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center gap-4">
              <span className="text-2xl">📞</span>
              <div>
                <h3 className="font-semibold">Téléphone</h3>
                <p className="text-sm">+33 1 23 45 67 89</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}