import React, { useState, useEffect } from 'react';
import { Task, TaskDependency } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function TaskTimeline({ tasks, project, onTasksChange }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scale, setScale] = useState(1); // 1 = days, 2 = weeks, 3 = months
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [dependencies, setDependencies] = useState([]);

  useEffect(() => {
    if (project) {
      loadDependencies();
    }
  }, [project, tasks]);

  const loadDependencies = async () => {
    try {
      const deps = await TaskDependency.filter({ project_id: project.id });
      setDependencies(deps);
    } catch (error) {
      console.error("Error loading dependencies:", error);
    }
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleZoomIn = () => {
    if (scale > 1) {
      setScale(scale - 1);
    }
  };

  const handleZoomOut = () => {
    if (scale < 3) {
      setScale(scale + 1);
    }
  };

  const showTaskDetail = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  // Generate days for the timeline
  const start = startOfMonth(currentDate);
  const end = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start, end });

  const dueDateTasks = tasks.filter(task => task.due_date);

  // Group tasks by date
  const tasksByDate = dueDateTasks.reduce((acc, task) => {
    const dateKey = task.due_date;
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(task);
    return acc;
  }, {});

  // Calculate task duration (for visualization)
  const getTaskDuration = (task) => {
    if (!task.due_date) return 1;
    
    // Default to 1 day if no actual start date is set
    return 1;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-500',
      medium: 'bg-yellow-500',
      high: 'bg-orange-500',
      urgent: 'bg-red-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  const renderTask = (task, index) => {
    const duration = getTaskDuration(task);
    const isPast = new Date(task.due_date) < new Date();
    
    // Find dependencies
    const taskDependencies = dependencies.filter(
      dep => dep.source_task_id === task.id || dep.target_task_id === task.id
    );
    
    return (
      <TooltipProvider key={task.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={`rounded-sm cursor-pointer mt-1 ${
                isPast && task.status !== 'done' ? 'opacity-50' : ''
              }`}
              style={{ 
                height: '24px', 
                marginTop: `${index * 30}px` 
              }}
              onClick={() => showTaskDetail(task)}
            >
              <div 
                className={`h-full text-xs text-white px-2 flex items-center rounded truncate ${getPriorityColor(task.priority)}`}
                style={{ width: `${duration * 100}%` }}
              >
                {task.title}
              </div>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-bold">{task.title}</div>
              <div>Status: {task.status}</div>
              <div>Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</div>
              {task.assigned_to && <div>Assigned: {task.assigned_to}</div>}
              {taskDependencies.length > 0 && (
                <div>Dependencies: {taskDependencies.length}</div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  return (
    <Card className="h-[80vh]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Timeline</CardTitle>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handlePrevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-lg font-medium">
            {format(currentDate, 'MMMM yyyy')}
          </div>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleNextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleZoomIn}
            disabled={scale === 1}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleZoomOut}
            disabled={scale === 3}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            onClick={() => {
              // Open task creation dialog with current date
              // This would connect to your existing task creation flow
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="border-b bg-gray-50 flex">
          {days.map(day => (
            <div 
              key={day.toString()} 
              className={`text-center py-2 text-xs ${
                isWeekend(day) ? 'bg-gray-100' : ''
              }`}
              style={{ width: `${100 / days.length}%` }}
            >
              <div className="font-medium">{format(day, 'd')}</div>
              <div className="text-gray-500">{format(day, 'EEE')}</div>
            </div>
          ))}
        </div>
        
        <ScrollArea className="h-[calc(80vh-120px)]">
          <div className="relative p-4">
            {dueDateTasks.map((task, index) => {
              // Calculate position based on due date
              const taskDate = new Date(task.due_date);
              const dayIndex = days.findIndex(day => 
                day.getDate() === taskDate.getDate() && 
                day.getMonth() === taskDate.getMonth()
              );
              
              if (dayIndex === -1) return null; // Task not in current month view
              
              const leftPosition = `${(dayIndex / days.length) * 100}%`;
              
              return (
                <div
                  key={task.id}
                  className="absolute"
                  style={{ 
                    left: leftPosition,
                    top: `${index * 36 + 10}px`,
                    width: `${100 / days.length}%`
                  }}
                >
                  {renderTask(task, 0)}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
      
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task Details</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold">{selectedTask.title}</h3>
                <div className="mt-1 text-sm text-gray-500">
                  {selectedTask.description || 'No description'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Status</div>
                  <div>{selectedTask.status}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Priority</div>
                  <div>{selectedTask.priority}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Due Date</div>
                  <div>{selectedTask.due_date && format(new Date(selectedTask.due_date), 'MMM d, yyyy')}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Assigned To</div>
                  <div>{selectedTask.assigned_to || 'Unassigned'}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-2">Dependencies</div>
                {dependencies
                  .filter(dep => dep.source_task_id === selectedTask.id || dep.target_task_id === selectedTask.id)
                  .map(dep => {
                    const isSource = dep.source_task_id === selectedTask.id;
                    const relatedTaskId = isSource ? dep.target_task_id : dep.source_task_id;
                    const relatedTask = tasks.find(t => t.id === relatedTaskId);
                    
                    if (!relatedTask) return null;
                    
                    return (
                      <div key={dep.id} className="text-sm flex items-center py-1">
                        {isSource ? (
                          <span>This task depends on: <strong>{relatedTask.title}</strong></span>
                        ) : (
                          <span><strong>{relatedTask.title}</strong> depends on this task</span>
                        )}
                      </div>
                    );
                  })}
                
                {!dependencies.some(dep => 
                  dep.source_task_id === selectedTask.id || dep.target_task_id === selectedTask.id
                ) && (
                  <div className="text-sm text-gray-500">No dependencies</div>
                )}
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTaskDetails(false)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    // This would open your existing task edit form
                    setShowTaskDetails(false);
                  }}
                >
                  Edit Task
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}