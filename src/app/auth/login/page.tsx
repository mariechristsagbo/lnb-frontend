'use client';

import { useState, FormEvent, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import {
  GridLegacy as Grid,     // ← Changement ici
  Card,
  Stack,
  Typography,
  Button,
  TextField,
  Alert,
  CircularProgress
} from "@mui/material";
import Image from "next/image";
import Link from "next/link";
import PageContainer from "@/app/(DashboardLayout)/components/container/PageContainer";
import { loginUser } from '@/services/auth';

const Login2 = () => {
  // États séparés pour chaque champ
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ emailOrUsername?: string; password?: string }>({});
  const router = useRouter();

  // Validation des champs
  const validateForm = () => {
    const newErrors: { emailOrUsername?: string; password?: string } = {};
    
    if (!emailOrUsername.trim()) {
      newErrors.emailOrUsername = 'Email ou nom d\'utilisateur requis';
    }
    
    if (!password) {
      newErrors.password = 'Mot de passe requis';
    }
    // else if (password.length < 6) {
    //   newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    // }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setMessage(null);
    setLoading(true);

    try {
      const response = await loginUser({ 
        identifier: emailOrUsername.trim(),
        password 
      });
      console.log(response)
      if (response.success) {
        setMessage({ type: 'success', text: 'Connexion réussie ! Redirection en cours...' });
        router.push('/admin');
      } else {
        setMessage({ 
          type: 'error', 
          text: response.error || 'Identifiants incorrects. Veuillez réessayer.' 
        });
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
      setMessage({ 
        type: 'error', 
        text: 'Erreur lors de la connexion. Veuillez réessayer plus tard.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer title="Login" description="Page de connexion LNB">
      <Grid container sx={{ height: "100vh" }}>
        <Grid item xs={12} md={6} sx={{ position: "relative", display: { xs: "none", md: "block" } }}>
          <Image 
            src="/images/login.png" 
            alt="Login Image" 
            fill 
            style={{ objectFit: 'cover' }} 
          />
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
              <Alert severity={message.type} sx={{ mb: 2 }}>
                {message.text}
              </Alert>
            )}
            <form onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  label="Email ou Nom d'utilisateur"
                  placeholder="Entrer votre email ou nom d'utilisateur"
                  fullWidth
                  required
                  name="emailOrUsername"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  error={!!errors.emailOrUsername}
                  helperText={errors.emailOrUsername}
                  disabled={loading}
                />
                <TextField
                  label="Mot de passe"
                  type="password"
                  sx={{ borderRadius: "15px" }}
                  placeholder="Entrer votre mot de passe"
                  fullWidth
                  required
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                  disabled={loading}
                />
                <Link href="/auth/forget-password" passHref>
                  <Typography sx={{ color: "#007554", cursor: "pointer", textDecoration: "underline" }}>
                    Mot de passe oublié ?
                  </Typography>
                </Link>
                <Button
                  variant="contained"
                  sx={{ backgroundColor: "#007554",padding: "10px", color: "white", '&:hover': { backgroundColor: "#005f3b" } }}
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
            &copy; {new Date().getFullYear()} LNB. Tous droits réservés.
          </Typography>
        </Grid>
      </Grid>
    </PageContainer>
);

};

export default Login2;
