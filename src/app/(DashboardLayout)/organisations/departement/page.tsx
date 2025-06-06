import { DepartmentsPage } from "./components/DepartmentsPage";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";

export default function Departments() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Listes des Départements" />
      <div className="space-y-6">
        <DepartmentsPage />
      </div>
    </div>
  );
}