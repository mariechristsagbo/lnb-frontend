import { Card } from "@mui/material";
import React from "react";

type Props = {
  className?: string;
  children: React.ReactNode; // ✅ Utilisation de React.ReactNode
};

const BlankCard = ({ children, className }: Props) => {
  return (
    <Card
      sx={{ p: 0, position: "relative" }}
      className={className}
      elevation={9}
      variant="elevation" // ✅ Correction: éviter `undefined`
    >
      {children}
    </Card>
  );
};

export default BlankCard;
