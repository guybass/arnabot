
import React, { useState } from 'react';
import { 
  DragDropContext, 
  Droppable, 
  Draggable 
} from '@hello-pangea/dnd';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  MoreHorizontal, 
  Clock, 
  AlertTriangle,
  Calendar,
  User,
  Trash,
  Edit,
  Plus,
  X,
  Settings
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import useLocalStorage from '../hooks/useLocalStorage';

export default function KanbanBoard({ tasks, onEdit, onDelete, onStatusChange }) {
  // Default columns
  const defaultColumns = [
    { id: 'todo', title: 'To Do', color: 'bg-gray-100' },
    { id: 'in_progress', title: 'In Progress', color: 'bg-blue-100' },
    { id: 'review', title: 'Review', color: 'bg-yellow-100' },
    { id: 'done', title: 'Done', color: 'bg-green-100' }
  ];
  
  // Use local storage to persist columns
  const [columns, setColumns] = useLocalStorage('synapse_kanban_columns', defaultColumns);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumn, setNewColumn] = useState({ id: '', title: '', color: 'bg-gray-100' });
  const [showColumnManager, setShowColumnManager] = useState(false);

  const onDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    // Dropped outside the list
    if (!destination) return;

    // Dropped in the same position
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Handle status change
    if (destination.droppableId !== source.droppableId) {
      onStatusChange(draggableId, destination.droppableId);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddColumn = () => {
    // Create a valid ID from the title (lowercase, replace spaces with underscores)
    const id = newColumn.id || newColumn.title.toLowerCase().replace(/\s+/g, '_');
    
    // Add the new column
    setColumns([...columns, { ...newColumn, id }]);
    setShowAddColumn(false);
    setNewColumn({ id: '', title: '', color: 'bg-gray-100' });
  };

  // Function to remove a column
  const removeColumn = (columnId) => {
    setColumns(columns.filter(col => col.id !== columnId));
  };

  const colorOptions = [
    { value: 'bg-gray-100', label: 'Gray' },
    { value: 'bg-blue-100', label: 'Blue' },
    { value: 'bg-green-100', label: 'Green' },
    { value: 'bg-yellow-100', label: 'Yellow' },
    { value: 'bg-orange-100', label: 'Orange' },
    { value: 'bg-red-100', label: 'Red' },
    { value: 'bg-purple-100', label: 'Purple' },
    { value: 'bg-pink-100', label: 'Pink' },
  ];

  return (
    <div className="h-full pb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium">Kanban Board</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowColumnManager(true)}
            className="flex items-center"
          >
            <Settings className="h-4 w-4 mr-1" />
            Manage Columns
          </Button>
          <Button 
            variant="outline"
            size="sm"
            onClick={() => setShowAddColumn(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </Button>
        </div>
      </div>
      
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-4 gap-4 h-full">
          {columns.map(column => (
            <div key={column.id} className="flex flex-col h-full">
              <div className={`${column.color} rounded-t-lg p-3 font-medium text-gray-700 flex justify-between items-center`}>
                {column.title}
                <Badge variant="secondary" className="ml-2">
                  {tasks.filter(task => task.status === column.id).length}
                </Badge>
              </div>
              <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`flex-1 overflow-y-auto p-2 rounded-b-lg ${
                      snapshot.isDraggingOver ? 'bg-gray-50' : 'bg-gray-50'
                    }`}
                    style={{ minHeight: '300px' }}
                  >
                    {tasks
                      .filter(task => task.status === column.id)
                      .map((task, index) => (
                        <Draggable 
                          key={task.id} 
                          draggableId={task.id} 
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <Card
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`mb-3 ${
                                snapshot.isDragging ? 'shadow-lg' : ''
                              }`}
                            >
                              <CardHeader className="p-3 pb-0">
                                <div className="flex justify-between items-start">
                                  <CardTitle className="text-sm font-medium">
                                    {task.title}
                                  </CardTitle>
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" className="h-8 w-8 p-0">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem onClick={() => onEdit(task)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit Task
                                      </DropdownMenuItem>
                                      <DropdownMenuItem onClick={() => onDelete(task.id)}>
                                        <Trash className="mr-2 h-4 w-4" /> Delete Task
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </CardHeader>
                              <CardContent className="p-3 pt-2">
                                {task.description && (
                                  <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                                    {task.description}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-2">
                                  <Badge className={getPriorityColor(task.priority)}>
                                    {task.priority}
                                  </Badge>
                                  
                                  {/* Display custom fields if available */}
                                  {task.custom_fields && Object.entries(task.custom_fields).map(([key, value]) => (
                                    <Badge key={key} variant="outline">
                                      {key.replace(/_/g, ' ')}: {value}
                                    </Badge>
                                  ))}
                                </div>
                              </CardContent>
                              <CardFooter className="p-3 pt-0 text-xs text-gray-500">
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center">
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center mr-3">
                                            <User className="h-3 w-3 mr-1" />
                                            <span className="truncate max-w-[80px]">
                                              {task.assigned_to || 'Unassigned'}
                                            </span>
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Assigned to: {task.assigned_to || 'Unassigned'}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  {task.due_date && (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <div className="flex items-center">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {format(new Date(task.due_date), 'MMM d')}
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Due date: {format(new Date(task.due_date), 'PPP')}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )}
                                </div>
                              </CardFooter>
                            </Card>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
      
      {/* Add Column Dialog */}
      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Column</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Column Title</Label>
              <Input 
                placeholder="e.g. In Review"
                value={newColumn.title}
                onChange={(e) => setNewColumn({...newColumn, title: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Column ID (optional)</Label>
              <Input 
                placeholder="e.g. in_review"
                value={newColumn.id}
                onChange={(e) => setNewColumn({...newColumn, id: e.target.value})}
              />
              <p className="text-xs text-gray-500">
                This will be generated from the title if left empty
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Column Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(color => (
                  <div
                    key={color.value}
                    className={`
                      w-8 h-8 rounded-full cursor-pointer border-2
                      ${color.value}
                      ${newColumn.color === color.value ? 'border-black' : 'border-transparent'}
                    `}
                    onClick={() => setNewColumn({...newColumn, color: color.value})}
                    title={color.label}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddColumn(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddColumn} disabled={!newColumn.title}>
              Add Column
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Column Manager Dialog */}
      <Dialog open={showColumnManager} onOpenChange={setShowColumnManager}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Kanban Columns</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              {columns.map(column => (
                <div key={column.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <div className={`w-4 h-4 rounded-full ${column.color}`}></div>
                    <span className="font-medium">{column.title}</span>
                    <Badge variant="outline" className="ml-1">{column.id}</Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeColumn(column.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    disabled={['todo', 'in_progress', 'review', 'done'].includes(column.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {columns.length === 0 && (
                <p className="text-center text-gray-500 py-4">No columns available</p>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Note: Default columns (To Do, In Progress, Review, Done) cannot be removed
            </p>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowColumnManager(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
