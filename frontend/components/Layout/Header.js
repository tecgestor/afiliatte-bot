import { useRouter } from 'next/router';
import { useAuth } from '../../hooks/useAuth';
import Button from '../UI/Button';

const Header = ({ title, setSidebarOpen }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200">
      <div className="flex-1 px-4 flex justify-between items-center md:ml-64">
        <h1 className="text-2xl font-semibold text-gray-900">{title}</h1>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-600">{user?.name}</span>
          <Button size="sm" variant="outline" onClick={handleLogout}>
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Header;