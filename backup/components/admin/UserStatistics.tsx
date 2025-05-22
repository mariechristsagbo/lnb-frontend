import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface LineChartProps {
  data: {
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
}

const LineChart: React.FC<LineChartProps> = ({ data: _data }) => {
  return (
    <div>
      {/* Chart implementation using the _data prop */}
      <p>Chart placeholder</p>
    </div>
  );
};

const UserStatistics = () => {
  // Données fictives à remplacer par vos données réelles
  const activeUsers = 1248;
  const userLoginData = {
    labels: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
    datasets: [{
      label: "Connexions",
      data: [65, 78, 90, 81, 56, 30, 25],
    }]
  };
  
  const popularPages = [
    { page: "/dashboard", visits: 342 },
    { page: "/documents", visits: 289 },
    { page: "/profile", visits: 187 },
    { page: "/calendar", visits: 156 },
    { page: "/messages", visits: 123 }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Statistiques d&apos;utilisation</CardTitle>
          <CardDescription>Activité des utilisateurs sur la plateforme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">Utilisateurs actifs</p>
              <p className="text-2xl font-bold">{activeUsers}</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">Connexions aujourd&apos;hui</p>
              <p className="text-2xl font-bold">87</p>
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg">
              <p className="text-sm text-slate-500 dark:text-slate-400">Nouveaux utilisateurs</p>
              <p className="text-2xl font-bold">12</p>
            </div>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Fréquence de connexion</h3>
            <div className="h-64">
              <LineChart data={userLoginData} />
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Pages les plus visitées</h3>
            <div className="space-y-2">
              {popularPages.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-900 rounded">
                  <span>{item.page}</span>
                  <span className="font-medium">{item.visits} visites</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStatistics;