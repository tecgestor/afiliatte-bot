import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../hooks/useAuth';
import Layout from '../components/Layout/Layout';
import '../styles/globals.css';

const queryClient = new QueryClient();

function MyApp({ Component, pageProps, router }) {
  const getPageTitle = () => {
    const titles = {
      '/dashboard': 'Dashboard',
      '/products': 'Produtos',
      '/groups': 'Grupos',
      '/templates': 'Templates',
      '/history': 'Histórico',
      '/robot': 'Robô',
      '/settings': 'Configurações',
      '/login': 'Login'
    };
    return titles[router.pathname] || 'Affiliate Bot';
  };

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Layout title={getPageTitle()}>
          <Component {...pageProps} />
        </Layout>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default MyApp;