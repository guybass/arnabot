import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, LayoutGrid, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import GanttChart from './GanttChart';

export default function TaskTable({ tasks, onEdit, onDelete, onStatusChange }) {
  const [groupedTasks, setGroupedTasks] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [groupBy, setGroupBy] = useState('none'); // none, group_name, status, assigned_to, priority
  const [showGantt, setShowGantt] = useState(false);

  // Process and group tasks
  React.useEffect(() => {
    if (!tasks) return;
    
    let grouped = {};
    
    if (groupBy === 'none') {
      grouped = { 'All Tasks': tasks };
    } else {
      grouped = tasks.reduce((acc, task) => {
        const groupValue = task[groupBy] || 'Unassigned';
        if (!acc[groupValue]) {
          acc[groupValue] = [];
        }
        acc[groupValue].push(task);
        return acc;
      }, {});
    }
    
    // Set all groups expanded by default
    const newExpandedState = {};
    Object.keys(grouped).forEach(group => {
      newExpandedState[group] = true;
    });
    
    setGroupedTasks(grouped);
    setExpandedGroups(newExpandedState);
  }, [tasks, groupBy]);
  
  const toggleGroup = (group) => {
    setExpandedGroups({
      ...expandedGroups,
      [group]: !expandedGroups[group]
    });
  };
  
  const handleGroupChange = (value) => {
    setGroupBy(value);
    setShowGantt(false);
  };
  
  const priorityColor = (priority) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };
  
  const statusColor = (status) => {
    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-purple-100 text-purple-800',
      done: 'bg-green-100 text-green-800'
    };
    return colors[status] || colors.medium;
  };

  const handleTaskClick = (task) => {
    if (onEdit) {
      onEdit(task);
    }
  };

  return (
    <div className="bg-white rounded-md border">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Group by:</span>
            <select 
              className="rounded-md border border-gray-300 p-1 text-sm"
              value={groupBy}
              onChange={(e) => handleGroupChange(e.target.value)}
            >
              <option value="none">None</option>
              <option value="group_name">Group</option>
              <option value="status">Status</option>
              <option value="assigned_to">Assignee</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          
          {/* Toggle between Table and Group Gantt */}
          <Button
            variant={showGantt ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGantt(!showGantt)}
            disabled={groupBy === 'none'}
          >
            {showGantt ? (
              <>
                <Calendar className="h-4 w-4 mr-2" />
                Table View
              </>
            ) : (
              <>
                <LayoutGrid className="h-4 w-4 mr-2" />
                Group Gantt
              </>
            )}
          </Button>
        </div>
        
        <div className="text-sm text-gray-500">
          {tasks?.length || 0} tasks
        </div>
      </div>
      
      {showGantt ? (
        <GanttChart tasks={tasks} groupLevel={true} />
      ) : (
        <div className="max-h-[calc(100vh-250px)] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Task</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(groupedTasks).map(([group, groupTasks]) => (
                <React.Fragment key={group}>
                  {/* Group header */}
                  {groupBy !== 'none' && (
                    <TableRow className="bg-gray-50 hover:bg-gray-100">
                      <TableCell 
                        colSpan={7} 
                        className="font-medium cursor-pointer"
                        onClick={() => toggleGroup(group)}
                      >
                        <div className="flex items-center">
                          {expandedGroups[group] ? (
                            <ChevronDown className="h-4 w-4 mr-2" />
                          ) : (
                            <ChevronRight className="h-4 w-4 mr-2" />
                          )}
                          {group} ({groupTasks.length})
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                  
                  {/* Group tasks */}
                  {expandedGroups[group] && groupTasks.map((task) => (
                    <TableRow 
                      key={task.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => handleTaskClick(task)}
                    >
                      <TableCell className="font-medium">{task.title}</TableCell>
                      <TableCell>
                        <Badge className={statusColor(task.status)} variant="outline">{task.status}</Badge>
                      </TableCell>
                      <TableCell>
                        {task.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={`https://avatar.vercel.sh/${task.assigned_to}`} />
                              <AvatarFallback>{task.assigned_to[0].toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-sm">{task.assigned_to}</span>
                          </div>
                        ) : (
                          <span className="text-gray-500 text-sm">Unassigned</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={priorityColor(task.priority)}>{task.priority}</Badge>
                      </TableCell>
                      <TableCell>
                        {task.start_date && format(new Date(task.start_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        {task.due_date && format(new Date(task.due_date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${task.progress || 0}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          {task.progress || 0}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}