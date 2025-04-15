import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Briefcase, 
  ClipboardList, 
  Users, 
  LayoutDashboard,
  ArrowRight
} from 'lucide-react';

export default function Navigation() {
  const menuItems = [
    {
      title: "Dashboard",
      description: "Overview of all activities and metrics",
      icon: LayoutDashboard,
      path: "Dashboard",
      color: "bg-blue-500"
    },
    {
      title: "Projects",
      description: "Manage and track all projects",
      icon: Briefcase,
      path: "ProjectDashboard",
      color: "bg-purple-500"
    },
    {
      title: "Tasks",
      description: "View and manage all tasks",
      icon: ClipboardList,
      path: "TaskManager",
      color: "bg-green-500"
    },
    {
      title: "Team",
      description: "Manage team members and schedules",
      icon: Users,
      path: "TeamManagement",
      color: "bg-orange-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Welcome to Synapse</h1>
        
        <div className="grid gap-6 md:grid-cols-2">
          {menuItems.map((item) => (
            <Link 
              key={item.path} 
              to={createPageUrl(item.path)}
              className="block"
            >
              <Card className="h-full hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`${item.color} p-3 rounded-lg`}>
                      <item.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-2">{item.title}</h2>
                      <p className="text-gray-600 mb-4">{item.description}</p>
                      <Button variant="ghost" className="group">
                        Go to {item.title}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}