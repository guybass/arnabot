
import React, { useState, useEffect } from 'react';
import { Task, Project, TeamMember } from '@/api/entities';
import { useSearchParams, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from '@/components/ui/tabs';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Filter, Plus, Table, KanbanSquare, BarChart2 } from 'lucide-react';
import TaskTable from '../components/tasks/TaskTable';
import KanbanBoard from '../components/tasks/KanbanBoard';
import TaskForm from '../components/tasks/TaskForm';
import GanttChart from '../components/tasks/GanttChart';
import FeedbackButton from '../components/feedback/FeedbackButton';
import { applyOwnershipFilter } from '@/components/utils/ownershipFilters';

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showProjectInfo, setShowProjectInfo] = useState(false);
  const [view, setView] = useState('table');
  const [searchParams, setSearchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [teamMembers, setTeamMembers] = useState([]);
  const [ganttMode, setGanttMode] = useState('general'); // 'general' or 'group'
  const [taskDependencies, setTaskDependencies] = useState([]);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      // If there's a project ID in the URL, use that project
      if (projectIdFromUrl) {
        const projectFromUrl = projects.find(p => p.id === projectIdFromUrl);
        if (projectFromUrl) {
          setSelectedProject(projectFromUrl);
          return;
        }
      }
      
      // Otherwise use the first project
      setSelectedProject(projects[0]);
    }
  }, [projects, projectIdFromUrl]);

  useEffect(() => {
    if (selectedProject) {
      loadTasks();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      // Apply ownership filter to projects
      const projectFilter = await applyOwnershipFilter();
      const projectList = await Project.filter(projectFilter);
      setProjects(projectList);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const loadTasks = async () => {
    try {
      // Apply ownership filter combined with project filter
      const taskFilter = await applyOwnershipFilter({ project_id: selectedProject.id });
      const taskList = await Task.filter(taskFilter);
      setTasks(taskList);
      
      // Fetch team members for the selected project
      const teamFilter = await applyOwnershipFilter({ project_id: selectedProject.id });
      const teamData = await TeamMember.filter(teamFilter);
      setTeamMembers(teamData);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const handleTaskCreate = async (taskData) => {
    try {
      // Process numeric fields to ensure they are proper numbers or null
      const processedData = { ...taskData };
      
      // Ensure the project_id is set
      processedData.project_id = selectedProject.id;
      
      // Ensure estimated_hours is a number or null
      if (processedData.estimated_hours === '') {
        processedData.estimated_hours = null;
      }
      
      // Parse progress as a number
      if (typeof processedData.progress === 'string') {
        const progressVal = parseInt(processedData.progress, 10);
        processedData.progress = isNaN(progressVal) ? 0 : progressVal;
      }
      
      // Create the task with processed data
      await Task.create(processedData);
      setShowCreateTask(false);
      loadTasks();
    } catch (error) {
      console.error('Error creating task:', error);
      alert('Error creating task: ' + error.message);
    }
  };

  const handleTaskUpdate = async (taskData) => {
    try {
      // Process numeric fields
      const processedData = { ...taskData };
      
      // Ensure estimated_hours is a number or null
      if (processedData.estimated_hours === '') {
        processedData.estimated_hours = null;
      }
      
      // Parse progress as a number
      if (typeof processedData.progress === 'string' && processedData.progress !== '') {
        const progressVal = parseInt(processedData.progress, 10);
        processedData.progress = isNaN(progressVal) ? 0 : progressVal;
      }
      
      // Update the task
      await Task.update(selectedTask.id, processedData);
      setShowEditTask(false);
      setSelectedTask(null);
      loadTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Error updating task: ' + error.message);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await Task.delete(taskId);
      loadTasks();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleTaskStatusChange = async (taskId, status) => {
    try {
      await Task.update(taskId, { status });
      loadTasks();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus;
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white border-b p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Task Manager</h1>
            
            <Select
              value={selectedProject?.id || ''}
              onValueChange={(value) => {
                const project = projects.find(p => p.id === value);
                setSelectedProject(project);
                setSearchParams({ projectId: value });
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select Project" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>{project.title}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              onClick={() => setShowCreateTask(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          </div>
        </div>
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-4">
            {view === 'gantt' && (
              <Select value={ganttMode} onValueChange={setGanttMode}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Gantt View Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Gantt</SelectItem>
                  <SelectItem value="group">Grouped Gantt</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            <div className="flex items-center gap-2">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-4">
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="mb-4">
            <TabsTrigger value="table" className="flex items-center">
              <Table className="h-4 w-4 mr-2" /> Table
            </TabsTrigger>
            <TabsTrigger value="kanban" className="flex items-center">
              <KanbanSquare className="h-4 w-4 mr-2" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="gantt" className="flex items-center">
              <BarChart2 className="h-4 w-4 mr-2" /> Gantt
            </TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <Card>
              <CardContent className="p-0">
                <TaskTable 
                  tasks={filteredTasks} 
                  onEdit={(task) => {
                    setSelectedTask(task);
                    setShowEditTask(true);
                  }}
                  onDelete={handleTaskDelete}
                  onStatusChange={handleTaskStatusChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="kanban">
            <KanbanBoard 
              tasks={filteredTasks} 
              onEdit={(task) => {
                setSelectedTask(task);
                setShowEditTask(true);
              }}
              onDelete={handleTaskDelete}
              onStatusChange={handleTaskStatusChange}
            />
          </TabsContent>

          <TabsContent value="gantt">
            <Card>
              <CardContent>
                <GanttChart 
                  tasks={filteredTasks}
                  groupLevel={ganttMode === 'group'}
                  dependencies={taskDependencies}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Task Creation Dialog */}
      <Dialog 
        open={showCreateTask} 
        onOpenChange={(open) => {
          if (!open) setShowCreateTask(false);
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <TaskForm 
            task={null}
            tasks={tasks}
            project={selectedProject}
            teamMembers={teamMembers}
            onSubmit={handleTaskCreate}
            onCancel={() => setShowCreateTask(false)}
            projects={projects}
            initialStatus="todo"
          />
        </DialogContent>
      </Dialog>
      
      {/* Task Edit Dialog */}
      <Dialog 
        open={showEditTask} 
        onOpenChange={(open) => {
          if (!open) {
            setShowEditTask(false);
            setSelectedTask(null);
          }
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          {selectedTask && (
            <TaskForm
              task={selectedTask}
              tasks={tasks.filter(t => t.id !== selectedTask.id)}
              project={selectedProject}
              teamMembers={teamMembers}
              onSubmit={handleTaskUpdate}
              onCancel={() => {
                setShowEditTask(false);
                setSelectedTask(null);
              }}
              projects={projects}
            />
          )}
        </DialogContent>
      </Dialog>
      
      <FeedbackButton pageName="TaskManager" />
    </div>
  );
}
