"use client";
import React from "react";
const activities = [
  { id: 1, user: "Alice", activity: "Connexion", time: "10:00 AM" },
  { id: 2, user: "Bob", activity: "Déconnexion", time: "11:30 AM" },
  { id: 3, user: "Charlie", activity: "Modification de profil", time: "12:45 PM" },
  // Ajoutez d'autres activités ici
];

export default function UserActivities() {
  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-6">
        <table className="min-w-full divide-y divide-green-200">
          <thead className="bg-green-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                Utilisateur
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                Activité
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-green-800 uppercase tracking-wider">
                Heure
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-green-200">
            {activities.map((activity) => (
              <tr key={activity.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-900">{activity.user}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">{activity.activity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700">{activity.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
