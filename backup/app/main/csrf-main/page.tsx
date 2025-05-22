'use client';
import { useEffect, useState } from 'react';
import { getCSRFToken } from '@/utils/csrf';

const MyComponent = () => {
  const [csrfToken, setCsrfToken] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getCSRFToken();
      setCsrfToken(token);
    };
    fetchToken();
  }, []);

  return (
    <div>
      <p>CSRF Token: {csrfToken}</p>
    </div>
  );
};

export default MyComponent;
