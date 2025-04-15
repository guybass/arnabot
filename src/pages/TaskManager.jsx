import React, { useState, useEffect } from 'react';
import { Project, Task, TaskColumn, StatusColumn, TaskDependency, TeamMember, User } from '@/api/entities';
import { useParams } from 'react-router-dom';
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from '@/components/ui/tabs';
import TaskBoard from '../components/tasks/TaskBoard';
import TaskTimeline from '../components/tasks/TaskTimeline';
import TaskCalendar from '../components/tasks/TaskCalendar';
import TaskReports from '../components/tasks/TaskReports';
import TaskConfiguration from '../components/tasks/TaskConfiguration';
import TaskManagerHeader from '../components/tasks/TaskManagerHeader';
import TaskManagerSidebar from '../components/tasks/TaskManagerSidebar';
import { Loader2 } from 'lucide-react';

export default function TaskManager() {
  const { projectId } = useParams();
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [view, setView] = useState('board');
  const [filter, setFilter] = useState({ status: 'all', assignee: 'all', priority: 'all' });
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    loadCurrentUser();
    loadProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      const projectToSelect = projectId 
        ? projects.find(p => p.id === projectId) 
        : projects[0];
      
      if (projectToSelect) {
        setSelectedProject(projectToSelect);
      }
    }
  }, [projects, projectId]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);

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
      const fetchedProjects = await Project.list('-created_date');
      setProjects(fetchedProjects);
      setIsLoading(false);
    } catch (error) {
      console.error("Error loading projects:", error);
      setIsLoading(false);
    }
  };

  const loadProjectData = async () => {
    setIsLoading(true);
    try {
      const projectTasks = await Task.filter({ project_id: selectedProject.id }, '-updated_date');
      setTasks(projectTasks);
      
      // Simulate loading notifications
      const mockNotifications = [
        { id: 1, type: 'task_assigned', message: 'You were assigned to task "Update API Documentation"', date: new Date(), read: false },
        { id: 2, type: 'due_date', message: 'Task "Fix Login Bug" is due tomorrow', date: new Date(), read: false },
        { id: 3, type: 'comment', message: 'John commented on "Homepage Redesign"', date: new Date(Date.now() - 86400000), read: true },
      ];
      setNotifications(mockNotifications);
    } catch (error) {
      console.error("Error loading project data:", error);
    }
    setIsLoading(false);
  };

  const handleTasksChange = () => {
    loadProjectData();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleSearch = (searchTerm) => {
    setSearch(searchTerm);
  };

  const handleFilterChange = (newFilter) => {
    setFilter({ ...filter, ...newFilter });
  };

  const handleViewChange = (newView) => {
    setView(newView);
  };

  const handleProjectSelect = (project) => {
    setSelectedProject(project);
  };

  const filteredTasks = tasks.filter(task => {
    // Filter by search
    const matchesSearch = search 
      ? task.title.toLowerCase().includes(search.toLowerCase()) ||
        task.description?.toLowerCase().includes(search.toLowerCase())
      : true;
    
    // Filter by status
    const matchesStatus = filter.status === 'all' 
      ? true 
      : task.status === filter.status;
    
    // Filter by assignee
    const matchesAssignee = filter.assignee === 'all' 
      ? true 
      : filter.assignee === 'unassigned' 
        ? !task.assigned_to 
        : task.assigned_to === filter.assignee;
    
    // Filter by priority
    const matchesPriority = filter.priority === 'all' 
      ? true 
      : task.priority === filter.priority;
    
    return matchesSearch && matchesStatus && matchesAssignee && matchesPriority;
  });

  if (isLoading && !selectedProject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <TaskManagerHeader 
        currentUser={currentUser}
        notifications={notifications}
        toggleSidebar={toggleSidebar}
        project={selectedProject}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <TaskManagerSidebar 
            projects={projects}
            selectedProject={selectedProject}
            onProjectSelect={handleProjectSelect}
            view={view}
            onViewChange={handleViewChange}
            onSearch={handleSearch}
            filters={filter}
            onFilterChange={handleFilterChange}
          />
        )}
        
        <main className="flex-1 overflow-auto p-4">
          <Tabs value={view} onValueChange={handleViewChange} className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="board" className="mt-0">
              <TaskBoard 
                tasks={filteredTasks}
                project={selectedProject}
                onTasksChange={handleTasksChange}
              />
            </TabsContent>
            
            <TabsContent value="timeline" className="mt-0">
              <TaskTimeline 
                tasks={filteredTasks}
                project={selectedProject}
                onTasksChange={handleTasksChange}
              />
            </TabsContent>
            
            <TabsContent value="calendar" className="mt-0">
              <TaskCalendar 
                tasks={filteredTasks}
                project={selectedProject}
                onTasksChange={handleTasksChange}
              />
            </TabsContent>
            
            <TabsContent value="reports" className="mt-0">
              <TaskReports 
                tasks={tasks}
                project={selectedProject}
              />
            </TabsContent>
            
            <TabsContent value="settings" className="mt-0">
              <TaskConfiguration 
                project={selectedProject}
                onSettingsChange={loadProjectData}
              />
            </TabsContent>
          </Tabs>
        </main>
      </div>
      
      <footer className="py-2 px-4 bg-white border-t text-xs text-gray-500 flex justify-between">
        <div>Task Manager v1.0</div>
        <div>© 2023 Synapse</div>
      </footer>
    </div>
  );
}