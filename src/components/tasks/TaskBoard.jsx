
import React, { useState, useEffect } from 'react';
import { Task, TaskColumn, TeamMember, StatusColumn } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Plus, 
  Calendar, 
  User, 
  Settings, 
  Columns, 
  X, 
  Edit, 
  Trash2, 
  MoveVertical, 
  Check,
  Type,
  Hash,
  List,
  CheckSquare,
  ArrowUpDown,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Filter,
  Search,
  Code,
  Database,
  Cloud,
  TestTube,
  Palette,
  FileText
} from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import TaskForm from './TaskForm';
import ColumnManager from './ColumnManager';
import DependencySelector from './DependencySelector';
import StatusColumnManager from './StatusColumnManager';

const DEFAULT_COLUMNS = {
  todo: { title: 'To Do', color: 'bg-gray-100' },
  in_progress: { title: 'In Progress', color: 'bg-blue-50' },
  review: { title: 'Review', color: 'bg-yellow-50' },
  done: { title: 'Done', color: 'bg-green-50' }
};

export default function TaskBoard({ tasks, project, onTasksChange }) {
  const [showNewTask, setShowNewTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [columns, setColumns] = useState([]);
  const [viewMode, setViewMode] = useState('board');
  const [teamMembers, setTeamMembers] = useState([]);
  const [filters, setFilters] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTasks, setExpandedTasks] = useState({});
  const [tasksByStatus, setTasksByStatus] = useState({});
  const [showTaskRelationships, setShowTaskRelationships] = useState({});
  const [statusColumns, setStatusColumns] = useState([]);
  const [showStatusColumnManager, setShowStatusColumnManager] = useState(false);

  // Load custom columns and team members
  useEffect(() => {
    if (project?.id) {
      loadColumns();
      loadStatusColumns();
      loadTeamMembers();
    }
  }, [project]);

  const loadStatusColumns = async () => {
    try {
      const columns = await StatusColumn.filter(
        { project_id: project.id },
        'order'
      );
      setStatusColumns(columns);
    } catch (error) {
      console.error('Error loading status columns:', error);
    }
  };

  // Update tasks when they change or filters change
  useEffect(() => {
    if (tasks.length > 0) {
      organizeTasksByStatus();
    }
  }, [tasks, filters, searchQuery]);

  const loadColumns = async () => {
    try {
      const projectColumns = await TaskColumn.filter(
        { project_id: project.id },
        'order'
      );
      setColumns(projectColumns);
    } catch (error) {
      console.error('Error loading columns:', error);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const members = await TeamMember.filter({ project_id: project.id });
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      await Task.update(taskId, { status: newStatus });
      onTasksChange();
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    
    await updateTaskStatus(taskId, newStatus);
  };

  const handleTaskCreate = async (taskData) => {
    try {
      await Task.create(taskData);
      setShowNewTask(false);
      onTasksChange();
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleTaskUpdate = async (taskData) => {
    try {
      await Task.update(selectedTask.id, taskData);
      setShowEditTask(false);
      onTasksChange();
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleTaskDelete = async (taskId) => {
    try {
      await Task.delete(taskId);
      onTasksChange();
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const getChildTasks = (taskId) => {
    return tasks.filter(task => task.parent_task_id === taskId && task.hierarchy_level === 'child');
  };

  const getSiblingTasks = (taskId, parentId) => {
    if (!parentId) return [];
    return tasks.filter(
      task => task.parent_task_id === parentId && 
              task.hierarchy_level === 'sibling' && 
              task.id !== taskId
    );
  };

  const organizeTasksByStatus = () => {
    const filtered = tasks.filter(task => {
      // Filter by search query
      const matchesSearch = searchQuery
        ? task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          task.description?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      
      // Filter by other criteria
      let matches = true;
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== 'all') {
          if (key === 'assigned_to') {
            matches = matches && task.assigned_to === value;
          } else if (key === 'priority') {
            matches = matches && task.priority === value;
          } else if (key === 'role') {
            matches = matches && task.role === value;
          } else if (key.startsWith('custom_') && task.custom_fields) {
            const fieldKey = key.replace('custom_', '');
            matches = matches && task.custom_fields[fieldKey] === value;
          }
        }
      });
      
      return matchesSearch && matches;
    });
    
    // Group tasks by status
    const grouped = {};
    
    (statusColumns.length > 0 ? statusColumns : [
      { key: 'todo', title: 'To Do', color: 'gray' },
      { key: 'in_progress', title: 'In Progress', color: 'blue' },
      { key: 'review', title: 'Review', color: 'yellow' },
      { key: 'done', title: 'Done', color: 'green' }
    ]).forEach(column => {
      grouped[column.key] = [];
    });
    
    filtered.forEach(task => {
      if (grouped[task.status]) {
        grouped[task.status].push(task);
      }
    });
    
    setTasksByStatus(grouped);
  };

  const toggleTaskExpand = (taskId) => {
    setExpandedTasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const toggleTaskRelationships = (taskId) => {
    setShowTaskRelationships(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const renderFilters = () => {
    return (
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
            prefix={<Search className="w-4 h-4 mr-2 opacity-50" />}
          />
        </div>
        
        <Select
          value={filters.priority || 'all'}
          onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
        >
          <SelectTrigger className="w-[150px]">
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
        
        <Select
          value={filters.assigned_to || 'all'}
          onValueChange={(value) => setFilters(prev => ({ ...prev, assigned_to: value }))}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Assignees</SelectItem>
            <SelectItem value={null}>Unassigned</SelectItem>
            {teamMembers.map(member => (
              <SelectItem key={member.id} value={member.email}>
                {member.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select
          value={filters.role || 'all'}
          onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="frontend">Frontend</SelectItem>
            <SelectItem value="backend">Backend</SelectItem>
            <SelectItem value="devops">DevOps</SelectItem>
            <SelectItem value="qa">QA</SelectItem>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="product">Product</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
        
        {columns.filter(col => col.type === 'select').map(column => (
          <Select
            key={column.field_key}
            value={filters[`custom_${column.field_key}`] || 'all'}
            onValueChange={(value) => 
              setFilters(prev => ({ 
                ...prev, 
                [`custom_${column.field_key}`]: value 
              }))
            }
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={column.title} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All {column.title}</SelectItem>
              {column.options.map(option => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}
        
        {Object.keys(filters).length > 0 && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setFilters({})}
            className="h-10"
          >
            Clear Filters
          </Button>
        )}
      </div>
    );
  };

  const renderTaskCard = (task, isDraggable = true) => {
    const childTasks = getChildTasks(task.id);
    const hasChildren = childTasks.length > 0;
    const parentTask = task.parent_task_id ? tasks.find(t => t.id === task.parent_task_id) : null;
    const siblingTasks = parentTask ? getSiblingTasks(task.id, task.parent_task_id) : [];
    const hasSiblings = siblingTasks.length > 0;
    const isExpanded = expandedTasks[task.id];
    const showRelationships = showTaskRelationships[task.id];
    
    const priorityColors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800',
    };
    
    const roleIcons = {
      frontend: <Code className="w-4 h-4" />,
      backend: <Database className="w-4 h-4" />,
      devops: <Cloud className="w-4 h-4" />,
      qa: <TestTube className="w-4 h-4" />,
      design: <Palette className="w-4 h-4" />,
      product: <FileText className="w-4 h-4" />,
      other: <div className="w-4 h-4" />
    };
    
    const taskCard = (
      <div className={`p-3 bg-white rounded-md border shadow-sm ${
        task.parent_task_id ? 'border-l-4 border-l-blue-400' : ''
      } ${task.hierarchy_level === 'sibling' ? 'border-l-4 border-l-purple-400' : ''}`}>
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-1">
                {hasChildren && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-5 w-5 p-0"
                    onClick={() => toggleTaskExpand(task.id)}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                )}
                <h4 className="font-medium truncate">{task.title}</h4>
              </div>
              <div className="flex-shrink-0 flex gap-1">
                {parentTask || hasChildren || hasSiblings ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => toggleTaskRelationships(task.id)}
                  >
                    <Columns className="h-3.5 w-3.5" />
                  </Button>
                ) : null}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedTask(task);
                        setShowEditTask(true);
                      }}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Task
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleTaskDelete(task.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Task
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            {task.description && (
              <p className={`text-sm text-gray-500 mb-2 ${!isExpanded && 'line-clamp-2'}`}>
                {task.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-1.5 mt-2">
              <Badge variant="outline" className={priorityColors[task.priority]}>
                {task.priority}
              </Badge>
              
              {task.role !== 'other' && (
                <Badge variant="outline" className="flex items-center gap-1">
                  {roleIcons[task.role]}
                  <span>{task.role}</span>
                </Badge>
              )}
              
              {task.assigned_to && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <User className="w-3 h-3" />
                  <span className="truncate max-w-[100px]">
                    {task.assigned_to.split('@')[0]}
                  </span>
                </Badge>
              )}
              
              {task.due_date && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(task.due_date), 'MMM d')}
                </Badge>
              )}
              
              {/* Custom fields */}
              {columns.length > 0 && task.custom_fields && (
                <>
                  {columns
                    .filter(col => col.is_visible && task.custom_fields[col.field_key])
                    .map(col => {
                      const value = task.custom_fields[col.field_key];
                      if (!value || (Array.isArray(value) && value.length === 0)) return null;
                      
                      if (Array.isArray(value)) {
                        return value.map(v => (
                          <Badge key={`${col.field_key}-${v}`} variant="secondary" className="text-xs">
                            {col.title}: {v}
                          </Badge>
                        ));
                      }
                      
                      if (col.type === 'checkbox' && value === true) {
                        return (
                          <Badge key={col.field_key} variant="outline" className="flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            {col.title}
                          </Badge>
                        );
                      }
                      
                      if (value && typeof value !== 'boolean') {
                        return (
                          <Badge key={col.field_key} variant="secondary" className="text-xs">
                            {col.title}: {value}
                          </Badge>
                        );
                      }
                      
                      return null;
                    })}
                </>
              )}
            </div>
            
            {showRelationships && (
              <div className="mt-3 pt-2 border-t text-xs space-y-1.5">
                {parentTask && (
                  <div>
                    <span className="text-gray-500">Parent:</span>{' '}
                    <Badge variant="outline" className="text-xs">
                      {parentTask.title}
                    </Badge>
                  </div>
                )}
                
                {hasChildren && (
                  <div>
                    <span className="text-gray-500">Subtasks:</span>{' '}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {childTasks.map(child => (
                        <Badge key={child.id} variant="outline" className="text-xs">
                          {child.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {hasSiblings && (
                  <div>
                    <span className="text-gray-500">Related tasks:</span>{' '}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {siblingTasks.map(sibling => (
                        <Badge key={sibling.id} variant="outline" className="text-xs">
                          {sibling.title}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-2">
                  <DependencySelector
                    task={task}
                    tasks={tasks}
                    onDependencyChange={onTasksChange}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-3 pt-2 border-t space-y-2">
            <h5 className="text-sm font-medium">Subtasks</h5>
            <div className="space-y-2 pl-2 border-l-2 border-blue-100">
              {childTasks.map((childTask) => (
                <div key={childTask.id} className="pl-2">
                  {renderTaskCard(childTask, false)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
    
    if (!isDraggable) {
      return taskCard;
    }
    
    return (
      <Draggable key={task.id} draggableId={task.id} index={tasks.indexOf(task)}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            {taskCard}
          </div>
        )}
      </Draggable>
    );
  };

  const renderBoardView = () => {
    // If no custom status columns, use default
    const columnsToUse = statusColumns.length > 0 ? statusColumns : [
      { key: 'todo', title: 'To Do', color: 'gray' },
      { key: 'in_progress', title: 'In Progress', color: 'blue' },
      { key: 'review', title: 'Review', color: 'yellow' },
      { key: 'done', title: 'Done', color: 'green' }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <DragDropContext onDragEnd={onDragEnd}>
          {columnsToUse.map((column) => {
            const bgColorClass = `bg-${column.color}-50`;

            return (
              <div 
                key={column.key} 
                className={`border rounded-md ${bgColorClass}`}
              >
                <div className="p-3 border-b flex justify-between items-center">
                  <h3 className="font-medium">{column.title}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {tasksByStatus[column.key]?.length || 0}
                  </Badge>
                </div>
                
                <Droppable droppableId={column.key}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="p-2 min-h-[300px]"
                    >
                      {(tasksByStatus[column.key] || [])
                        .filter(task => !task.parent_task_id || task.hierarchy_level !== 'child')
                        .map((task) => (
                          <div key={task.id} className="mb-2">
                            {renderTaskCard(task)}
                          </div>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </DragDropContext>
      </div>
    );
  };

  const renderListView = () => {
    const allVisibleTasks = Object.values(tasksByStatus).flat().filter(
      task => !task.parent_task_id || task.hierarchy_level !== 'child'
    );
    
    return (
      <div className="border rounded-md">
        <div className="p-4 space-y-2">
          {allVisibleTasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks match your filters
            </div>
          ) : (
            allVisibleTasks.map(task => (
              <div key={task.id} className="mb-2">
                {renderTaskCard(task, false)}
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Tasks</CardTitle>
        <div className="flex items-center gap-2">
          <Tabs 
            value={viewMode} 
            onValueChange={setViewMode}
            className="mr-2"
          >
            <TabsList>
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>

          <Button 
            variant="outline" 
            onClick={() => setShowStatusColumnManager(true)}
            className="flex items-center gap-2"
          >
            <Columns className="w-4 h-4" />
            <span className="hidden md:inline">Status Columns</span>
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => setShowColumnManager(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden md:inline">Custom Fields</span>
          </Button>
          
          <Button onClick={() => setShowNewTask(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {renderFilters()}
        
        {viewMode === 'board' ? renderBoardView() : renderListView()}
        
        {/* New Task Dialog */}
        <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
            </DialogHeader>
            <TaskForm
              project={project}
              tasks={tasks}
              columns={columns}
              teamMembers={teamMembers}
              onSubmit={handleTaskCreate}
              onCancel={() => setShowNewTask(false)}
            />
          </DialogContent>
        </Dialog>
        
        {/* Edit Task Dialog */}
        <Dialog open={showEditTask} onOpenChange={setShowEditTask}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <TaskForm
                task={selectedTask}
                tasks={tasks}
                project={project}
                columns={columns}
                teamMembers={teamMembers}
                onSubmit={handleTaskUpdate}
                onCancel={() => setShowEditTask(false)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Add Status Column Manager Dialog */}
        <Dialog open={showStatusColumnManager} onOpenChange={setShowStatusColumnManager}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Manage Status Columns</DialogTitle>
            </DialogHeader>
            <StatusColumnManager
              project={project}
              statusColumns={statusColumns}
              onStatusColumnsChange={loadStatusColumns}
            />
          </DialogContent>
        </Dialog>
        
        {/* Column Manager Dialog */}
        <Dialog open={showColumnManager} onOpenChange={setShowColumnManager}>
          <DialogContent className="max-w-5xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Custom Fields</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[500px]">
              <ColumnManager
                project={project}
                columns={columns}
                onColumnsChange={loadColumns}
              />
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
