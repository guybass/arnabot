import React, { useEffect, useState, useRef } from 'react';
import { format, addDays, eachDayOfInterval, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export default function GanttChart({ tasks, groupLevel = false }) {
  const [taskGroups, setTaskGroups] = useState({});
  const [timeRange, setTimeRange] = useState({
    start: startOfMonth(new Date()),
    end: endOfMonth(new Date())
  });
  const chartRef = useRef(null);
  
  // Create fake dependency data for demonstration
  // In real implementation, this would come from your database
  const dependencies = tasks
    .filter(task => task.dependencies && task.dependencies.length > 0)
    .flatMap(task => 
      task.dependencies.map(depId => ({
        source: depId,
        target: task.id,
        type: 'blocks'
      }))
    );

  useEffect(() => {
    if (tasks.length > 0) {
      // Find the earliest start date and latest end date
      const dates = tasks.reduce((acc, task) => {
        if (task.start_date && (!acc.start || new Date(task.start_date) < acc.start)) {
          acc.start = new Date(task.start_date);
        }
        if (task.due_date && (!acc.end || new Date(task.due_date) > acc.end)) {
          acc.end = new Date(task.due_date);
        }
        return acc;
      }, { start: null, end: null });

      if (dates.start && dates.end) {
        setTimeRange({
          start: startOfMonth(dates.start),
          end: endOfMonth(dates.end)
        });
      }

      // Group tasks if needed
      if (groupLevel) {
        const groups = tasks.reduce((acc, task) => {
          const group = task.group_name || 'Ungrouped';
          if (!acc[group]) acc[group] = [];
          acc[group].push(task);
          return acc;
        }, {});
        setTaskGroups(groups);
      } else {
        setTaskGroups({ 'All Tasks': tasks });
      }
    }
  }, [tasks, groupLevel]);
  
  // Improved dependency lines rendering
  const renderDependencyLines = () => {
    if (!dependencies.length) return null;
    
    return dependencies.map((dep, index) => {
      const sourceTask = tasks.find(t => t.id === dep.source);
      const targetTask = tasks.find(t => t.id === dep.target);
      
      if (!sourceTask || !targetTask) return null;

      // Get the source and target task elements by ID
      const sourceEl = document.getElementById(`task-${sourceTask.id}`);
      const targetEl = document.getElementById(`task-${targetTask.id}`);
      
      if (!sourceEl || !targetEl || !chartRef.current) return null;

      // Get positions relative to the chart container
      const chartRect = chartRef.current.getBoundingClientRect();
      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();

      // Calculate positions
      const x1 = sourceRect.right - chartRect.left;
      const y1 = sourceRect.top + (sourceRect.height / 2) - chartRect.top;
      const x2 = targetRect.left - chartRect.left;
      const y2 = targetRect.top + (targetRect.height / 2) - chartRect.top;

      const distance = x2 - x1;
      const controlPoint = Math.min(distance / 2, 50); // Limit control point distance

      return (
        <svg
          key={`dep-${index}`}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <defs>
            <marker
              id={`arrowhead-${index}`}
              markerWidth="10"
              markerHeight="7"
              refX="9"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill="rgba(100, 116, 139, 0.8)"
              />
            </marker>
          </defs>
          <path
            d={`
              M ${x1},${y1}
              C ${x1 + controlPoint},${y1}
                ${x2 - controlPoint},${y2}
                ${x2},${y2}
            `}
            fill="none"
            stroke="rgba(100, 116, 139, 0.5)"
            strokeWidth="2"
            strokeDasharray="5,5"
            markerEnd={`url(#arrowhead-${index})`}
          />
        </svg>
      );
    });
  };

  const getTaskBarColor = (task) => {
    switch (task.priority) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-blue-500';
      case 'high': return 'bg-orange-500';
      case 'urgent': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const days = eachDayOfInterval({ start: timeRange.start, end: timeRange.end });

  return (
    <div className="h-full" ref={chartRef} id="gantt-chart">
      <ScrollArea className="h-[calc(100vh-200px)]">
        {Object.entries(taskGroups).map(([groupName, groupTasks]) => (
          <Card key={groupName} className="mb-6">
            <CardHeader className="py-2">
              <CardTitle className="text-lg">{groupName}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative min-w-[800px]">
                <div className="grid grid-cols-[200px,1fr]">
                  <div className="border-r bg-gray-50">
                    <div className="h-10 border-b px-4 flex items-center font-medium">
                      Task
                    </div>
                    {groupTasks.map(task => (
                      <div
                        key={task.id}
                        className="h-8 px-4 flex items-center border-b truncate"
                      >
                        {task.title}
                      </div>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <div className="flex border-b">
                      {days.map(day => (
                        <div
                          key={day.toString()}
                          className={`flex-shrink-0 w-8 h-10 border-r flex items-center justify-center text-xs ${
                            isSameDay(day, new Date()) ? 'bg-blue-50 font-bold' : ''
                          }`}
                        >
                          {format(day, 'd')}
                        </div>
                      ))}
                    </div>

                    <div className="relative">
                      {groupTasks.map(task => {
                        if (!task.start_date || !task.due_date) return (
                          <div key={task.id} className="h-8 border-b"></div>
                        );

                        const startDate = new Date(task.start_date);
                        const endDate = new Date(task.due_date);
                        const startOffset = Math.max(
                          0,
                          (startDate - timeRange.start) / (24 * 60 * 60 * 1000)
                        );
                        const duration = Math.max(
                          1,
                          (endDate - startDate) / (24 * 60 * 60 * 1000) + 1
                        );

                        return (
                          <div key={task.id} className="h-8 relative border-b">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div
                                    id={`task-${task.id}`}
                                    className={`absolute top-1 h-6 ${getTaskBarColor(task)} rounded text-white px-2 flex items-center text-xs`}
                                    style={{
                                      left: `${startOffset * 32}px`,
                                      width: `${duration * 32}px`,
                                    }}
                                  >
                                    <div className="truncate">
                                      {task.title}
                                    </div>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <div className="font-medium">{task.title}</div>
                                    <div className="text-xs">
                                      {task.start_date && (
                                        <span>Start: {format(new Date(task.start_date), 'MMM d, yyyy')}</span>
                                      )}
                                      {task.due_date && (
                                        <span className="ml-2">Due: {format(new Date(task.due_date), 'MMM d, yyyy')}</span>
                                      )}
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge>{task.status}</Badge>
                                      <Badge variant="outline">{task.priority}</Badge>
                                      {task.assigned_to && (
                                        <Badge variant="outline">Assigned to: {task.assigned_to}</Badge>
                                      )}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                {renderDependencyLines()}
              </div>
            </CardContent>
          </Card>
        ))}
      </ScrollArea>
    </div>
  );
}