import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Task, TaskDependency } from '@/api/entities';
import { Loader2 } from 'lucide-react';

export default function TaskDependencyGraph() {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [dependencies, setDependencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
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

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-4">Task Dependencies</h2>
      <div className="space-y-4">
        {tasks.map(task => (
          <div key={task.id} className="border p-4 rounded-lg">
            <h3 className="font-medium">{task.title}</h3>
            <div className="mt-2">
              <h4 className="text-sm text-gray-500">Dependencies:</h4>
              <ul className="mt-1 space-y-1">
                {dependencies
                  .filter(d => d.source_task_id === task.id)
                  .map(dep => {
                    const targetTask = tasks.find(t => t.id === dep.target_task_id);
                    return (
                      <li key={dep.id} className="text-sm">
                        {dep.type} → {targetTask?.title || 'Unknown task'}
                      </li>
                    );
                  })}
              </ul>
            </div>
            <div className="mt-2">
              <h4 className="text-sm text-gray-500">Required by:</h4>
              <ul className="mt-1 space-y-1">
                {dependencies
                  .filter(d => d.target_task_id === task.id)
                  .map(dep => {
                    const sourceTask = tasks.find(t => t.id === dep.source_task_id);
                    return (
                      <li key={dep.id} className="text-sm">
                        {sourceTask?.title || 'Unknown task'} → {dep.type}
                      </li>
                    );
                  })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}