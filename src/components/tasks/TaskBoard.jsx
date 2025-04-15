import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
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
  DropdownMenuTrigger 
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
  Move
} from 'lucide-react';
import { Task, TeamMember, StatusColumn, Project } from '@/api/entities';
import TaskForm from './TaskForm';
import { format, isAfter, isBefore } from 'date-fns';
import { HexColorInput, HexColorPicker } from 'react-colorful';

export default function TaskBoard({ tasks, project, onTasksChange }) {
  const [columns, setColumns] = useState({});
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [statusColumns, setStatusColumns] = useState([]);
  const [projects, setProjects] = useState([]);
  const [showManageColumns, setShowManageColumns] = useState(false);
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [showDeleteColumn, setShowDeleteColumn] = useState(false);
  const [selectedColumn, setSelectedColumn] = useState(null);
  const [newColumn, setNewColumn] = useState({
    key: '',
    title: '',
    color: 'gray',
    order: 0
  });

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
    
    // Load status columns
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
          
          if (project) {
            // Add project_id to each column
            defaultColumns.forEach(col => col.project_id = project.id);
          }
          
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
    const { destination, source, draggableId } = result;
    
    // If dropped outside of a valid droppable or in same position
    if (!destination || 
        (destination.droppableId === source.droppableId && 
         destination.index === source.index)) {
      return;
    }
    
    // Update task status when moved to a different column
    if (destination.droppableId !== source.droppableId) {
      const taskId = draggableId;
      const newStatus = destination.droppableId;
      
      try {
        await Task.update(taskId, { status: newStatus });
        onTasksChange();
      } catch (error) {
        console.error("Error updating task status:", error);
      }
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
      setShowManageColumns(false);
      
      // Reload columns
      const updatedColumns = await StatusColumn.list('order');
      setStatusColumns(updatedColumns);
    } catch (error) {
      console.error("Error creating status column:", error);
    }
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
      const updatedColumns = await StatusColumn.list('order');
      setStatusColumns(updatedColumns);
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
      const updatedColumns = await StatusColumn.list('order');
      setStatusColumns(updatedColumns);
      
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
        <h2 className="text-xl font-bold">
          {project ? `${project.title} Tasks` : 'All Tasks'}
        </h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowManageColumns(true)}>
            <Settings className="h-4 w-4 mr-1.5" />
            Manage Columns
          </Button>
          <Button onClick={handleAddTask}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Task
          </Button>
        </div>
      </div>
      
      <div className="overflow-x-auto pb-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4" style={{ minWidth: statusColumns.length * 300 }}>
            {Object.entries(columns).map(([columnId, column]) => (
              <div 
                key={columnId} 
                className="w-72 flex-shrink-0"
              >
                <Card className={`${getColumnStyle(column.color)} h-full border`}>
                  <CardHeader className="py-3 px-4">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-sm font-medium">{column.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge>{column.tasks.length}</Badge>
                        
                        {/* Only show edit options for non-uncategorized columns */}
                        {columnId !== 'uncategorized' && column.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedColumn({
                                  id: column.id,
                                  key: columnId,
                                  title: column.title,
                                  color: column.color
                                });
                                setShowEditColumn(true);
                              }}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Column
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                setSelectedColumn({
                                  id: column.id,
                                  key: columnId,
                                  title: column.title,
                                  color: column.color
                                });
                                setShowDeleteColumn(true);
                              }}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Column
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="px-2 overflow-visible">
                    <Droppable droppableId={columnId}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2 min-h-[200px]"
                        >
                          {column.tasks.map((task, index) => (
                            <Draggable
                              key={task.id}
                              draggableId={task.id}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white rounded-md border p-3 shadow-sm ${
                                    snapshot.isDragging ? 'shadow-md opacity-80' : ''
                                  }`}
                                  onClick={() => handleTaskClick(task)}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <h3 className="font-medium line-clamp-2">{task.title}</h3>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                          <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                          e.stopPropagation();
                                          handleTaskClick(task);
                                        }}>
                                          Edit
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                  
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="w-full justify-center text-gray-500 hover:text-gray-900"
                      onClick={() => {
                        setSelectedTask(null);
                        setShowAddTask(true);
                        // Pre-set the status for the new task based on the column
                        setSelectedColumn({ key: columnId });
                      }}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Task
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            ))}
          </div>
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
      
      {/* Manage columns dialog */}
      <Dialog open={showManageColumns} onOpenChange={setShowManageColumns}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Task Columns</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Current Columns</h3>
              <div className="space-y-1">
                {statusColumns.map((column) => (
                  <div 
                    key={column.id || column.key} 
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full ${getColumnStyle(column.color)}`}></div>
                      <span>{column.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedColumn(column);
                          setShowEditColumn(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedColumn(column);
                          setShowDeleteColumn(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-2 pt-4 border-t">
              <h3 className="text-sm font-medium">Add New Column</h3>
              <div className="space-y-2">
                <Input
                  placeholder="Column Title"
                  value={newColumn.title}
                  onChange={(e) => setNewColumn({...newColumn, title: e.target.value})}
                />
                
                <div>
                  <label className="text-sm font-medium">Color Theme</label>
                  <Select
                    value={newColumn.color}
                    onValueChange={(value) => setNewColumn({...newColumn, color: value})}
                  >
                    <SelectTrigger>
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
                
                <Button 
                  onClick={handleCreateColumn}
                  disabled={!newColumn.title.trim()}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1.5" /> 
                  Add Column
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit column dialog */}
      <Dialog open={showEditColumn} onOpenChange={setShowEditColumn}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Column</DialogTitle>
          </DialogHeader>
          {selectedColumn && (
            <div className="space-y-4">
              <Input
                placeholder="Column Title"
                value={selectedColumn.title}
                onChange={(e) => setSelectedColumn({...selectedColumn, title: e.target.value})}
              />
              
              <div>
                <label className="text-sm font-medium">Color Theme</label>
                <Select
                  value={selectedColumn.color}
                  onValueChange={(value) => setSelectedColumn({...selectedColumn, color: value})}
                >
                  <SelectTrigger>
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
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowEditColumn(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateColumn}>Save Changes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete column confirmation */}
      <Dialog open={showDeleteColumn} onOpenChange={setShowDeleteColumn}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Column</DialogTitle>
          </DialogHeader>
          {selectedColumn && (
            <div className="space-y-4">
              <p>
                Are you sure you want to delete the column "{selectedColumn.title}"?
                {tasks.filter(t => t.status === selectedColumn.key).length > 0 && (
                  <span className="block mt-2 text-amber-600">
                    Note: All tasks in this column will be moved to Uncategorized.
                  </span>
                )}
              </p>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowDeleteColumn(false)}>
                  Cancel
                </Button>
                <Button variant="destructive" onClick={handleDeleteColumn}>
                  Delete Column
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}