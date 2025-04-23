import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ZoomIn, 
  ZoomOut, 
  ChevronLeft, 
  ChevronRight, 
  Link as LinkIcon,
  Clock,
  Calendar as CalendarIcon,
  Download
} from 'lucide-react';
import { format, addDays, subDays, eachDayOfInterval, startOfWeek, endOfWeek, addWeeks, subWeeks } from 'date-fns';
import { Task, TaskDependency } from '@/api/entities';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';

export default function TaskTimeline({ tasks, project, teamMembers, onTasksChange }) {
  const [timeScale, setTimeScale] = useState('week'); // day, week, month, quarter
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dependencies, setDependencies] = useState([]);
  const [showDependencyModal, setShowDependencyModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [hoveredDate, setHoveredDate] = useState(null);
  const [groupBy, setGroupBy] = useState('none'); // none, assignee, project, priority
  
  // Handle zoom controls
  const handleZoomIn = () => {
    const scales = ['day', 'week', 'month', 'quarter'];
    const currentIndex = scales.indexOf(timeScale);
    if (currentIndex > 0) {
      setTimeScale(scales[currentIndex - 1]);
    }
  };

  const handleZoomOut = () => {
    const scales = ['day', 'week', 'month', 'quarter'];
    const currentIndex = scales.indexOf(timeScale);
    if (currentIndex < scales.length - 1) {
      setTimeScale(scales[currentIndex + 1]);
    }
  };

  // Navigation handlers
  const handlePrevPeriod = () => {
    switch (timeScale) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1));
        break;
      // Add other cases for month and quarter
    }
  };

  const handleNextPeriod = () => {
    switch (timeScale) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      // Add other cases for month and quarter
    }
  };

  // Calculate visible date range
  const getVisibleRange = () => {
    switch (timeScale) {
      case 'day':
        return [currentDate];
      case 'week':
        const start = startOfWeek(currentDate);
        const end = endOfWeek(currentDate);
        return eachDayOfInterval({ start, end });
      // Add other cases
      default:
        return [currentDate];
    }
  };

  // Group tasks based on selected grouping
  const getGroupedTasks = () => {
    switch (groupBy) {
      case 'assignee':
        return tasks.reduce((acc, task) => {
          const assignee = task.assigned_to || 'Unassigned';
          if (!acc[assignee]) acc[assignee] = [];
          acc[assignee].push(task);
          return acc;
        }, {});
      case 'priority':
        return tasks.reduce((acc, task) => {
          if (!acc[task.priority]) acc[task.priority] = [];
          acc[task.priority].push(task);
          return acc;
        }, {});
      default:
        return { 'All Tasks': tasks };
    }
  };

  // Calculate task position and width based on dates
  const getTaskStyle = (task) => {
    const visibleDates = getVisibleRange();
    const startDate = new Date(task.start_date || task.created_date);
    const endDate = new Date(task.due_date || startDate);
    
    // Calculate position percentage
    const totalDays = visibleDates.length;
    const startDay = visibleDates.findIndex(date => 
      format(date, 'yyyy-MM-dd') === format(startDate, 'yyyy-MM-dd')
    );
    
    if (startDay === -1) return null;
    
    const duration = Math.min(
      Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)),
      totalDays - startDay
    );
    
    return {
      left: `${(startDay / totalDays) * 100}%`,
      width: `${(duration / totalDays) * 100}%`,
      backgroundColor: getTaskColor(task)
    };
  };

  // Get task color based on status or priority
  const getTaskColor = (task) => {
    const colors = {
      high: 'rgb(239 68 68)', // red
      medium: 'rgb(234 179 8)', // yellow
      low: 'rgb(34 197 94)', // green
      completed: 'rgb(147 197 253)' // blue
    };
    
    return colors[task.priority] || colors.medium;
  };

  // Render timeline grid
  const renderTimelineGrid = () => {
    const dates = getVisibleRange();
    
    return (
      <div className="grid grid-cols-7 border-b">
        {dates.map(date => (
          <div 
            key={date.toString()} 
            className="p-2 text-center border-r text-sm"
            onMouseEnter={() => setHoveredDate(date)}
            onMouseLeave={() => setHoveredDate(null)}
          >
            <div className="font-medium">{format(date, 'EEE')}</div>
            <div className="text-gray-500">{format(date, 'MMM d')}</div>
          </div>
        ))}
      </div>
    );
  };

  // Render task bars
  const renderTaskBars = () => {
    const groupedTasks = getGroupedTasks();
    
    return Object.entries(groupedTasks).map(([group, tasks]) => (
      <div key={group} className="mb-6">
        <div className="font-medium mb-2 px-4">{group}</div>
        <div className="relative min-h-[200px]">
          {tasks.map((task, index) => {
            const style = getTaskStyle(task);
            if (!style) return null;
            
            return (
              <TooltipProvider key={task.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="absolute h-8 rounded-md cursor-pointer transition-all hover:brightness-90"
                      style={{
                        ...style,
                        top: `${index * 40}px`
                      }}
                      onClick={() => setSelectedTask(task)}
                    >
                      <div className="h-full flex items-center px-2 text-white text-sm truncate">
                        {task.title}
                      </div>
                      {task.progress && (
                        <div 
                          className="absolute bottom-0 left-0 h-1 bg-white/30"
                          style={{ width: `${task.progress}%` }}
                        />
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <div className="font-medium">{task.title}</div>
                      <div className="text-sm">
                        {format(new Date(task.start_date || task.created_date), 'MMM d')} - 
                        {format(new Date(task.due_date), 'MMM d')}
                      </div>
                      <div className="text-sm">{task.assigned_to || 'Unassigned'}</div>
                      <div className="flex items-center gap-1">
                        <Badge>{task.priority}</Badge>
                        {task.progress && (
                          <Badge variant="outline">{task.progress}% complete</Badge>
                        )}
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>
    ));
  };

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Timeline</CardTitle>
        <div className="flex items-center gap-2">
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Group by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Grouping</SelectItem>
              <SelectItem value="assignee">By Assignee</SelectItem>
              <SelectItem value="priority">By Priority</SelectItem>
              <SelectItem value="project">By Project</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomIn}
              disabled={timeScale === 'day'}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleZoomOut}
              disabled={timeScale === 'quarter'}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-1 border rounded-md p-1">
            <Button variant="ghost" size="icon" onClick={handlePrevPeriod}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="px-2 font-medium">
              {format(currentDate, 'MMM yyyy')}
            </div>
            <Button variant="ghost" size="icon" onClick={handleNextPeriod}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="border-t">
          {renderTimelineGrid()}
          <ScrollArea className="h-[calc(100vh-16rem)]">
            <div className="p-4">
              {renderTaskBars()}
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      
      {hoveredDate && (
        <Popover>
          <PopoverContent className="w-64">
            <div className="font-medium mb-2">
              {format(hoveredDate, 'MMMM d, yyyy')}
            </div>
            <div className="space-y-2">
              {tasks
                .filter(task => {
                  const taskDate = new Date(task.due_date);
                  return format(taskDate, 'yyyy-MM-dd') === format(hoveredDate, 'yyyy-MM-dd');
                })
                .map(task => (
                  <div key={task.id} className="text-sm">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-gray-500">{task.assigned_to}</div>
                  </div>
                ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </Card>
  );
}