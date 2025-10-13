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

  return (
    <div 
      className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200"
      style={{
        zIndex: 1000,
        pointerEvents: 'auto',
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: '256px'
      }}
    >
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center flex-shrink-0 px-4 py-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">🤖 AfiliBot</h1>
        </div>
        
        <nav className="mt-6 flex-1 px-3 space-y-1">
          {navigation.map((item) => {
            const isActive = router.pathname === item.href;
            
            return (
              <div
                key={item.name}
                onClick={() => {
                  console.log('🔴 CLICK DETECTADO:', item.name);
                  router.push(item.href);
                }}
                style={{
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  zIndex: 1001,
                  position: 'relative',
                  display: 'block',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  backgroundColor: isActive ? '#dbeafe' : 'transparent',
                  color: isActive ? '#1e40af' : '#4b5563'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.target.style.backgroundColor = '#f9fafb';
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.target.style.backgroundColor = 'transparent';
                }}
              >
                {item.name}
              </div>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;
