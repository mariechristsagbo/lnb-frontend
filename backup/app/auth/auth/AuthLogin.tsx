'use client'; // Declare this for client-side rendering in Next.js

import React from "react";
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Button,
  Stack,
  Checkbox,
} from "@mui/material";
import Link from "next/link";

import CustomTextField from "@/app/(DashboardLayout)/components/forms/theme-elements/CustomTextField";

// TypeScript Interface to define expected props
interface loginType {
  title?: string;
  subtitle?: React.ReactNode | React.ReactNode[]; // Correct JSX typing
  subtext?: React.ReactNode | React.ReactNode[];  // Correct JSX typing
}

const AuthLogin = ({ title, subtitle, subtext }: loginType) => (
  <>
    {/* Titre principal */}
    {title ? (
      <Typography fontWeight="700" variant="h2" mb={1}>
        {title}
      </Typography>
    ) : null}

    {/* Texte introductif */}
    {subtext}

    {/* Formulaire */}
    <Stack>
      {/* Nom d'utilisateur */}
      <Box>
        <Typography
          variant="subtitle1"
          fontWeight={600}
          component="label"
          htmlFor="username"
          mb="5px"
        >
          Nom d&apos;utilisateur ou adresse email
        </Typography>
        <CustomTextField id="username" variant="outlined" fullWidth />
      </Box>

      {/* Mot de passe */}
      <Box mt="25px">
        <Typography
          variant="subtitle1"
          fontWeight={600}
          component="label"
          htmlFor="password"
          mb="5px"
        >
          Mot de passe
        </Typography>
        <CustomTextField id="password" type="password" variant="outlined" fullWidth />
      </Box>

      {/* Options supplémentaires */}
      <Stack
        justifyContent="space-between"
        direction="row"
        alignItems="center"
        my={2}
      >
        {/* Checkbox : Se souvenir */}
        <FormGroup>
          <FormControlLabel
            control={<Checkbox defaultChecked />}
            label="Se souvenir de cet appareil"
          />
        </FormGroup>

        {/* Lien : Mot de passe oublié */}
        <Typography
          component={Link}
          href="/mot-de-passe-oublie"
          fontWeight="500"
          sx={{
            textDecoration: "none",
            color: "primary.main",
          }}
        >
          Mot de passe oublié ?
        </Typography>
      </Stack>
    </Stack>

    {/* Bouton de connexion */}
    <Box>
      <Button
        color="primary"
        variant="contained"
        size="large"
        fullWidth
        component={Link}
        href="/"
        type="submit"
      >
        Se connecter
      </Button>
    </Box>

    {/* Sous-titre ou texte après formulaire */}
    {subtitle}

    {/* Devise */}
    <Typography
      variant="body2"
      textAlign="center"
      color="textSecondary"
      mt={3}
    >
      Les lots aux gagnants, les bénéfices à toute la nation.
    </Typography>
  </>
);

export default AuthLogin;
