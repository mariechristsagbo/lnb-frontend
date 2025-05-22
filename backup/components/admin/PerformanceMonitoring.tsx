import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface LineChartProps {
  data: {
    labels: string[];
    datasets: { label: string; data: number[] }[];
  };
}

const LineChartOne: React.FC<LineChartProps> = ({ data }) => {
  return (
    <div>
      <p>LineChartOne Component</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

const PerformanceMonitoring: React.FC = () => {
  // Données fictives pour les performances du site
  const responseTimeData = {
    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil"],
    datasets: [{
      label: "Temps de réponse (ms)",
      data: [320, 280, 300, 275, 290, 260, 240],
    }]
  };

  const availabilityData = {
    labels: ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil"],
    datasets: [{
      label: "Disponibilité (%)",
      data: [99.8, 99.9, 99.7, 99.9, 99.8, 100, 99.9],
    }]
  };

  const errorReports = [
    { id: 1, type: "Serveur", code: "500", message: "Erreur interne du serveur", occurrences: 3, lastOccurred: "2023-03-21 08:45" },
    { id: 2, type: "Base de données", code: "DB-007", message: "Timeout de connexion", occurrences: 2, lastOccurred: "2023-03-20 14:22" },
    { id: 3, type: "API", code: "404", message: "Ressource non trouvée", occurrences: 7, lastOccurred: "2023-03-19 11:30" },
    { id: 4, type: "Authentification", code: "AUTH-002", message: "Échec d'authentification", occurrences: 12, lastOccurred: "2023-03-18 16:15" },
    { id: 5, type: "Réseau", code: "NET-001", message: "Délai d'attente réseau", occurrences: 5, lastOccurred: "2023-03-17 09:50" },
  ];

  const systemMetrics = [
    { metric: "CPU", value: "42%", status: "normal" },
    { metric: "Mémoire", value: "6.2GB / 16GB", status: "normal" },
    { metric: "Stockage", value: "223GB / 500GB", status: "warning" },
    { metric: "Bande passante", value: "120 Mbps", status: "normal" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {systemMetrics.map((item, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-slate-500 dark:text-slate-400">{item.metric}</p>
                <p className="text-2xl font-bold">{item.value}</p>
                <div
                  className={`mt-2 px-2 py-1 rounded ${
                    item.status === "normal" 
                      ? "bg-green-100 text-green-800" 
                      : item.status === "warning" 
                        ? "bg-yellow-100 text-yellow-800" 
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {item.status.toUpperCase()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Temps de réponse</CardTitle>
            <CardDescription>Temps de réponse moyen du serveur sur la période</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <LineChartOne data={responseTimeData} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taux de disponibilité</CardTitle>
            <CardDescription>Pourcentage de temps où le service était accessible</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <LineChartOne data={availabilityData} />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Rapports d&apos;erreurs</CardTitle>
              <CardDescription>Incidents techniques récents</CardDescription>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Type d&apos;erreur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous types</SelectItem>
                <SelectItem value="server">Serveur</SelectItem>
                <SelectItem value="database">Base de données</SelectItem>
                <SelectItem value="api">API</SelectItem>
                <SelectItem value="auth">Authentification</SelectItem>
                <SelectItem value="network">Réseau</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell>Code</TableCell>
                <TableCell>Message</TableCell>
                <TableCell>Occurrences</TableCell>
                <TableCell>Dernière occurrence</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {errorReports.map((error) => (
                <TableRow key={error.id}>
                  <TableCell>{error.type}</TableCell>
                  <TableCell>{error.code}</TableCell>
                  <TableCell>{error.message}</TableCell>
                  <TableCell>{error.occurrences}</TableCell>
                  <TableCell>{error.lastOccurred}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceMonitoring;