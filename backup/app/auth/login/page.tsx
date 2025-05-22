'use client';
import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import { GridLegacy as Grid, Card, Stack, Typography, Button, TextField, Alert, CircularProgress } from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { loginUser } from '@/services/auth';

const Login2 = () => {
  const [credentials, setCredentials] = useState({ identifier: '', password: '' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    console.log('Form submitted with credentials:', credentials);

    try {
      const response = await loginUser(credentials);
      console.log('Login response:', response);
      if (response.success) {
        setMessage({ type: 'success', text: 'Connexion réussie ! Redirection en cours...' });
        console.log('Redirecting to /admin');
        router.push('/admin');
      } else {
        setMessage({ type: 'error', text: response.error || 'Une erreur est survenue.' });
      }
    } catch (error) {
      console.error('Error during login:', error);
      setMessage({ type: 'error', text: 'Erreur lors de la connexion. Veuillez vérifier vos identifiants.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Login" description="Page de connexion LNB">
      <Grid container sx={{ height: "100vh" }}>
        <Grid item xs={12} md={6} sx={{ position: "relative", display: { xs: "none", md: "block" } }}>
          <Image src="/images/login.png" alt="Login Image" fill style={{ objectFit: 'cover' }} />
        </Grid>
        <Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <Card elevation={10} sx={{ p: 4, borderRadius: "15px", textAlign: "center", width: "100%", maxWidth: 400 }}>
            <Image src="/images/logo.svg" alt="Logo LNB" width={80} height={80} />
            <Typography variant="h4" fontWeight={700} sx={{ color: "#007554", mt: 2 }}>
              LNB INTRANET
            </Typography>
            <Typography variant="subtitle1" color="textSecondary" sx={{ mb: 3 }}>
              Connectez-vous à votre compte
            </Typography>
            {message && (
              <Alert severity={message.type} sx={{ mb: 2 }}>{message.text}</Alert>
            )}
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email ou Nom d'utilisateur"
                  placeholder="Entrer votre email ou username"
                  fullWidth
                  required
                  name="identifier"
                  value={credentials.identifier}
                  onChange={handleChange}
                />
                <TextField
                  label="Mot de passe"
                  type="password"
                  placeholder="Entrer votre mot de passe"
                  fullWidth
                  required
                  name="password"
                  value={credentials.password}
                  onChange={handleChange}
                />
                <Link href="/auth/forget-password" passHref>
                  <Typography sx={{ color: "#007554", cursor: "pointer", textDecoration: "underline" }}>Mot de passe oublié ?</Typography>
                </Link>
                <Button
                  variant="contained"
                  sx={{ backgroundColor: "#007554", color: "white", '&:hover': { backgroundColor: "#005f3b" } }}
                  fullWidth
                  type="submit"
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} color="inherit" /> : 'Se connecter'}
                </Button>
              </Stack>
            </form>
          </Card>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 3, textAlign: "center" }}>
            © 2025 LNB. Tous droits réservés.
          </Typography>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default Login2;
