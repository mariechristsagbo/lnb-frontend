import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Button from "@/components/ui/button/Button"; // Chemin corrigé
import { Table, TableHeader, TableBody, TableRow, TableCell } from "@/components/ui/table";

const ResourceManagement = () => {
  const [selectedTab, setSelectedTab] = useState("storage");
  const [showAddLicenseModal, setShowAddLicenseModal] = useState(false);

  // Données fictives pour les ressources de stockage
  const storageResources = [
    { id: 1, name: "Primary Storage", total: "500 GB", used: "223 GB", percentage: 44.6, status: "normal" },
    { id: 2, name: "Media Storage", total: "1 TB", used: "820 GB", percentage: 82, status: "warning" },
  ];

  // Données fictives pour les licences logicielles
  const softwareLicenses = [
    { id: 1, name: "Office Suite", provider: "Microsoft", type: "Subscription", seats: { total: 50, used: 42 }, status: "active" },
    { id: 2, name: "Photoshop", provider: "Adobe", type: "Subscription", seats: { total: 15, used: 13 }, status: "expiring_soon" },
  ];

  // Fonction pour obtenir la couleur du badge en fonction du statut
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "normal":
      case "active":
        return "bg-green-100 text-green-800";
      case "warning":
      case "expiring_soon":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  // Fonction pour obtenir la couleur de la barre de progression
  const getProgressColor = (percentage: number) => {
    if (percentage < 50) {
      return "bg-green-500";
    }
    if (percentage < 80) {
      return "bg-yellow-500";
    }
    return "bg-red-500";
  };

  // Composant de progression simplifié
  const Progress = ({ value, className }: { value: number, className?: string }) => (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
      <div
        className={`h-2.5 rounded-full ${className}`}
        style={{ width: `${value}%` }}
      ></div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Navigation entre onglets simplifiée */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          className={`py-2 px-4 ${selectedTab === "storage" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("storage")}
        >
          Storage
        </button>
        <button
          className={`py-2 px-4 ${selectedTab === "licenses" ? "border-b-2 border-primary font-medium" : ""}`}
          onClick={() => setSelectedTab("licenses")}
        >
          Licenses
        </button>
      </div>

      {/* Contenu de l'onglet storage */}
      {selectedTab === "storage" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Storage Management</CardTitle>
                <CardDescription>Monitoring storage usage</CardDescription>
              </div>
              <Button>Add Resource</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {storageResources.map((resource) => (
                <div key={resource.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{resource.name}</p>
                      <p className="text-sm text-slate-500">
                        {resource.used} used of {resource.total} ({resource.percentage.toFixed(1)}%)
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(resource.status)}`}>
                      {resource.status === "normal" ? "Normal" : "Warning"}
                    </span>
                  </div>
                  <Progress 
                    value={resource.percentage} 
                    className={getProgressColor(resource.percentage)} 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Contenu de l'onglet licenses */}
      {selectedTab === "licenses" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Software Licenses</CardTitle>
                <CardDescription>Managing licenses and subscriptions</CardDescription>
              </div>
              <Button onClick={() => setShowAddLicenseModal(true)}>Add License</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell isHeader>Software</TableCell>
                  <TableCell isHeader>Provider</TableCell>
                  <TableCell isHeader>Type</TableCell>
                  <TableCell isHeader>Seats</TableCell>
                  <TableCell isHeader>Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {softwareLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell>{license.name}</TableCell>
                    <TableCell>{license.provider}</TableCell>
                    <TableCell>{license.type}</TableCell>
                    <TableCell>
                      {license.seats.used} / {license.seats.total}
                      <Progress 
                        value={(license.seats.used / license.seats.total) * 100} 
                        className={(license.seats.used / license.seats.total) > 0.9 ? 'bg-red-500' : 'bg-blue-500'} 
                      />
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeColor(license.status)}`}>
                        {license.status === "active" ? "Active" : "Expiring Soon"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Modal pour ajouter une licence (version simplifiée sans Dialog) */}
      {showAddLicenseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Add New License</h3>
              <button 
                onClick={() => setShowAddLicenseModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium">Software Name</label>
                <input
                  id="name"
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Software Name"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="provider" className="block text-sm font-medium">Provider</label>
                <input
                  id="provider"
                  type="text"
                  className="w-full rounded-md border border-gray-300 p-2"
                  placeholder="Provider"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="type" className="block text-sm font-medium">License Type</label>
                  <select
                    id="type"
                    className="w-full rounded-md border border-gray-300 p-2"
                    defaultValue="subscription"
                  >
                    <option value="subscription">Subscription</option>
                    <option value="perpetual">Perpetual</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="seats" className="block text-sm font-medium">Number of Seats</label>
                  <input
                    id="seats"
                    type="number"
                    className="w-full rounded-md border border-gray-300 p-2"
                    placeholder="Number of Seats"
                  />
                </div>
              </div>
              <Button className="w-full">Add License</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceManagement;