
import React, { useState, useEffect } from 'react';
import { Task, TaskColumn } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import DependencySelector from './DependencySelector';

const DEFAULT_COLUMNS = {
  todo: { title: 'To Do', color: 'bg-gray-100' },
  in_progress: { title: 'In Progress', color: 'bg-blue-50' },
  review: { title: 'Review', color: 'bg-yellow-50' },
  done: { title: 'Done', color: 'bg-green-50' }
};

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: Calendar },
  { value: 'select', label: 'Select (One)', icon: ArrowUpDown },
  { value: 'multiselect', label: 'Select (Multiple)', icon: List },
  { value: 'user', label: 'User', icon: User },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare }
];

export default function TaskBoard({ tasks, project, onTasksChange }) {
  const [showNewTask, setShowNewTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [columns, setColumns] = useState([]);
  const [editingColumn, setEditingColumn] = useState(null);
  const [newTask, setNewTask] = useState({
    project_id: project?.id,
    title: '',
    description: '',
    role: 'other',
    status: 'todo',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    custom_fields: {}
  });
  
  const [newColumn, setNewColumn] = useState({
    project_id: project?.id,
    title: '',
    field_key: '',
    type: 'text',
    default_value: '',
    options: [],
    is_required: false,
    order: 0,
    is_visible: true
  });

  const [viewMode, setViewMode] = useState('board');
  const [newOptionText, setNewOptionText] = useState('');

  // Load columns when project changes
  useEffect(() => {
    if (project) {
      loadColumns();
    }
  }, [project]);

  const loadColumns = async () => {
    try {
      const customColumns = await TaskColumn.filter({ project_id: project.id }, 'order');
      setColumns(customColumns);
    } catch (error) {
      console.error("Error loading columns:", error);
    }
  };

  const createTask = async () => {
    await Task.create(newTask);
    setShowNewTask(false);
    resetTaskForm();
    onTasksChange();
  };
  
  const updateTask = async () => {
    if (!selectedTask) return;
    
    await Task.update(selectedTask.id, {
      ...selectedTask,
      ...newTask
    });
    
    setShowEditTask(false);
    resetTaskForm();
    onTasksChange();
  };

  const resetTaskForm = () => {
    setNewTask({
      project_id: project?.id,
      title: '',
      description: '',
      role: 'other',
      status: 'todo',
      priority: 'medium',
      assigned_to: '',
      due_date: '',
      custom_fields: {}
    });
  };

  const editTask = (task) => {
    setSelectedTask(task);
    setNewTask({
      ...task,
      project_id: project.id
    });
    setShowEditTask(true);
  };

  const onDragEnd = async (result) => {
    if (!result.destination) return;
    
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    
    await Task.update(taskId, { status: newStatus });
    onTasksChange();
  };

  const createColumn = async () => {
    // Generate a sanitized field key if none provided
    if (!newColumn.field_key) {
      newColumn.field_key = newColumn.title
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
    }
    
    // Set order to be the last
    newColumn.order = columns.length;
    
    await TaskColumn.create(newColumn);
    setShowAddColumn(false);
    resetColumnForm();
    loadColumns();
  };
  
  const updateColumn = async () => {
    if (!editingColumn) return;
    
    await TaskColumn.update(editingColumn.id, newColumn);
    setShowEditColumn(false);
    resetColumnForm();
    loadColumns();
  };
  
  const deleteColumn = async (columnId) => {
    await TaskColumn.delete(columnId);
    loadColumns();
  };
  
  const resetColumnForm = () => {
    setNewColumn({
      project_id: project?.id,
      title: '',
      field_key: '',
      type: 'text',
      default_value: '',
      options: [],
      is_required: false,
      order: 0,
      is_visible: true
    });
    setNewOptionText('');
  };
  
  const addOption = () => {
    if (newOptionText && !newColumn.options.includes(newOptionText)) {
      setNewColumn({
        ...newColumn,
        options: [...newColumn.options, newOptionText]
      });
      setNewOptionText('');
    }
  };
  
  const removeOption = (option) => {
    setNewColumn({
      ...newColumn,
      options: newColumn.options.filter(o => o !== option),
      default_value: newColumn.default_value === option ? '' : newColumn.default_value
    });
  };

  const handleCustomFieldChange = (field_key, value) => {
    setNewTask(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [field_key]: value
      }
    }));
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  const roleColors = {
    frontend: 'bg-purple-100 text-purple-800',
    backend: 'bg-indigo-100 text-indigo-800',
    devops: 'bg-cyan-100 text-cyan-800',
    qa: 'bg-emerald-100 text-emerald-800',
    design: 'bg-pink-100 text-pink-800',
    product: 'bg-amber-100 text-amber-800',
    other: 'bg-gray-100 text-gray-800'
  };

  const formatFieldValue = (task, column) => {
    const value = task.custom_fields?.[column.field_key];
    
    if (value === undefined || value === null || value === '') {
      return '-';
    }
    
    switch (column.type) {
      case 'date':
        return format(new Date(value), 'MMM d, yyyy');
      case 'checkbox':
        return value ? 'Yes' : 'No';
      case 'multiselect':
        return Array.isArray(value) ? value.join(', ') : value;
      default:
        return value;
    }
  };

  const renderTaskCard = (task) => {
    return (
      <div className="bg-white p-3 rounded-lg shadow-sm">
        <div className="flex flex-col gap-2">
          <span className="font-medium">{task.title}</span>
          {task.description && (
            <p className="text-sm text-gray-600 line-clamp-2">{task.description}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Badge className={priorityColors[task.priority]}>
              {task.priority}
            </Badge>
            <Badge className={roleColors[task.role]}>
              {task.role}
            </Badge>
          </div>
          
          {/* Add DependencySelector */}
          <DependencySelector 
            task={task}
            tasks={tasks}
            onDependencyChange={onTasksChange}
          />
          
          {/* Render visible custom fields */}
          {columns
            .filter(col => col.is_visible)
            .map(column => {
              const value = formatFieldValue(task, column);
              if (value === '-') return null;
              
              return (
                <div key={column.field_key} className="text-xs text-gray-600 flex gap-1">
                  <span className="font-medium">{column.title}:</span> {value}
                </div>
              );
            })}
          
          {(task.assigned_to || task.due_date) && (
            <div className="flex items-center gap-3 text-sm text-gray-500">
              {task.assigned_to && (
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {task.assigned_to.split('@')[0]}
                </div>
              )}
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(task.due_date), 'MMM d')}
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-end">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-7 w-7 p-0" 
              onClick={(e) => {
                e.stopPropagation();
                editTask(task);
              }}
            >
              <Edit className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderTaskInTable = (task) => {
    return (
      <tr key={task.id} className="hover:bg-gray-50">
        <td className="p-2 border-b">
          <div className="font-medium">{task.title}</div>
          {/* Add DependencySelector in table view */}
          <div className="mt-1">
            <DependencySelector 
              task={task}
              tasks={tasks}
              onDependencyChange={onTasksChange}
            />
          </div>
        </td>
        <td className="p-2 border-b">
          <Badge className={priorityColors[task.priority]}>
            {task.priority}
          </Badge>
        </td>
        <td className="p-2 border-b">
          <Badge className={`bg-${task.status === 'todo' ? 'gray' : task.status === 'in_progress' ? 'blue' : task.status === 'review' ? 'yellow' : 'green'}-100 text-${task.status === 'todo' ? 'gray' : task.status === 'in_progress' ? 'blue' : task.status === 'review' ? 'yellow' : 'green'}-800`}>
            {task.status.replace('_', ' ')}
          </Badge>
        </td>
        
        {/* Render custom columns */}
        {columns
          .filter(col => col.is_visible)
          .map(column => (
            <td key={column.field_key} className="p-2 border-b">
              {formatFieldValue(task, column)}
            </td>
          ))}
        
        <td className="p-2 border-b">
          {task.assigned_to ? task.assigned_to.split('@')[0] : '-'}
        </td>
        <td className="p-2 border-b">
          {task.due_date ? format(new Date(task.due_date), 'MMM d') : '-'}
        </td>
        <td className="p-2 border-b">
          <Button 
            variant="ghost" 
            size="sm"
            className="h-7 w-7 p-0" 
            onClick={() => editTask(task)}
          >
            <Edit className="h-3.5 w-3.5" />
          </Button>
        </td>
      </tr>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">Tasks</CardTitle>
        <div className="flex gap-2">
          <Tabs defaultValue="board" value={viewMode} onValueChange={setViewMode} className="mr-4">
            <TabsList>
              <TabsTrigger value="board">Board</TabsTrigger>
              <TabsTrigger value="table">Table</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            variant="outline"
            onClick={() => setShowColumnManager(true)} 
            className="flex items-center gap-2"
          >
            <Columns className="w-4 h-4" /> Manage Columns
          </Button>
          
          <Button onClick={() => setShowNewTask(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Add Task
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'board' ? (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(DEFAULT_COLUMNS).map(([status, column]) => (
                <Droppable key={status} droppableId={status}>
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={`rounded-lg p-4 ${column.color}`}
                    >
                      <h3 className="font-medium mb-4">{column.title}</h3>
                      <div className="space-y-3">
                        {tasks
                          .filter(task => task.status === status)
                          .map((task, index) => (
                            <Draggable key={task.id} draggableId={task.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  {renderTaskCard(task)}
                                </div>
                              )}
                            </Draggable>
                          ))}
                        {provided.placeholder}
                      </div>
                    </div>
                  )}
                </Droppable>
              ))}
            </div>
          </DragDropContext>
        ) : (
          <div className="overflow-x-auto rounded-md border">
            <table className="min-w-full divide-y">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  
                  {/* Custom column headers */}
                  {columns
                    .filter(col => col.is_visible)
                    .map(column => (
                      <th key={column.field_key} className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{column.title}</th>
                    ))}
                  
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y">
                {tasks.map(task => renderTaskInTable(task))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>

      {/* New Task Dialog */}
      <Dialog open={showNewTask} onOpenChange={setShowNewTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <Input
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <Textarea
              placeholder="Task Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={newTask.role}
                onValueChange={(value) => setNewTask({ ...newTask, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="devops">DevOps</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="email"
                placeholder="Assignee Email"
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
              />
              <Input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>

            {/* Custom fields */}
            {columns.length > 0 && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-medium mb-4">Custom Fields</h3>
                  <div className="space-y-4">
                    {columns.map(column => (
                      <div key={column.id} className="space-y-2">
                        <Label htmlFor={`custom-${column.field_key}`}>
                          {column.title}
                          {column.is_required && <span className="text-red-500">*</span>}
                        </Label>

                        {column.type === 'text' && (
                          <Input 
                            id={`custom-${column.field_key}`}
                            value={newTask.custom_fields[column.field_key] || ''}
                            onChange={(e) => handleCustomFieldChange(column.field_key, e.target.value)}
                          />
                        )}

                        {column.type === 'number' && (
                          <Input 
                            id={`custom-${column.field_key}`}
                            type="number"
                            value={newTask.custom_fields[column.field_key] || ''}
                            onChange={(e) => handleCustomFieldChange(column.field_key, 
                              e.target.value === '' ? '' : Number(e.target.value)
                            )}
                          />
                        )}

                        {column.type === 'date' && (
                          <Input 
                            id={`custom-${column.field_key}`}
                            type="date"
                            value={newTask.custom_fields[column.field_key] || ''}
                            onChange={(e) => handleCustomFieldChange(column.field_key, e.target.value)}
                          />
                        )}

                        {column.type === 'select' && (
                          <Select
                            value={newTask.custom_fields[column.field_key] || ''}
                            onValueChange={(value) => handleCustomFieldChange(column.field_key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${column.title}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {column.options?.map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {column.type === 'multiselect' && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {column.options?.map(option => {
                              const selected = Array.isArray(newTask.custom_fields[column.field_key])
                                ? newTask.custom_fields[column.field_key]?.includes(option)
                                : false;

                              return (
                                <Badge 
                                  key={option} 
                                  variant={selected ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const currentValues = Array.isArray(newTask.custom_fields[column.field_key])
                                      ? [...newTask.custom_fields[column.field_key]]
                                      : [];
                                    
                                    const newValues = selected
                                      ? currentValues.filter(v => v !== option)
                                      : [...currentValues, option];
                                      
                                    handleCustomFieldChange(column.field_key, newValues);
                                  }}
                                >
                                  {option}
                                </Badge>
                              );
                            })}
                          </div>
                        )}

                        {column.type === 'checkbox' && (
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`custom-${column.field_key}`}
                              checked={!!newTask.custom_fields[column.field_key]}
                              onCheckedChange={(checked) => 
                                handleCustomFieldChange(column.field_key, checked)
                              }
                            />
                            <label 
                              htmlFor={`custom-${column.field_key}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {column.title}
                            </label>
                          </div>
                        )}

                        {column.type === 'user' && (
                          <Input 
                            id={`custom-${column.field_key}`}
                            type="email"
                            placeholder="User email"
                            value={newTask.custom_fields[column.field_key] || ''}
                            onChange={(e) => handleCustomFieldChange(column.field_key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewTask(false)}>Cancel</Button>
            <Button onClick={createTask}>Create Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog - Similar to New Task but for editing */}
      <Dialog open={showEditTask} onOpenChange={setShowEditTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
            <Input
              placeholder="Task Title"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            />
            <Textarea
              placeholder="Task Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                value={newTask.role}
                onValueChange={(value) => setNewTask({ ...newTask, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="devops">DevOps</SelectItem>
                  <SelectItem value="qa">QA</SelectItem>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask({ ...newTask, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="email"
                placeholder="Assignee Email"
                value={newTask.assigned_to}
                onChange={(e) => setNewTask({ ...newTask, assigned_to: e.target.value })}
              />
              <Input
                type="date"
                value={newTask.due_date}
                onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
              />
            </div>

            {/* Custom fields - same as in New Task dialog */}
            {columns.length > 0 && (
              <>
                <div className="border-t pt-4 mt-4">
                  <h3 className="text-lg font-medium mb-4">Custom Fields</h3>
                  <div className="space-y-4">
                    {columns.map(column => (
                      <div key={column.id} className="space-y-2">
                        <Label htmlFor={`edit-custom-${column.field_key}`}>
                          {column.title}
                          {column.is_required && <span className="text-red-500">*</span>}
                        </Label>

                        {column.type === 'text' && (
                          <Input 
                            id={`edit-custom-${column.field_key}`}
                            value={newTask.custom_fields[column.field_key] || ''}
                            onChange={(e) => handleCustomFieldChange(column.field_key, e.target.value)}
                          />
                        )}

                        {column.type === 'number' && (
                          <Input 
                            id={`edit-custom-${column.field_key}`}
                            type="number"
                            value={newTask.custom_fields[column.field_key] || ''}
                            onChange={(e) => handleCustomFieldChange(column.field_key, 
                              e.target.value === '' ? '' : Number(e.target.value)
                            )}
                          />
                        )}

                        {column.type === 'date' && (
                          <Input 
                            id={`edit-custom-${column.field_key}`}
                            type="date"
                            value={newTask.custom_fields[column.field_key] || ''}
                            onChange={(e) => handleCustomFieldChange(column.field_key, e.target.value)}
                          />
                        )}

                        {column.type === 'select' && (
                          <Select
                            value={newTask.custom_fields[column.field_key] || ''}
                            onValueChange={(value) => handleCustomFieldChange(column.field_key, value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder={`Select ${column.title}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {column.options?.map(option => (
                                <SelectItem key={option} value={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {column.type === 'multiselect' && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {column.options?.map(option => {
                              const selected = Array.isArray(newTask.custom_fields[column.field_key])
                                ? newTask.custom_fields[column.field_key]?.includes(option)
                                : false;

                              return (
                                <Badge 
                                  key={option} 
                                  variant={selected ? "default" : "outline"}
                                  className="cursor-pointer"
                                  onClick={() => {
                                    const currentValues = Array.isArray(newTask.custom_fields[column.field_key])
                                      ? [...newTask.custom_fields[column.field_key]]
                                      : [];
                                    
                                    const newValues = selected
                                      ? currentValues.filter(v => v !== option)
                                      : [...currentValues, option];
                                      
                                    handleCustomFieldChange(column.field_key, newValues);
                                  }}
                                >
                                  {option}
                                </Badge>
                              );
                            })}
                          </div>
                        )}

                        {column.type === 'checkbox' && (
                          <div className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-custom-${column.field_key}`}
                              checked={!!newTask.custom_fields[column.field_key]}
                              onCheckedChange={(checked) => 
                                handleCustomFieldChange(column.field_key, checked)
                              }
                            />
                            <label 
                              htmlFor={`edit-custom-${column.field_key}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {column.title}
                            </label>
                          </div>
                        )}

                        {column.type === 'user' && (
                          <Input 
                            id={`edit-custom-${column.field_key}`}
                            type="email"
                            placeholder="User email"
                            value={newTask.custom_fields[column.field_key] || ''}
                            onChange={(e) => handleCustomFieldChange(column.field_key, e.target.value)}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditTask(false)}>Cancel</Button>
            <Button onClick={updateTask}>Update Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column Manager Dialog */}
      <Dialog open={showColumnManager} onOpenChange={setShowColumnManager}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Manage Custom Columns</span>
              <Button onClick={() => setShowAddColumn(true)}>
                <Plus className="w-4 h-4 mr-2" /> Add Column
              </Button>
            </DialogTitle>
          </DialogHeader>
          <div className="my-4">
            {columns.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No custom columns defined. Click "Add Column" to create one.
              </div>
            ) : (
              <div className="space-y-2">
                {columns.map(column => (
                  <div 
                    key={column.id}
                    className="flex items-center justify-between p-4 border rounded-md"
                  >
                    <div className="flex items-center gap-3">
                      <MoveVertical className="w-4 h-4 text-gray-400" />
                      <div>
                        <div className="font-medium">{column.title}</div>
                        <div className="text-sm text-gray-500">
                          <span className="uppercase text-xs bg-gray-100 px-2 py-0.5 rounded mr-2">
                            {column.type}
                          </span>
                          {column.field_key}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 mr-1">Visible</span>
                        <Switch 
                          checked={column.is_visible}
                          onCheckedChange={async (checked) => {
                            await TaskColumn.update(column.id, { is_visible: checked });
                            loadColumns();
                          }}
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingColumn(column);
                          setNewColumn({
                            ...column,
                            project_id: project.id
                          });
                          setShowEditColumn(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500 hover:text-red-600"
                        onClick={() => deleteColumn(column.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowColumnManager(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Column Dialog */}
      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="column-title">Column Title</Label>
              <Input
                id="column-title"
                placeholder="e.g. Story Points, Client, Environment"
                value={newColumn.title}
                onChange={(e) => setNewColumn({ 
                  ...newColumn, 
                  title: e.target.value,
                  field_key: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '')
                })}
              />
            </div>
            
            <div>
              <Label htmlFor="column-key">Field Key (System Identifier)</Label>
              <Input
                id="column-key"
                placeholder="e.g. story_points"
                value={newColumn.field_key}
                onChange={(e) => setNewColumn({ 
                  ...newColumn, 
                  field_key: e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9]/g, '_')
                    .replace(/_+/g, '_')
                    .replace(/^_|_$/g, '')
                })}
              />
              <p className="text-xs text-gray-500 mt-1">
                A unique identifier used by the system. Use lowercase letters, numbers, and underscores.
              </p>
            </div>
            
            <div>
              <Label htmlFor="column-type">Field Type</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {FIELD_TYPE_OPTIONS.map(option => (
                  <div
                    key={option.value}
                    className={`border rounded-md p-3 cursor-pointer flex items-center gap-2 ${
                      newColumn.type === option.value
                        ? 'border-primary bg-primary/5'
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => {
                      setNewColumn({ 
                        ...newColumn, 
                        type: option.value,
                        // Reset options when switching away from select types
                        options: option.value === 'select' || option.value === 'multiselect' 
                          ? newColumn.options 
                          : []
                      });
                    }}
                  >
                    <option.icon className="w-4 h-4 text-gray-500" />
                    <span>{option.label}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Options for select and multiselect */}
            {(newColumn.type === 'select' || newColumn.type === 'multiselect') && (
              <div>
                <Label>Options</Label>
                <div className="mt-2 space-y-4">
                  {/* Display current options */}
                  <div className="flex flex-wrap gap-2">
                    {newColumn.options.map(option => (
                      <Badge key={option} className="flex items-center gap-1">
                        {option}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-white"
                          onClick={() => removeOption(option)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Add option input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an option..."
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newOptionText.trim()) {
                          e.preventDefault();
                          addOption();
                        }
                      }}
                    />
                    <Button onClick={addOption} disabled={!newOptionText.trim()}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Default value */}
            {newColumn.type === 'text' && (
              <div>
                <Label htmlFor="column-default">Default Value (optional)</Label>
                <Input
                  id="column-default"
                  value={newColumn.default_value}
                  onChange={(e) => setNewColumn({ ...newColumn, default_value: e.target.value })}
                />
              </div>
            )}
            
            {(newColumn.type === 'select' && newColumn.options.length > 0) && (
              <div>
                <Label htmlFor="column-default">Default Value (optional)</Label>
                <Select
                  value={newColumn.default_value}
                  onValueChange={(value) => setNewColumn({ ...newColumn, default_value: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a default value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No default</SelectItem>
                    {newColumn.options.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="column-required"
                checked={newColumn.is_required}
                onCheckedChange={(checked) => 
                  setNewColumn({ ...newColumn, is_required: !!checked })
                }
              />
              <Label htmlFor="column-required">Required field</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddColumn(false)}>Cancel</Button>
            <Button onClick={createColumn}>Create Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Column Dialog - Similar to Add Column */}
      <Dialog open={showEditColumn} onOpenChange={setShowEditColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Custom Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-column-title">Column Title</Label>
              <Input
                id="edit-column-title"
                placeholder="e.g. Story Points, Client, Environment"
                value={newColumn.title}
                onChange={(e) => setNewColumn({ ...newColumn, title: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-column-key">Field Key (System Identifier)</Label>
              <Input
                id="edit-column-key"
                placeholder="e.g. story_points"
                value={newColumn.field_key}
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">
                Field key cannot be changed after creation.
              </p>
            </div>
            
            {/* Type is shown but disabled to prevent data inconsistencies */}
            <div>
              <Label htmlFor="edit-column-type">Field Type</Label>
              <Select value={newColumn.type} disabled>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Field type cannot be changed after creation.
              </p>
            </div>
            
            {/* Options for select and multiselect - same as Add Column */}
            {(newColumn.type === 'select' || newColumn.type === 'multiselect') && (
              <div>
                <Label>Options</Label>
                <div className="mt-2 space-y-4">
                  {/* Display current options */}
                  <div className="flex flex-wrap gap-2">
                    {newColumn.options.map(option => (
                      <Badge key={option} className="flex items-center gap-1">
                        {option}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 text-white"
                          onClick={() => removeOption(option)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Add option input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add an option..."
                      value={newOptionText}
                      onChange={(e) => setNewOptionText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newOptionText.trim()) {
                          e.preventDefault();
                          addOption();
                        }
                      }}
                    />
                    <Button onClick={addOption} disabled={!newOptionText.trim()}>
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Default value - same as Add Column */}
            {newColumn.type === 'text' && (
              <div>
                <Label htmlFor="edit-column-default">Default Value (optional)</Label>
                <Input
                  id="edit-column-default"
                  value={newColumn.default_value}
                  onChange={(e) => setNewColumn({ ...newColumn, default_value: e.target.value })}
                />
              </div>
            )}
            
            {(newColumn.type === 'select' && newColumn.options.length > 0) && (
              <div>
                <Label htmlFor="edit-column-default">Default Value (optional)</Label>
                <Select
                  value={newColumn.default_value}
                  onValueChange={(value) => setNewColumn({ ...newColumn, default_value: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a default value" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={null}>No default</SelectItem>
                    {newColumn.options.map(option => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-column-required"
                checked={newColumn.is_required}
                onCheckedChange={(checked) => 
                  setNewColumn({ ...newColumn, is_required: !!checked })
                }
              />
              <Label htmlFor="edit-column-required">Required field</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-column-visible"
                checked={newColumn.is_visible}
                onCheckedChange={(checked) => 
                  setNewColumn({ ...newColumn, is_visible: !!checked })
                }
              />
              <Label htmlFor="edit-column-visible">Visible in cards and tables</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditColumn(false)}>Cancel</Button>
            <Button onClick={updateColumn}>Update Column</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
