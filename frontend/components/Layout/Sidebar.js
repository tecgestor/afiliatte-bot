/*import Link from 'next/link';*/
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

const Sidebar = () => {
  const router = useRouter();

  const navigateTo = (href) => {
    console.log('Navegando para:', href);
    router.push(href);
  };

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Logo */}
        <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">🤖 AfiliBot</h1>
        </div>
        
        {/* Navigation */}
        <nav className="mt-6 flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            
            return (
              <div
                key={item.name}
                onClick={() => navigateTo(item.href)}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md cursor-pointer transition-all duration-200
                  ${isActive 
                    ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
                role="button"
                tabIndex={0}
              >
                <span>{item.name}</span>
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
