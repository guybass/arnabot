import React, { useState } from 'react';
import { Project } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function ProjectHeader({ projects, selectedProject, onProjectSelect, onProjectsChange }) {
  const [showNewProject, setShowNewProject] = useState(false);
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    status: 'planning',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    target_date: ''
  });

  const createProject = async () => {
    await Project.create(newProject);
    setShowNewProject(false);
    onProjectsChange();
  };

  const statusColors = {
    planning: 'bg-purple-100 text-purple-800',
    in_progress: 'bg-blue-100 text-blue-800',
    on_hold: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800'
  };

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 rounded-lg shadow-sm">
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <Select value={selectedProject?.id} onValueChange={(id) => onProjectSelect(projects.find(p => p.id === id))}>
            <SelectTrigger className="w-[300px]">
              <SelectValue placeholder="Select a project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.id} value={project.id}>
                  {project.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowNewProject(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Project
          </Button>
        </div>
        {selectedProject && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={statusColors[selectedProject.status]}>
                {selectedProject.status.replace('_', ' ')}
              </Badge>
              {selectedProject.start_date && (
                <div className="flex items-center text-sm text-gray-500">
                  <Calendar className="w-4 h-4 mr-1" />
                  {format(new Date(selectedProject.start_date), 'MMM d, yyyy')}
                  {selectedProject.target_date && (
                    <> - {format(new Date(selectedProject.target_date), 'MMM d, yyyy')}</>
                  )}
                </div>
              )}
            </div>
            {selectedProject.description && (
              <p className="text-sm text-gray-600">{selectedProject.description}</p>
            )}
          </div>
        )}
      </div>

      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Input
                placeholder="Project Title"
                value={newProject.title}
                onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Textarea
                placeholder="Project Description"
                value={newProject.description}
                onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Start Date</label>
                <Input
                  type="date"
                  value={newProject.start_date}
                  onChange={(e) => setNewProject({ ...newProject, start_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-500">Target Date</label>
                <Input
                  type="date"
                  value={newProject.target_date}
                  onChange={(e) => setNewProject({ ...newProject, target_date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProject(false)}>Cancel</Button>
            <Button onClick={createProject}>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}