import { createTheme } from "@mui/material/styles";
import { red } from "@mui/material/colors";

// Créer un thème personnalisé
const theme = createTheme({
  palette: {
    primary: {
      main: "#00FF00", // Vert pur
    },
    secondary: {
      main: "#19857b",
    },
    error: {
      main: red.A400,
    },
  },
});

export default theme;
