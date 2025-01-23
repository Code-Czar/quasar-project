const handleLogin = async () => {
  try {
    loading.value = true;
    console.log('Starting login process');
    console.log('Window origin:', window.location.origin);
    console.log('Window href:', window.location.href);
    console.log('Window pathname:', window.location.pathname);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback'
      }
    });
    
    if (error) throw error;
    console.log('Auth response:', data);
    
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof Error) {
      errorMessage.value = error.message;
    }
  } finally {
    loading.value = false;
  }
}; 