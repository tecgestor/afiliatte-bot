import Link from 'next/link';
import { useRouter } from 'next/router';

const navigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Produtos', href: '/products' },
  { name: 'Grupos', href: '/groups' },
  { name: 'Templates', href: '/templates' },
  { name: 'Histórico', href: '/history' },
  { name: 'Robô', href: '/robot' },
  { name: 'Configurações', href: '/settings' },
];

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const router = useRouter();

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 border-r border-gray-200 bg-white">
        <div className="flex items-center flex-shrink-0 px-4 py-4">
          <span className="text-xl font-bold text-gray-900">🤖 AfiliBot</span>
        </div>

        <nav className="mt-5 flex-1 px-2 space-y-1">
          {navigation.map((item) => {
            const current = router.pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <a className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                  current
                    ? 'bg-primary-100 text-primary-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}>
                  {item.name}
                </a>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;