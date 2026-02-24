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

  // Get the display title based on role
  const getDisplayTitle = () => {
    if (user?.role === 'participant') {
      // For participants, show a consistent title
      const currentNav = participantNav.find(item => isActivePath(item.path));
      return currentNav ? currentNav.name : 'Dashboard';
    }
    return title;
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Logo and Role */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center cursor-pointer shrink-0" onClick={() => navigate('/dashboard')}>
              <img src={felicityIcon} alt="Felicity" className="w-10 h-10" />
              <span className="text-xl font-bold text-gray-800 ml-2 hidden sm:block">
                Felicity
              </span>
            </div>
            
            <div className="hidden sm:block h-8 w-px bg-gray-200" />
            
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-full ${getRoleColor()} flex items-center justify-center text-white font-bold text-sm`}>
                {user?.role?.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
          
          {/* Center - Navigation for Participants */}
          {user?.role === 'participant' && (
            <div className="hidden lg:flex items-center space-x-1">
              {participantNav.map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
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
          
          {/* Right side - Title (for non-participants), Notifications, User, Logout */}
          <div className="flex items-center space-x-4">
            {user?.role !== 'participant' && (
              <h1 className="text-lg font-bold text-gray-800 hidden md:block">{title}</h1>
            )}
            <NotificationBell />
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-700 truncate max-w-[150px]">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition duration-200"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Mobile Navigation for Participants */}
        {user?.role === 'participant' && (
          <div className="lg:hidden flex overflow-x-auto pb-2 -mx-4 px-4 space-x-2">
            {participantNav.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  isActivePath(item.path)
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
