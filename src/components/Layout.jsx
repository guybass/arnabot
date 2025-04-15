import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { User } from '@/api/entities';
import {
  Home,
  Briefcase,
  ClipboardList,
  Calendar as CalendarIcon,
  BarChart2,
  Users,
  Settings,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function Layout({ children }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = React.useState(null);

  React.useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await User.logout();
      window.location.href = '/';
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const isActive = (path) => {
    return location.pathname.includes(path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b py-2 px-4 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {/* Back button - shows on all pages except dashboard */}
            {location.pathname !== '/Dashboard' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                title="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            
            <Link to={createPageUrl('Dashboard')} className="flex items-center px-2">
              <span className="font-semibold text-lg text-indigo-600">Synapse</span>
            </Link>
            
            <div className="hidden md:flex space-x-1 ml-4">
              <Button 
                variant={isActive('Dashboard') ? "secondary" : "ghost"} 
                size="sm" 
                asChild
              >
                <Link to={createPageUrl('Dashboard')}>
                  <Home className="h-4 w-4 mr-1" />
                  Dashboard
                </Link>
              </Button>
              
              <Button 
                variant={isActive('ProjectDashboard') ? "secondary" : "ghost"} 
                size="sm" 
                asChild
              >
                <Link to={createPageUrl('ProjectDashboard')}>
                  <Briefcase className="h-4 w-4 mr-1" />
                  Projects
                </Link>
              </Button>
              
              <Button 
                variant={isActive('TaskManager') ? "secondary" : "ghost"} 
                size="sm" 
                asChild
              >
                <Link to={createPageUrl('TaskManager')}>
                  <ClipboardList className="h-4 w-4 mr-1" />
                  Tasks
                </Link>
              </Button>
              
              <Button 
                variant={isActive('TeamCalendar') ? "secondary" : "ghost"} 
                size="sm" 
                asChild
              >
                <Link to={createPageUrl('TeamCalendar')}>
                  <Users className="h-4 w-4 mr-1" />
                  Team
                </Link>
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {currentUser && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-800 font-medium">
                      {currentUser.full_name?.charAt(0) || 'U'}
                    </div>
                    <span className="hidden md:inline">{currentUser.full_name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{currentUser.full_name}</div>
                    <div className="text-xs text-gray-500">{currentUser.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('Dashboard')}>
                      <Home className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('ProjectDashboard')}>
                      <Briefcase className="mr-2 h-4 w-4" />
                      <span>Projects</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('TaskManager')}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      <span>Tasks</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl('TeamCalendar')}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>Team</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="py-2 px-4 bg-white border-t text-xs text-gray-500 flex justify-between">
        <div>Synapse Project Manager v1.0</div>
        <div>© 2023 Synapse</div>
      </footer>
    </div>
  );
}