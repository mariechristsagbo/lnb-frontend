import { Helmet, HelmetProvider } from 'react-helmet-async';
import React from 'react';

type Props = {
  description?: string;
  children: React.ReactNode; // ✅ Utilise React.ReactNode ici
  title?: string;
};

const PageContainer = ({ title, description, children }: Props) => (
  <HelmetProvider>
    <div>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description || ''} />
      </Helmet>
      {children}
    </div>
  </HelmetProvider>
);

export default PageContainer;
