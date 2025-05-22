'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { Box, Card, Stack, Typography, Button, TextField, Alert, CircularProgress } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      const response = await fetch('https://www.backend.lnb-intranet.globalitnet.org/password/forgot_password/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Un lien de réinitialisation a été envoyé à votre email.' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Une erreur est survenue.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Mot de passe oublié" description="Réinitialisation du mot de passe">
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Card elevation={10} sx={{ p: 4, borderRadius: "15px", textAlign: "center", width: "100%", maxWidth: 400 }}>
          <Image src="/images/logo.svg" alt="Logo LNB" width={80} height={80} />
          <Typography variant="h4" fontWeight={700} sx={{ color: "#007554", mt: 2 }}>
            LNB INTRANET
          </Typography>
          <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
            Entrez votre email pour réinitialiser votre mot de passe
          </Typography>

          {message && <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>}

          <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                placeholder="Entrer votre email"
                fullWidth
                required
                name="email"
                value={email}
                onChange={handleChange}
              />
              <Button
                variant="contained"
                sx={{ backgroundColor: "#007554", color: "white", '&:hover': { backgroundColor: "#005f3b" } }}
                fullWidth
                type="submit"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} color="inherit" /> : 'Envoyer'}
              </Button>
            </Stack>
          </form>

          <Link href="/auth/login" passHref>
            <Typography sx={{ color: "#007554", cursor: "pointer", textDecoration: "underline", mt: 2 }}>Retour à la connexion</Typography>
          </Link>
        </Card>
      </Box>
    </PageContainer>
  );
};

export default ForgotPassword;
