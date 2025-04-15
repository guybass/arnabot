import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { format, isSameDay } from 'date-fns';

export default function TaskCalendar({ tasks, project, onTasksChange }) {
  const [date, setDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [showTaskDetails, setShowTaskDetails] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  const handleSelect = (date) => {
    setSelectedDate(date);
    const tasksOnDate = getTasksForDate(date);
    if (tasksOnDate.length === 1) {
      // If only one task, show it directly
      showTaskDetail(tasksOnDate[0]);
    } else if (tasksOnDate.length > 1) {
      // If multiple tasks, show the date dialog
      setShowTaskDetails(true);
    }
  };

  const showTaskDetail = (task) => {
    setSelectedTask(task);
    setShowTaskDetails(true);
  };

  const getTasksForDate = (date) => {
    if (!date) return [];
    return tasks.filter(task => {
      if (!task.due_date) return false;
      const dueDate = new Date(task.due_date);
      return isSameDay(dueDate, date);
    });
  };

  const dateHasTasks = (date) => {
    return getTasksForDate(date).length > 0;
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

  const renderTasksForSelectedDate = () => {
    if (!selectedDate) return null;
    
    const tasksOnDate = getTasksForDate(selectedDate);
    
    if (tasksOnDate.length === 0) {
      return (
        <div className="text-center py-4 text-gray-500">
          No tasks due on this date
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {tasksOnDate.map(task => (
          <div 
            key={task.id} 
            className="p-3 border rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => showTaskDetail(task)}
          >
            <div className="flex items-center justify-between">
              <div className="font-medium">{task.title}</div>
              <Badge className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Status: {task.status}
            </div>
            {task.assigned_to && (
              <div className="text-sm text-gray-500">
                Assigned to: {task.assigned_to}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className="h-[80vh]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Calendar</CardTitle>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(date);
              if (view === 'month') {
                newDate.setMonth(newDate.getMonth() - 1);
              } else {
                newDate.setDate(newDate.getDate() - 7);
              }
              setDate(newDate);
            }}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Prev
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(date);
              if (view === 'month') {
                newDate.setMonth(newDate.getMonth() + 1);
              } else {
                newDate.setDate(newDate.getDate() + 7);
              }
              setDate(newDate);
            }}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
          <Select value={view} onValueChange={setView}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Month View</SelectItem>
              <SelectItem value="week">Week View</SelectItem>
            </SelectContent>
          </Select>
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
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          month={date}
          className="rounded-md border"
          modifiers={{
            hasTasks: (date) => dateHasTasks(date)
          }}
          modifiersClassNames={{
            hasTasks: 'bg-blue-50 font-medium'
          }}
          components={{
            DayContent: ({ day }) => (
              <div className="relative w-full h-full flex items-center justify-center">
                <span>{day.day}</span>
                {dateHasTasks(day.date) && (
                  <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                    <div className="h-1 w-1 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            )
          }}
        />
      </CardContent>
      
      <Dialog open={showTaskDetails} onOpenChange={setShowTaskDetails}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedDate 
                ? `Tasks for ${format(selectedDate, 'MMMM d, yyyy')}` 
                : 'Task Details'}
            </DialogTitle>
          </DialogHeader>
          {selectedTask ? (
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
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setSelectedTask(null);
                  if (selectedDate && getTasksForDate(selectedDate).length > 1) {
                    // If we have multiple tasks on the date, show the list again
                    // instead of closing the dialog
                  } else {
                    setShowTaskDetails(false);
                  }
                }}>
                  {selectedDate && getTasksForDate(selectedDate).length > 1 ? 'Back to List' : 'Close'}
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
          ) : (
            renderTasksForSelectedDate()
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}