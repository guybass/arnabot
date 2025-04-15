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
      showTaskDetail(tasksOnDate[0]);
    } else if (tasksOnDate.length > 1) {
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
            Day: ({ date }) => (
              <div className="relative w-full h-full flex items-center justify-center">
                <span>{date?.getDate()}</span>
                {dateHasTasks(date) && (
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
                <Button>
                  Edit Task
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedDate && getTasksForDate(selectedDate).map(task => (
                <Button
                  key={task.id}
                  variant="outline"
                  className="w-full justify-start text-left"
                  onClick={() => showTaskDetail(task)}
                >
                  <div>
                    <div className="font-medium">{task.title}</div>
                    <div className="text-sm text-gray-500">
                      {task.status} • {task.priority} priority
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}