import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import BasicTableOne from "./BasicTableOne";

import React from "react";

export default function BasicTables() {
  return (
    <div>
      <PageBreadcrumb pageTitle="Fiches de paiement des utilisateurs du système" />
      <div className="space-y-6">
        <BasicTableOne />
      </div>
    </div>
  );
}