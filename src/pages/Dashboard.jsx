
import React, { useState, useEffect } from 'react';
import { Project, User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Loader2, Plus, Calendar, ClipboardList, Briefcase } from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import FeedbackButton from '../components/feedback/FeedbackButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { applyOwnershipFilter } from '@/components/utils/ownershipFilters';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedTab, setSelectedTab] = useState('all');
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    status: 'planning',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    target_date: ''
  });

  useEffect(() => {
    loadCurrentUser();
    loadProjects();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadProjects = async () => {
    try {
      // Apply ownership filter
      const filterCriteria = await applyOwnershipFilter();
      const fetchedProjects = await Project.filter(filterCriteria, '-created_date');
      setProjects(fetchedProjects);
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'planning': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRecentProjects = () => {
    return [...projects].sort((a, b) => 
      new Date(b.updated_date || b.created_date) - new Date(a.updated_date || a.created_date)
    ).slice(0, 3);
  };

  const filteredProjects = selectedTab === 'all' 
    ? projects 
    : projects.filter(project => project.status === selectedTab);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCreateProject = async () => {
    try {
      // We don't need to explicitly set created_by, the SDK handles it
      const createdProject = await Project.create(newProject);
      setShowNewProject(false);
      // Reset form
      setNewProject({
        title: '',
        description: '',
        status: 'planning',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        target_date: ''
      });
      // Refresh projects list
      loadProjects();
      // Navigate to the new project's dashboard
      window.location.href = createPageUrl(`ProjectDashboard?projectId=${createdProject.id}`);
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto p-4 md:p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            {currentUser && (
              <p className="text-gray-500">Welcome back, {currentUser.full_name}</p>
            )}
          </div>
          
          <div className="flex gap-2">
            <Link to={createPageUrl('TaskManager')}>
              <Button variant="outline" className="flex items-center">
                <ClipboardList className="mr-2 h-4 w-4" />
                Task Manager
              </Button>
            </Link>
            <Button 
              className="flex items-center"
              onClick={() => setShowNewProject(true)} // Changed from Link to Button
            >
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
              <Briefcase className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{projects.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Calendar className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'in_progress').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <Calendar className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'completed').length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">On Hold</CardTitle>
              <Calendar className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {projects.filter(p => p.status === 'on_hold').length}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="planning">Planning</TabsTrigger>
                  <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                  <TabsTrigger value="on_hold">On Hold</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
                
                <div className="space-y-4">
                  {filteredProjects.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      No projects found
                    </div>
                  ) : (
                    filteredProjects.map(project => (
                      <Link 
                        key={project.id}
                        to={createPageUrl(`ProjectDashboard?projectId=${project.id}`)}
                        className="block"
                      >
                        <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-lg">{project.title}</h3>
                              <p className="text-gray-500 text-sm line-clamp-1">{project.description}</p>
                            </div>
                            <Badge className={getStatusColor(project.status)}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                            <div>Created: {format(new Date(project.created_date), 'MMM d, yyyy')}</div>
                            {project.start_date && project.target_date && (
                              <div>
                                {format(new Date(project.start_date), 'MMM d')} -&nbsp;
                                {format(new Date(project.target_date), 'MMM d, yyyy')}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] w-full">
                <div className="space-y-4">
                  {getRecentProjects().map(project => (
                    <div key={project.id} className="border-b pb-4 last:border-0">
                      <div className="font-medium">{project.title}</div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <Badge className={getStatusColor(project.status)}>
                          {project.status.replace('_', ' ')}
                        </Badge>
                        <div>
                          {format(new Date(project.updated_date || project.created_date), 'MMM d, yyyy')}
                        </div>
                      </div>
                      <div className="mt-2">
                        <Link 
                          to={createPageUrl(`ProjectDashboard?projectId=${project.id}`)}
                        >
                          <Button variant="outline" size="sm" className="w-full">
                            View Project
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {projects.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      No recent activity
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Add New Project Dialog */}
        <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project Title</label>
                <Input
                  placeholder="Enter project title"
                  value={newProject.title}
                  onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Enter project description"
                  value={newProject.description}
                  onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
                  rows={4}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <Input
                    type="date"
                    value={newProject.start_date}
                    onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Date</label>
                  <Input
                    type="date"
                    value={newProject.target_date}
                    onChange={(e) => setNewProject({ ...newProject, target_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewProject(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateProject}>
                Create Project
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <FeedbackButton pageName="Dashboard" />
    </div>
  );
}
