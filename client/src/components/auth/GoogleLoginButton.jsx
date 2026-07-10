import React, { useEffect, useState } from 'react';
import { authApi } from '../../services/all.api';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

export default function GoogleLoginButton() {
  const [clientId, setClientId] = useState('');
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await authApi.getConfig();
        setClientId(res.data.data.googleClientId);
      } catch (err) {
        console.error('Failed to load Google Auth config', err);
      }
    };
    loadConfig();
  }, []);

  useEffect(() => {
    if (!clientId) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              const res = await authApi.googleLogin(response.credential);
              setAuth(res.data.data.user);
              navigate('/dashboard');
            } catch (err) {
              console.error('Google login failed', err);
            }
          }
        });

        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { 
            theme: 'filled_blue', 
            size: 'large',
            width: '100%',
            text: 'continue_with',
            shape: 'rectangular'
          }
        );
      }
    };

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // Safe check in case it's already removed
      }
    };
  }, [clientId]);

  if (!clientId) return null;

  return (
    <div className="w-full flex justify-center mt-4">
      <div id="google-signin-btn" className="w-full"></div>
    </div>
  );
}
