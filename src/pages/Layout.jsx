

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
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
import { User } from '@/api/entities';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export default function Layout({ children }) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
      setIsAdmin(user.role === 'admin');
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

  const navigationItems = [
    { path: 'Navigation', icon: Home, label: 'Home' },
    { path: 'Dashboard', icon: BarChart2, label: 'Dashboard' },
    { path: 'ProjectDashboard', icon: Briefcase, label: 'Projects' },
    { path: 'TaskManager', icon: ClipboardList, label: 'Tasks' },
    { path: 'TeamManagement', icon: Users, label: 'Team' }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b py-2 px-4 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-1">
            {location.pathname !== '/Navigation' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => window.history.back()}
                title="Go back"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            
            <Link to={createPageUrl('Navigation')} className="flex items-center px-2">
              <span className="font-semibold text-lg text-indigo-600">Synapse</span>
            </Link>
            
            <div className="hidden md:flex space-x-1 ml-4">
              {navigationItems.map(item => (
                <Button 
                  key={item.path}
                  variant={isActive(item.path) ? "secondary" : "ghost"} 
                  size="sm" 
                  asChild
                >
                  <Link to={createPageUrl(item.path)}>
                    <item.icon className="h-4 w-4 mr-1" />
                    {item.label}
                  </Link>
                </Button>
              ))}
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
                    {isAdmin && <Badge variant="outline" className="ml-1">Admin</Badge>}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-2 py-1.5 text-sm">
                    <div className="font-medium">{currentUser.full_name}</div>
                    <div className="text-xs text-gray-500">{currentUser.email}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="py-2 px-4 bg-white border-t text-xs text-gray-500 flex justify-between">
        <div>Synapse Project Manager v1.0</div>
        <div>© 2023 Synapse</div>
      </footer>
    </div>
  );
}

