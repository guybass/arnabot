import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Calendar,
  BarChart2,
  Settings,
  PieChart,
  Trello,
  User,
  Home,
  LogOut,
  Search,
  Briefcase
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';

export default function TaskManagerHeader({ currentUser, notifications, toggleSidebar, project }) {
  const [showSearch, setShowSearch] = useState(false);
  
  const unreadNotifications = notifications?.filter(n => !n.read) || [];

  return (
    <header className="bg-white border-b py-2 px-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="mr-2"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <Link to={createPageUrl('Dashboard')} className="flex items-center">
            <Home className="h-5 w-5 mr-1 text-indigo-600" />
            <span className="font-semibold text-lg text-gray-800">Synapse</span>
          </Link>
          
          <div className="hidden md:flex space-x-1">
            <Button variant="ghost" size="sm" asChild>
              <Link to={createPageUrl('ProjectDashboard')}>
                <Briefcase className="h-4 w-4 mr-1" />
                Projects
              </Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to={createPageUrl('TaskManager')}>
                <Trello className="h-4 w-4 mr-1" />
                Tasks
              </Link>
            </Button>
            <Button variant="ghost" size="sm">
              <Calendar className="h-4 w-4 mr-1" />
              Calendar
            </Button>
            <Button variant="ghost" size="sm">
              <BarChart2 className="h-4 w-4 mr-1" />
              Reports
            </Button>
          </div>
        </div>
        
        {project && (
          <div className="hidden md:block">
            <h1 className="text-xl font-semibold text-center">
              {project.title}
            </h1>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSearch(!showSearch)}
          >
            <Search className="h-5 w-5" />
          </Button>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs">
                    {unreadNotifications.length}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-2">
                <h3 className="font-medium">Notifications</h3>
                
                {notifications?.length === 0 && (
                  <p className="text-sm text-gray-500">No notifications</p>
                )}
                
                {notifications?.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-2 rounded-md text-sm ${
                      notification.read ? 'bg-gray-50' : 'bg-blue-50'
                    }`}
                  >
                    <div className="font-medium">{notification.message}</div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(notification.date), 'MMM d, h:mm a')}
                    </div>
                  </div>
                ))}
                
                {notifications?.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full text-center text-sm"
                  >
                    Mark all as read
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full h-8 w-8 bg-gray-100"
              >
                <User className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {currentUser && (
                <div className="px-2 py-1.5 text-sm">
                  <div className="font-medium">{currentUser.full_name}</div>
                  <div className="text-xs text-gray-500">{currentUser.email}</div>
                </div>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {showSearch && (
        <div className="mt-2 px-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search tasks..."
              className="w-full pl-8 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-200"
              autoFocus
            />
          </div>
        </div>
      )}
    </header>
  );
}