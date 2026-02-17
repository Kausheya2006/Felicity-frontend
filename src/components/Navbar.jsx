import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';
import felicityIcon from '../assets/felicity.png';

function Navbar({ title = "Dashboard" }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'admin': return 'bg-red-500';
      case 'organizer': return 'bg-purple-500';
      case 'participant': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  // Participant navigation items
  const participantNav = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Browse Events', path: '/browse-events' },
    { name: 'Teams', path: '/teams' },
    { name: 'Clubs/Organizers', path: '/clubs' },
    { name: 'Profile', path: '/profile' }
  ];

  const isActivePath = (path) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-1">
        <div className="flex justify-between items-center h-16 pl-1 pr-3">
          <div className="flex items-center space-x-3">
            <div className="flex items-center cursor-pointer shrink-0" onClick={() => navigate('/dashboard')}>
              <img src={felicityIcon} alt="Felicity" className="w-12 h-12" />
              <span className="text-2xl font-bold text-gray-800">
                Felicity
              </span>
            </div>
            <div className="hidden sm:block h-8 w-px bg-gray-200" />
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full ${getRoleColor()} flex items-center justify-center text-white font-bold text-lg`}>
                {user?.role?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">{title}</h1>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
            
            {/* Participant Navigation Menu */}
            {user?.role === 'participant' && (
              <div className="hidden md:flex items-center space-x-1">
                {participantNav.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActivePath(item.path)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            <NotificationBell />
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition duration-200 ease-in-out transform hover:scale-105"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
