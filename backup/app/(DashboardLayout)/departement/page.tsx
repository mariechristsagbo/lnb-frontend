import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BasicTableOne from "./BasicTableOne";

import React from "react";

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Listes des Départements" />
      <div className="space-y-6">
        <BasicTableOne />
      </div>
    </div>
  );
}