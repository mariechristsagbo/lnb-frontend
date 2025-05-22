import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHeader as TableHead,
  TableCell
} from "@/components/ui/table";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline";
  size?: "sm" | "md" | "lg"; // Ajout de la propriété size
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = "outline", size = "md" }) => {
  const className = `${variant === "primary" ? "btn-primary" : "btn-outline"} ${size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "btn-md"}`;
  return (
    <button className={className} onClick={onClick}>
      {children}
    </button>
  );
};

const AnalyticsReports: React.FC = () => {
  const [activeSection, setActiveSection] = useState<"usage" | "content" | "demographics" | "reports">("usage");
  const [dateRange, setDateRange] = useState<string>("month");

  const statistics = {
    visitors: 2145,
    pageViews: 6280,
    avgSessionDuration: "9.5 min"
  };

  const topPages = [
    { path: "/dashboard", title: "Tableau de bord", views: 1245, avgTime: "3:12" },
    { path: "/documents", title: "Documents", views: 980, avgTime: "4:30" },
    { path: "/calendar", title: "Calendrier", views: 875, avgTime: "2:45" }
  ];

  const reports = [
    { id: 1, title: "Rapport d'activité mensuel", date: "2023-03-01", format: "PDF", size: "1.2 MB" },
    { id: 2, title: "Statistiques d'utilisation Q1", date: "2023-03-15", format: "XLSX", size: "645 KB" }
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {["usage", "content", "demographics", "reports"].map((section) => (
          <Button
            key={section}
            variant={activeSection === section ? "primary" : "outline"}
            onClick={() => setActiveSection(section as "usage" | "content" | "demographics" | "reports")}
          >
            {section === "usage" ? "Utilisation" : 
             section === "content" ? "Contenu" : 
             section === "demographics" ? "Démographie" : "Rapports"}
          </Button>
        ))}
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Analyse des tendances d&apos;utilisation</h2>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Aujourd&apos;hui</SelectItem>
              <SelectItem value="week">Cette semaine</SelectItem>
              <SelectItem value="month">Ce mois-ci</SelectItem>
              <SelectItem value="quarter">Ce trimestre</SelectItem>
              <SelectItem value="year">Cette année</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">Exporter</Button>
        </div>
      </div>

      {activeSection === "usage" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Visiteurs uniques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.visitors}</div>
              <p className="text-xs text-green-600">+12.3% vs période précédente</p>
              <div className="h-48 mt-4 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Graphique de visiteurs</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Pages vues</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics.pageViews}</div>
              <p className="text-xs text-green-600">+8.7% vs période précédente</p>
              <div className="h-48 mt-4 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Graphique de pages vues</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Durée moyenne de session</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Rapport d&apos;activité</div>
              <p className="text-xs text-green-600">+2.1% vs période précédente</p>
              <div className="h-48 mt-4 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Graphique de durée de session</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "content" && (
        <Card>
          <CardHeader>
            <CardTitle>Pages les plus visitées</CardTitle>
            <CardDescription>Les pages qui génèrent le plus de trafic</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Page</TableHead>
                  <TableHead>Titre</TableHead>
                  <TableHead>Vues</TableHead>
                  <TableHead>Temps moyen</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topPages.map((page, index) => (
                  <TableRow key={index}>
                    <TableCell>{page.path}</TableCell>
                    <TableCell>{page.title}</TableCell>
                    <TableCell>{page.views}</TableCell>
                    <TableCell>{page.avgTime}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm">Détails</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeSection === "demographics" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Répartition par âge</CardTitle>
              <CardDescription>Distribution des utilisateurs par tranche d&apos;âge</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Graphique de répartition par âge</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Répartition géographique</CardTitle>
              <CardDescription>Distribution des utilisateurs par région</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gray-100 flex items-center justify-center">
                <p className="text-gray-500">Graphique de répartition géographique</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeSection === "reports" && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Rapports disponibles</CardTitle>
                <CardDescription>Télécharger des rapports analytiques</CardDescription>
              </div>
              <Button variant="primary">Générer un nouveau rapport</Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Titre</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.title}</TableCell>
                    <TableCell>{report.date}</TableCell>
                    <TableCell>{report.format}</TableCell>
                    <TableCell>{report.size}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Aperçu</Button>
                        <Button variant="primary" size="sm">Télécharger</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsReports;