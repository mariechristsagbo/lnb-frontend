'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  GridLegacy as Grid,    // ← Import corrigé
  Card,
  Typography,
  Button,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import PageContainer from '@/app/(DashboardLayout)/components/container/PageContainer';
import { logoutUser } from '@/services/auth';

const LogoutPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        await logoutUser();
        router.push('/auth/login');
      } catch {
        setError('Une erreur est survenue lors de la déconnexion.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <PageContainer title="Déconnexion" description="Page de déconnexion LNB">
      <Grid container sx={{ height: '100vh' }}>
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            position: 'relative',
            display: { xs: 'none', md: 'block' }
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '100%',
              height: '100%',
              backgroundImage: 'url(/images/logout.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
        </Grid>

        <Grid
          item
          xs={12}
          md={6}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column'
          }}
        >
          <Card
            elevation={10}
            sx={{
              p: 4,
              borderRadius: '15px',
              textAlign: 'center',
              width: '100%',
              maxWidth: 400
            }}
          >
            {loading && <CircularProgress />}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            {!loading && !error && (
              <>
                <Typography variant="h5" gutterBottom>
                  Vous êtes déconnecté.
                </Typography>
                <Button
                  variant="contained"
                  onClick={() => router.push('/auth/login')}
                >
                  Se reconnecter
                </Button>
              </>
            )}
          </Card>

          <Typography
            variant="body2"
            color="textSecondary"
            sx={{ mt: 3, textAlign: 'center' }}
          >
            © 2025 LNB. Tous droits réservés.
          </Typography>
        </Grid>
      </Grid>
    </PageContainer>
  );
};

export default LogoutPage;
