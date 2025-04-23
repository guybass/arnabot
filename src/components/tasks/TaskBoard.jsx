import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Plus, 
  MoreHorizontal, 
  Calendar as CalendarIcon, 
  User, 
  AlertTriangle,
  Settings,
  Edit,
  Trash2,
  Move,
  GripVertical,
  Check,
  X
} from 'lucide-react';
import { Task, TeamMember, StatusColumn, Project } from '@/api/entities';
import TaskForm from './TaskForm';
import { format, isAfter, isBefore } from 'date-fns';
import usePermissions from '../auth/usePermissions';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';

export default function TaskBoard({ tasks, project, onTasksChange }) {
  const { hasPermission, isAdmin } = usePermissions();
  const [columns, setColumns] = useState({});
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [statusColumns, setStatusColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showManageColumns, setShowManageColumns] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [showDeleteColumn, setShowDeleteColumn] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskField, setEditingTaskField] = useState(null);
  const [editingTaskValues, setEditingTaskValues] = useState({});
  const [newColumn, setNewColumn] = useState({
    key: '',
    title: '',
    color: 'gray',
    order: 0
  });

  const loadStatusColumns = async () => {
    try {
      let columns;
      
      if (project) {
        columns = await StatusColumn.filter({ project_id: project.id }, 'order');
      } else {
        columns = await StatusColumn.list('order');
      }
      
      // If no custom columns, create default ones
      if (columns.length === 0) {
        const defaultColumns = [
          { key: 'todo', title: 'To Do', color: 'gray', order: 0 },
          { key: 'in_progress', title: 'In Progress', color: 'blue', order: 1 },
          { key: 'review', title: 'Review', color: 'yellow', order: 2 },
          { key: 'done', title: 'Done', color: 'green', order: 3 }
        ];
        
        setStatusColumns(defaultColumns);
      } else {
        setStatusColumns(columns);
      }
    } catch (error) {
      console.error("Error loading status columns:", error);
      
      // Set default columns if error
      setStatusColumns([
        { key: 'todo', title: 'To Do', color: 'gray', order: 0 },
        { key: 'in_progress', title: 'In Progress', color: 'blue', order: 1 },
        { key: 'review', title: 'Review', color: 'yellow', order: 2 },
        { key: 'done', title: 'Done', color: 'green', order: 3 }
      ]);
    }
  };

  useEffect(() => {
    // Load all projects
    const loadProjects = async () => {
      try {
        const fetchedProjects = await Project.list();
        setProjects(fetchedProjects);
      } catch (error) {
        console.error("Error loading projects:", error);
      }
    };
    
    // Load team members
    const loadTeamMembers = async () => {
      try {
        const members = await TeamMember.list();
        setTeamMembers(members);
      } catch (error) {
        console.error("Error loading team members:", error);
      }
    };
    
    loadTeamMembers();
    loadStatusColumns();
    loadProjects();
  }, [project]);

  useEffect(() => {
    // When status columns or tasks change, update the columns data structure
    if (statusColumns.length > 0) {
      const newColumns = {};
      
      // Initialize empty task arrays for each status column
      statusColumns.forEach(column => {
        newColumns[column.key] = {
          id: column.id,
          title: column.title,
          color: column.color,
          tasks: []
        };
      });

      // Add uncategorized column for tasks with unknown status
      newColumns['uncategorized'] = {
        id: 'uncategorized',
        title: 'Uncategorized',
        color: 'gray',
        tasks: []
      };
      
      // Populate tasks into appropriate columns
      tasks.forEach(task => {
        if (task.status && newColumns[task.status]) {
          newColumns[task.status].tasks.push(task);
        } else {
          newColumns['uncategorized'].tasks.push(task);
        }
      });
      
      // Sort tasks in each column
      Object.keys(newColumns).forEach(columnKey => {
        newColumns[columnKey].tasks.sort((a, b) => {
          // Sort by due date (overdue first, then upcoming)
          if (a.due_date && b.due_date) {
            return new Date(a.due_date) - new Date(b.due_date);
          } else if (a.due_date) {
            return -1;
          } else if (b.due_date) {
            return 1;
          }
          
          // Then by priority
          const priorityMap = { urgent: 0, high: 1, medium: 2, low: 3 };
          return priorityMap[a.priority] - priorityMap[b.priority];
        });
      });
      
      setColumns(newColumns);
    }
  }, [statusColumns, tasks]);

  const handleDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;
    
    // If dropped outside of a valid droppable or in same position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Handle column reordering
    if (type === 'column') {
      const reorderedColumns = Array.from(statusColumns);
      const [movedColumn] = reorderedColumns.splice(source.index, 1);
      reorderedColumns.splice(destination.index, 0, movedColumn);
      
      // Update order values for all affected columns
      const updatedColumns = reorderedColumns.map((col, index) => ({
        ...col,
        order: index
      }));
      
      setStatusColumns(updatedColumns);
      
      // Persist column order to database
      try {
        const updates = updatedColumns.map(col => 
          col.id ? StatusColumn.update(col.id, { order: col.order }) : null
        );
        await Promise.all(updates.filter(Boolean));
      } catch (error) {
        console.error("Error updating column order:", error);
      }
      
      return;
    }
    
    // Handle task reordering
    const taskId = draggableId;
    const newStatus = destination.droppableId;
    
    try {
      await Task.update(taskId, { status: newStatus });
      onTasksChange();
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
    setShowEditTask(true);
  };

  const handleAddTask = () => {
    setSelectedTask(null);
    setShowAddTask(true);
  };

  const handleCreateTask = async (taskData) => {
    try {
      // If no status is set, use the first column's key
      if (!taskData.status && statusColumns.length > 0) {
        taskData.status = statusColumns[0].key;
      }
      
      await Task.create(taskData);
      setShowAddTask(false);
      onTasksChange();
    } catch (error) {
      console.error("Error creating task:", error);
    }
  };

  const handleUpdateTask = async (taskData) => {
    try {
      await Task.update(selectedTask.id, taskData);
      setShowEditTask(false);
      setSelectedTask(null);
      onTasksChange();
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await Task.delete(taskId);
        onTasksChange();
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  const handleStartEditingTask = (task, field) => {
    setEditingTaskId(task.id);
    setEditingTaskField(field);
    setEditingTaskValues({
      ...task
    });
    
    // For fields like title and description, we need to focus on the input
    setTimeout(() => {
      const inputElement = document.getElementById(`inline-edit-${field}-${task.id}`);
      if (inputElement) {
        inputElement.focus();
      }
    }, 50);
  };

  const handleTaskFieldChange = (e) => {
    const { name, value } = e.target;
    setEditingTaskValues(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveTaskField = async () => {
    if (!editingTaskId || !editingTaskField) return;
    
    try {
      await Task.update(editingTaskId, {
        [editingTaskField]: editingTaskValues[editingTaskField]
      });
      
      setEditingTaskId(null);
      setEditingTaskField(null);
      onTasksChange();
    } catch (error) {
      console.error("Error updating task field:", error);
    }
  };

  const handleCancelEditingTask = () => {
    setEditingTaskId(null);
    setEditingTaskField(null);
  };

  const handleCreateColumn = async () => {
    try {
      // Generate safe key from title
      const key = newColumn.key || newColumn.title.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
      
      const columnData = {
        ...newColumn,
        key,
        project_id: project?.id || null,
        order: statusColumns.length
      };
      
      await StatusColumn.create(columnData);
      setShowAddColumn(false);
      setNewColumn({
        key: '',
        title: '',
        color: 'gray',
        order: 0
      });
      
      // Reload columns
      loadStatusColumns();
    } catch (error) {
      console.error("Error creating status column:", error);
    }
  };

  const handleEditColumn = (column) => {
    setSelectedColumn({
      id: column.id,
      key: column.key,
      title: column.title,
      color: column.color,
      order: column.order
    });
    setShowEditColumn(true);
  };

  const handleUpdateColumn = async () => {
    try {
      if (!selectedColumn?.id) return;
      
      await StatusColumn.update(selectedColumn.id, {
        title: selectedColumn.title,
        color: selectedColumn.color
      });
      
      setShowEditColumn(false);
      
      // Reload columns
      loadStatusColumns();
    } catch (error) {
      console.error("Error updating status column:", error);
    }
  };

  const handleDeleteColumn = async () => {
    try {
      if (!selectedColumn?.id) return;
      
      // Check if column has tasks
      const columnTasks = tasks.filter(task => task.status === selectedColumn.key);
      if (columnTasks.length > 0) {
        // Move tasks to uncategorized
        const updates = columnTasks.map(task => 
          Task.update(task.id, { status: 'uncategorized' })
        );
        await Promise.all(updates);
      }
      
      await StatusColumn.delete(selectedColumn.id);
      setShowDeleteColumn(false);
      
      // Reload columns
      loadStatusColumns();
      
      onTasksChange();
    } catch (error) {
      console.error("Error deleting status column:", error);
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return colors[priority] || colors.medium;
  };

  const getColumnStyle = (color) => {
    const colors = {
      gray: 'bg-gray-50 border-gray-200',
      blue: 'bg-blue-50 border-blue-200',
      green: 'bg-green-50 border-green-200',
      yellow: 'bg-yellow-50 border-yellow-200',
      red: 'bg-red-50 border-red-200',
      purple: 'bg-purple-50 border-purple-200',
      pink: 'bg-pink-50 border-pink-200',
      orange: 'bg-orange-50 border-orange-200'
    };
    return colors[color] || colors.gray;
  };

  const getColumnHeaderColor = (color) => {
    const colors = {
      gray: 'border-gray-300',
      blue: 'border-blue-300',
      green: 'border-green-300',
      yellow: 'border-yellow-300',
      red: 'border-red-300',
      purple: 'border-purple-300',
      pink: 'border-pink-300',
      orange: 'border-orange-300'
    };
    return colors[color] || colors.gray;
  };

  const isDueSoon = (date) => {
    if (!date) return false;
    const today = new Date();
    const dueDate = new Date(date);
    const inThreeDays = new Date();
    inThreeDays.setDate(today.getDate() + 3);
    
    return isBefore(today, dueDate) && isBefore(dueDate, inThreeDays);
  };
  
  const isOverdue = (date) => {
    if (!date) return false;
    const today = new Date();
    const dueDate = new Date(date);
    return isBefore(dueDate, today);
  };

  const getProjectInfo = (projectId) => {
    if (!projectId) return null;
    return projects.find(p => p.id === projectId);
  };

  return (
    <div className="h-full">
      <div className="mb-4 flex justify-between items-center">
        <div className="flex gap-2 items-center">
          {/* Add Column Button */}
          {hasPermission('create_tasks') && (
            <Button onClick={() => setShowAddColumn(true)} variant="outline">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Column
            </Button>
          )}
          
          {/* Manage Columns Button */}
          {hasPermission('create_tasks') && (
            <Button variant="outline" onClick={() => setShowManageColumns(true)}>
              <Settings className="h-4 w-4 mr-1.5" />
              Manage Columns
            </Button>
          )}
        </div>
        
        {/* Add Task Button */}
        {hasPermission('create_tasks') && (
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Task
          </Button>
        )}
      </div>
      
      <div className="overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns" direction="horizontal" type="column">
            {(provided) => (
              <div 
                className="flex gap-4" 
                style={{ minWidth: (statusColumns.length * 300) + 300 }} // +300 for uncategorized
                {...provided.droppableProps}
                ref={provided.innerRef}
              >
                {/* Status Columns */}
                {statusColumns.map((column, index) => (
                  <Draggable 
                    key={column.key} 
                    draggableId={column.key}
                    index={index}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="w-72 flex-shrink-0"
                      >
                        <Card className={`${getColumnStyle(column.color)} h-full border`}>
                          <CardHeader className={`py-3 px-4 border-b ${getColumnHeaderColor(column.color)}`}>
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <div 
                                  {...provided.dragHandleProps}
                                  className="cursor-move hover:text-gray-700 text-gray-400"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                
                                <CardTitle className="text-sm font-medium">
                                  {column.title}
                                </CardTitle>
                                <Badge>{columns[column.key]?.tasks?.length || 0}</Badge>
                              </div>
                              
                              {/* Column actions dropdown */}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => handleEditColumn(column)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Column
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setSelectedColumn(column);
                                      setShowDeleteColumn(true);
                                    }}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Column
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </CardHeader>
                          <CardContent className="px-2 overflow-visible">
                            <Droppable droppableId={column.key}>
                              {(provided) => (
                                <div
                                  {...provided.droppableProps}
                                  ref={provided.innerRef}
                                  className="space-y-2 min-h-[200px]"
                                >
                                  {columns[column.key]?.tasks.map((task, index) => (
                                    <Draggable
                                      key={task.id}
                                      draggableId={task.id}
                                      index={index}
                                    >
                                      {(provided, snapshot) => (
                                        <div
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          className={`bg-white rounded-md border p-3 shadow-sm ${
                                            snapshot.isDragging ? 'shadow-md opacity-90 ring-2 ring-blue-400' : ''
                                          } hover:shadow-md transition-shadow`}
                                        >
                                          <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                              {/* Inline editable title */}
                                              {editingTaskId === task.id && editingTaskField === 'title' ? (
                                                <div className="flex items-center gap-1">
                                                  <Input
                                                    id={`inline-edit-title-${task.id}`}
                                                    name="title"
                                                    value={editingTaskValues.title}
                                                    onChange={handleTaskFieldChange}
                                                    className="text-sm font-medium"
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSaveTaskField()}
                                                  />
                                                  <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-6 w-6" 
                                                    onClick={handleSaveTaskField}
                                                  >
                                                    <Check className="h-3 w-3" />
                                                  </Button>
                                                  <Button 
                                                    size="icon" 
                                                    variant="ghost" 
                                                    className="h-6 w-6" 
                                                    onClick={handleCancelEditingTask}
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <h3 
                                                  className="font-medium line-clamp-2 py-1 cursor-pointer hover:bg-gray-50 px-1 rounded"
                                                  onClick={() => handleStartEditingTask(task, 'title')}
                                                >
                                                  {task.title}
                                                </h3>
                                              )}
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                              <div {...provided.dragHandleProps} className="cursor-move text-gray-400 hover:text-gray-600">
                                                <GripVertical className="h-4 w-4" />
                                              </div>
                                              
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                  </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                  <DropdownMenuItem onClick={() => handleTaskClick(task)}>
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem 
                                                    onClick={() => handleDeleteTask(task.id)}
                                                    className="text-red-600"
                                                  >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
                                            </div>
                                          </div>
                                          
                                          {/* Inline editable description */}
                                          {task.description && (
                                            <div className="mb-2">
                                              {editingTaskId === task.id && editingTaskField === 'description' ? (
                                                <div className="flex flex-col gap-1">
                                                  <Textarea
                                                    id={`inline-edit-description-${task.id}`}
                                                    name="description"
                                                    value={editingTaskValues.description}
                                                    onChange={handleTaskFieldChange}
                                                    className="text-xs min-h-[60px]"
                                                  />
                                                  <div className="flex justify-end gap-1">
                                                    <Button 
                                                      size="sm" 
                                                      variant="ghost" 
                                                      className="h-6" 
                                                      onClick={handleSaveTaskField}
                                                    >
                                                      Save
                                                    </Button>
                                                    <Button 
                                                      size="sm" 
                                                      variant="ghost" 
                                                      className="h-6" 
                                                      onClick={handleCancelEditingTask}
                                                    >
                                                      Cancel
                                                    </Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <p 
                                                  className="text-xs text-gray-600 line-clamp-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                                  onClick={() => handleStartEditingTask(task, 'description')}
                                                >
                                                  {task.description}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                          
                                          {task.project_id && (
                                            <div className="mb-2 text-xs text-gray-500 flex items-center">
                                              <Badge variant="outline" className="text-xs mr-1">
                                                {getProjectInfo(task.project_id)?.title || 'Project'}
                                              </Badge>
                                            </div>
                                          )}
                                          
                                          <div className="flex flex-wrap gap-1 mb-2">
                                            <Badge className={getPriorityColor(task.priority)}>
                                              {task.priority}
                                            </Badge>
                                            
                                            {task.role && task.role !== 'other' && (
                                              <Badge variant="outline">{task.role}</Badge>
                                            )}
                                          </div>
                                          
                                          <div className="text-xs text-gray-500 space-y-1">
                                            {task.assigned_to && (
                                              <div className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                <span className="truncate">{task.assigned_to}</span>
                                              </div>
                                            )}
                                            
                                            {task.due_date && (
                                              <div className={`flex items-center gap-1 ${
                                                isOverdue(task.due_date) 
                                                  ? 'text-red-600' 
                                                  : isDueSoon(task.due_date) 
                                                    ? 'text-yellow-600' 
                                                    : ''
                                              }`}>
                                                {isOverdue(task.due_date) ? (
                                                  <AlertTriangle className="h-3 w-3" />
                                                ) : (
                                                  <CalendarIcon className="h-3 w-3" />
                                                )}
                                                <span>{format(new Date(task.due_date), 'MMM d')}</span>
                                                {isOverdue(task.due_date) && <span>Overdue</span>}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </Draggable>
                                  ))}
                                  {provided.placeholder}
                                </div>
                              )}
                            </Droppable>
                          </CardContent>
                          <CardFooter className="pt-0 px-2 pb-2">
                            {/* Add task button in column */}
                            {hasPermission('create_tasks') && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="w-full justify-center text-gray-500 hover:text-gray-900"
                                onClick={() => {
                                  setSelectedTask(null);
                                  setShowAddTask(true);
                                  // Pre-set the status for the new task based on the column
                                  setSelectedColumn({ key: column.key });
                                }}
                              >
                                <Plus className="h-4 w-4 mr-1" /> Add Task
                              </Button>
                            )}
                          </CardFooter>
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                
                {/* Uncategorized Column */}
                <div className="w-72 flex-shrink-0">
                  <Card className="bg-gray-50 border-gray-200 h-full border">
                    <CardHeader className="py-3 px-4 border-b border-gray-300">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-medium">Uncategorized</CardTitle>
                          <Badge>{columns['uncategorized']?.tasks?.length || 0}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-2 overflow-visible">
                      <Droppable droppableId="uncategorized">
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-2 min-h-[200px]"
                          >
                            {columns['uncategorized']?.tasks.map((task, index) => (
                              <Draggable
                                key={task.id}
                                draggableId={task.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`bg-white rounded-md border p-3 shadow-sm ${
                                      snapshot.isDragging ? 'shadow-md opacity-90 ring-2 ring-blue-400' : ''
                                    } hover:shadow-md transition-shadow`}
                                  >
                                    {/* Reuse the same task content as above */}
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1">
                                        {editingTaskId === task.id && editingTaskField === 'title' ? (
                                          <div className="flex items-center gap-1">
                                            <Input
                                              id={`inline-edit-title-${task.id}`}
                                              name="title"
                                              value={editingTaskValues.title}
                                              onChange={handleTaskFieldChange}
                                              className="text-sm font-medium"
                                              onKeyDown={(e) => e.key === 'Enter' && handleSaveTaskField()}
                                            />
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-6 w-6" 
                                              onClick={handleSaveTaskField}
                                            >
                                              <Check className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                              size="icon" 
                                              variant="ghost" 
                                              className="h-6 w-6" 
                                              onClick={handleCancelEditingTask}
                                            >
                                              <X className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <h3 
                                            className="font-medium line-clamp-2 py-1 cursor-pointer hover:bg-gray-50 px-1 rounded"
                                            onClick={() => handleStartEditingTask(task, 'title')}
                                          >
                                            {task.title}
                                          </h3>
                                        )}
                                      </div>
                                      
                                      <div className="flex items-center gap-1">
                                        <div {...provided.dragHandleProps} className="cursor-move text-gray-400 hover:text-gray-600">
                                          <GripVertical className="h-4 w-4" />
                                        </div>
                                        
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                              <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleTaskClick(task)}>
                                              <Edit className="h-4 w-4 mr-2" />
                                              Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem 
                                              onClick={() => handleDeleteTask(task.id)}
                                              className="text-red-600"
                                            >
                                              <Trash2 className="h-4 w-4 mr-2" />
                                              Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                    
                                    {task.description && (
                                      <div className="mb-2">
                                        {editingTaskId === task.id && editingTaskField === 'description' ? (
                                          <div className="flex flex-col gap-1">
                                            <Textarea
                                              id={`inline-edit-description-${task.id}`}
                                              name="description"
                                              value={editingTaskValues.description}
                                              onChange={handleTaskFieldChange}
                                              className="text-xs min-h-[60px]"
                                            />
                                            <div className="flex justify-end gap-1">
                                              <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-6" 
                                                onClick={handleSaveTaskField}
                                              >
                                                Save
                                              </Button>
                                              <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="h-6" 
                                                onClick={handleCancelEditingTask}
                                              >
                                                Cancel
                                              </Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <p 
                                            className="text-xs text-gray-600 line-clamp-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
                                            onClick={() => handleStartEditingTask(task, 'description')}
                                          >
                                            {task.description}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                    
                                    {task.project_id && (
                                      <div className="mb-2 text-xs text-gray-500 flex items-center">
                                        <Badge variant="outline" className="text-xs mr-1">
                                          {getProjectInfo(task.project_id)?.title || 'Project'}
                                        </Badge>
                                      </div>
                                    )}
                                    
                                    <div className="flex flex-wrap gap-1 mb-2">
                                      <Badge className={getPriorityColor(task.priority)}>
                                        {task.priority}
                                      </Badge>
                                      
                                      {task.role && task.role !== 'other' && (
                                        <Badge variant="outline">{task.role}</Badge>
                                      )}
                                    </div>
                                    
                                    <div className="text-xs text-gray-500 space-y-1">
                                      {task.assigned_to && (
                                        <div className="flex items-center gap-1">
                                          <User className="h-3 w-3" />
                                          <span className="truncate">{task.assigned_to}</span>
                                        </div>
                                      )}
                                      
                                      {task.due_date && (
                                        <div className={`flex items-center gap-1 ${
                                          isOverdue(task.due_date) 
                                            ? 'text-red-600' 
                                            : isDueSoon(task.due_date) 
                                              ? 'text-yellow-600' 
                                              : ''
                                        }`}>
                                          {isOverdue(task.due_date) ? (
                                            <AlertTriangle className="h-3 w-3" />
                                          ) : (
                                            <CalendarIcon className="h-3 w-3" />
                                          )}
                                          <span>{format(new Date(task.due_date), 'MMM d')}</span>
                                          {isOverdue(task.due_date) && <span>Overdue</span>}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                    <CardFooter className="pt-0 px-2 pb-2">
                      {hasPermission('create_tasks') && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full justify-center text-gray-500 hover:text-gray-900"
                          onClick={() => {
                            setSelectedTask(null);
                            setShowAddTask(true);
                            setSelectedColumn({ key: 'uncategorized' });
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" /> Add Task
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                </div>
                
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
      
      {/* Task creation dialog */}
      <Dialog open={showAddTask} onOpenChange={(open) => {
        if (!open) setShowAddTask(false);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Task</DialogTitle>
          </DialogHeader>
          <TaskForm
            task={null}
            tasks={tasks}
            project={project}
            teamMembers={teamMembers}
            onSubmit={handleCreateTask}
            onCancel={() => setShowAddTask(false)}
            projects={projects}
            initialStatus={selectedColumn?.key}
          />
        </DialogContent>
      </Dialog>
      
      {/* Task editing dialog */}
      <Dialog open={showEditTask} onOpenChange={(open) => {
        if (!open) {
          setShowEditTask(false);
          setSelectedTask(null);
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {selectedTask && (
            <TaskForm
              task={selectedTask}
              tasks={tasks.filter(t => t.id !== selectedTask.id)}
              project={project}
              teamMembers={teamMembers}
              onSubmit={handleUpdateTask}
              onCancel={() => {
                setShowEditTask(false);
                setSelectedTask(null);
              }}
              projects={projects}
            />
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add Column Dialog */}
      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="column-title">Column Title</Label>
              <Input
                id="column-title"
                placeholder="e.g., In Review, Blocked, Ready for QA"
                value={newColumn.title}
                onChange={(e) => setNewColumn({...newColumn, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="column-color">Color Theme</Label>
              <Select
                value={newColumn.color}
                onValueChange={(value) => setNewColumn({...newColumn, color: value})}
              >
                <SelectTrigger id="column-color">
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gray">Gray</SelectItem>
                  <SelectItem value="blue">Blue</SelectItem>
                  <SelectItem value="green">Green</SelectItem>
                  <SelectItem value="yellow">Yellow</SelectItem>
                  <SelectItem value="red">Red</SelectItem>
                  <SelectItem value="purple">Purple</SelectItem>
                  <SelectItem value="pink">Pink</SelectItem>
                  <SelectItem value="orange">Orange</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddColumn(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateColumn} disabled={!newColumn.title.trim()}>
              Create Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Column Dialog */}
      <Dialog open={showEditColumn} onOpenChange={setShowEditColumn}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
          </DialogHeader>
          {selectedColumn && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-column-title">Column Title</Label>
                <Input
                  id="edit-column-title"
                  value={selectedColumn.title}
                  onChange={(e) => setSelectedColumn({...selectedColumn, title: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-column-color">Color Theme</Label>
                <Select
                  value={selectedColumn.color}
                  onValueChange={(value) => setSelectedColumn({...selectedColumn, color: value})}
                >
                  <SelectTrigger id="edit-column-color">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gray">Gray</SelectItem>
                    <SelectItem value="blue">Blue</SelectItem>
                    <SelectItem value="green">Green</SelectItem>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="red">Red</SelectItem>
                    <SelectItem value="purple">Purple</SelectItem>
                    <SelectItem value="pink">Pink</SelectItem>
                    <SelectItem value="orange">Orange</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditColumn(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateColumn}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Column Confirmation */}
      <Dialog open={showDeleteColumn} onOpenChange={setShowDeleteColumn}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Column</DialogTitle>
          </DialogHeader>
          {selectedColumn && (
            <div className="space-y-4 py-4">
              <p>
                Are you sure you want to delete the column "{selectedColumn.title}"?
              </p>
              {columns[selectedColumn.key]?.tasks.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-md text-sm">
                  <p>This column contains {columns[selectedColumn.key].tasks.length} tasks.</p>
                  <p>These tasks will be moved to the Uncategorized column.</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteColumn(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteColumn}>
              Delete Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Manage Columns Dialog */}
      <Dialog open={showManageColumns} onOpenChange={setShowManageColumns}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Board Columns</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop to reorder columns. Changes will be saved automatically.
            </p>
            
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="manage-columns" type="column">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {statusColumns.map((column, index) => (
                      <Draggable
                        key={column.key}
                        draggableId={column.key}
                        index={index}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`border rounded-md p-3 ${getColumnStyle(column.color)}`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div {...provided.dragHandleProps} className="cursor-move text-gray-400">
                                  <GripVertical className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="font-medium">{column.title}</div>
                                  <div className="text-xs text-gray-500">
                                    {columns[column.key]?.tasks.length || 0} tasks
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleEditColumn(column)}
                                >
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  className="text-red-600"
                                  onClick={() => {
                                    setSelectedColumn(column);
                                    setShowDeleteColumn(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowAddColumn(true)}>
              <Plus className="h-4 w-4 mr-1.5" />
              Add New Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}