import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Task, TaskDependency, Project } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, ArrowLeft } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

// This is just a placeholder for a graph visualization component
// In a real application, you would use a library like react-flow, vis.js, or cytoscape.js
function DependencyGraph({ tasks, dependencies }) {
  return (
    <div className="border rounded-lg p-6 bg-gray-50 h-[70vh] flex items-center justify-center">
      <div className="text-center space-y-4">
        <h3 className="text-lg font-medium">Task Dependency Graph</h3>
        <p className="text-gray-500">
          This would display an interactive graph of task dependencies.
        </p>
        <p className="text-gray-500 text-sm">
          (Visualization would be implemented with a graph library like react-flow or cytoscape.js)
        </p>
        <div className="mt-6 space-y-2">
          <p className="font-medium">Task Dependencies:</p>
          {dependencies.length === 0 ? (
            <p className="text-gray-500">No dependencies defined</p>
          ) : (
            <ul className="space-y-1 text-left max-w-md mx-auto">
              {dependencies.map(dep => {
                const sourceTask = tasks.find(t => t.id === dep.source_task_id);
                const targetTask = tasks.find(t => t.id === dep.target_task_id);
                return (
                  <li key={dep.id} className="p-2 border rounded-md">
                    <span className="font-medium">{sourceTask?.title || 'Unknown task'}</span>
                    <span className="mx-2 text-gray-500">{dep.type}</span>
                    <span className="font-medium">{targetTask?.title || 'Unknown task'}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TaskDependencyGraph() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState('all');

  useEffect(() => {
    if (projectId) {
      loadData();
    }
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load project
      const projectData = await Project.get(projectId);
      setProject(projectData);
      
      // Load tasks and dependencies
      const [projectTasks, projectDeps] = await Promise.all([
        Task.filter({ project_id: projectId }),
        TaskDependency.filter({ project_id: projectId })
      ]);
      
      setTasks(projectTasks);
      setDependencies(projectDeps);
    } catch (error) {
      console.error('Error loading dependency data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDependencies = dependencies.filter(dep => {
    if (viewType === 'all') return true;
    return dep.type === viewType;
  });

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center mb-6">
        <Link to={projectId ? createPageUrl(`TaskManager?projectId=${projectId}`) : createPageUrl('Dashboard')}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Tasks
          </Button>
        </Link>
        <h1 className="text-2xl font-bold ml-4">Task Dependencies</h1>
      </div>

      {project && (
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">{project.title}</h2>
          <p className="text-gray-600">{project.description}</p>
        </div>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Dependency Graph</CardTitle>
          <div className="flex items-center gap-4">
            <Tabs value={viewType} onValueChange={setViewType}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="blocks">Blocks</TabsTrigger>
                <TabsTrigger value="relates_to">Relates To</TabsTrigger>
                <TabsTrigger value="requires">Requires</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hierarchical">Hierarchical</SelectItem>
                <SelectItem value="force">Force-Directed</SelectItem>
                <SelectItem value="circle">Circular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <DependencyGraph 
            tasks={tasks} 
            dependencies={filteredDependencies} 
          />
        </CardContent>
      </Card>
    </div>
  );
}