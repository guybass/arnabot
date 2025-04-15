import React, { useState, useEffect } from 'react';
import { TaskColumn } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Plus, 
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
  Calendar as CalendarIcon,
  User
} from 'lucide-react';

const FIELD_TYPE_OPTIONS = [
  { value: 'text', label: 'Text', icon: Type },
  { value: 'number', label: 'Number', icon: Hash },
  { value: 'date', label: 'Date', icon: CalendarIcon },
  { value: 'select', label: 'Select (One)', icon: ArrowUpDown },
  { value: 'multiselect', label: 'Select (Multiple)', icon: List },
  { value: 'user', label: 'User', icon: User },
  { value: 'checkbox', label: 'Checkbox', icon: CheckSquare }
];

export default function ColumnManager({ project, columns, onColumnsChange }) {
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [showEditColumn, setShowEditColumn] = useState(false);
  const [editingColumn, setEditingColumn] = useState(null);
  const [activeTab, setActiveTab] = useState('create');
  const [dragEnabled, setDragEnabled] = useState(false);
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

  useEffect(() => {
    resetNewColumn();
  }, [project]);

  const resetNewColumn = () => {
    setNewColumn({
      project_id: project?.id,
      title: '',
      field_key: '',
      type: 'text',
      default_value: '',
      options: [],
      is_required: false,
      order: columns?.length || 0,
      is_visible: true
    });
  };

  const handleAddColumn = async () => {
    // Create field key from title if not set
    const fieldKey = newColumn.field_key || newColumn.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    try {
      await TaskColumn.create({
        ...newColumn,
        field_key: fieldKey
      });
      
      onColumnsChange();
      setShowAddColumn(false);
      resetNewColumn();
    } catch (error) {
      console.error('Error creating column:', error);
    }
  };

  const handleUpdateColumn = async () => {
    try {
      await TaskColumn.update(editingColumn.id, editingColumn);
      onColumnsChange();
      setShowEditColumn(false);
    } catch (error) {
      console.error('Error updating column:', error);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    try {
      await TaskColumn.delete(columnId);
      onColumnsChange();
    } catch (error) {
      console.error('Error deleting column:', error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order for all items
    try {
      const updates = items.map((item, index) => 
        TaskColumn.update(item.id, { order: index })
      );
      
      await Promise.all(updates);
      onColumnsChange();
    } catch (error) {
      console.error('Error reordering columns:', error);
    }
  };

  const addOption = (option) => {
    if (activeTab === 'create') {
      if (option && !newColumn.options.includes(option)) {
        setNewColumn({
          ...newColumn,
          options: [...newColumn.options, option]
        });
      }
    } else {
      if (option && !editingColumn.options.includes(option)) {
        setEditingColumn({
          ...editingColumn,
          options: [...editingColumn.options, option]
        });
      }
    }
  };

  const removeOption = (option) => {
    if (activeTab === 'create') {
      setNewColumn({
        ...newColumn,
        options: newColumn.options.filter(o => o !== option)
      });
    } else {
      setEditingColumn({
        ...editingColumn,
        options: editingColumn.options.filter(o => o !== option)
      });
    }
  };

  const getTypeIcon = (type) => {
    const option = FIELD_TYPE_OPTIONS.find(o => o.value === type);
    if (!option) return null;
    
    const Icon = option.icon;
    return <Icon className="w-4 h-4" />;
  };

  return (
    <div>
      <Tabs defaultValue="columns" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="columns">Columns</TabsTrigger>
        </TabsList>
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Custom Fields</h3>
          <div className="flex items-center gap-2">
            <div className="flex items-center space-x-2">
              <Switch
                checked={dragEnabled}
                onCheckedChange={setDragEnabled}
                id="reorder-mode"
              />
              <Label htmlFor="reorder-mode" className="text-sm">Reorder Mode</Label>
            </div>
            <Button onClick={() => setShowAddColumn(true)} className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Add Field
            </Button>
          </div>
        </div>
        
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns" isDropDisabled={!dragEnabled}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {columns.map((column, index) => (
                  <Draggable 
                    key={column.id} 
                    draggableId={column.id} 
                    index={index}
                    isDragDisabled={!dragEnabled}
                  >
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center justify-between p-3 border rounded-lg ${
                          dragEnabled ? 'bg-gray-50 cursor-grab' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {dragEnabled && (
                            <div {...provided.dragHandleProps}>
                              <MoveVertical className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          
                          <div className="flex items-center gap-2">
                            {getTypeIcon(column.type)}
                            <span className="font-medium">{column.title}</span>
                          </div>
                          
                          <Badge variant="outline" className="ml-2">
                            {FIELD_TYPE_OPTIONS.find(o => o.value === column.type)?.label || column.type}
                          </Badge>
                          
                          {column.is_required && (
                            <Badge variant="secondary">Required</Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setEditingColumn(column);
                              setShowEditColumn(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteColumn(column.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                {columns.length === 0 && (
                  <div className="text-center py-8 border rounded-lg bg-gray-50">
                    <Columns className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-gray-500">No custom fields yet</p>
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={() => setShowAddColumn(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" /> Add Your First Field
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Tabs>
      
      {/* Add Column Dialog */}
      <Dialog open={showAddColumn} onOpenChange={setShowAddColumn}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Field Name</Label>
              <Input
                value={newColumn.title}
                onChange={(e) => setNewColumn({ ...newColumn, title: e.target.value })}
                placeholder="e.g., Story Points, Estimation"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select
                value={newColumn.type}
                onValueChange={(value) => setNewColumn({ 
                  ...newColumn, 
                  type: value,
                  default_value: '',
                  options: []
                })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <option.icon className="w-4 h-4 mr-2" />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {(newColumn.type === 'select' || newColumn.type === 'multiselect') && (
              <div className="space-y-2">
                <Label>Options</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {newColumn.options.map((option) => (
                    <Badge key={option} variant="secondary" className="flex items-center gap-1">
                      {option}
                      <button
                        type="button"
                        onClick={() => removeOption(option)}
                        className="ml-1 rounded-full hover:bg-primary/20"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add option"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && e.target.value) {
                        addOption(e.target.value);
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      const input = e.target.previousSibling;
                      if (input.value) {
                        addOption(input.value);
                        input.value = '';
                      }
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
            )}
            
            {(newColumn.type === 'text' || newColumn.type === 'number') && (
              <div className="space-y-2">
                <Label>Default Value (Optional)</Label>
                <Input
                  type={newColumn.type === 'number' ? 'number' : 'text'}
                  value={newColumn.default_value}
                  onChange={(e) => setNewColumn({ ...newColumn, default_value: e.target.value })}
                  placeholder="Default value"
                />
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              <Switch
                id="required-field"
                checked={newColumn.is_required}
                onCheckedChange={(checked) => 
                  setNewColumn({ ...newColumn, is_required: checked })
                }
              />
              <Label htmlFor="required-field">Required Field</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddColumn(false);
                resetNewColumn();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddColumn}
              disabled={!newColumn.title || (
                (newColumn.type === 'select' || newColumn.type === 'multiselect') && 
                newColumn.options.length === 0
              )}
            >
              Add Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Column Dialog */}
      <Dialog open={showEditColumn} onOpenChange={setShowEditColumn}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Custom Field</DialogTitle>
          </DialogHeader>
          
          {editingColumn && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Field Name</Label>
                <Input
                  value={editingColumn.title}
                  onChange={(e) => setEditingColumn({ ...editingColumn, title: e.target.value })}
                  placeholder="e.g., Story Points, Estimation"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select
                  value={editingColumn.type}
                  onValueChange={(value) => setEditingColumn({ 
                    ...editingColumn, 
                    type: value,
                    options: value === editingColumn.type ? editingColumn.options : []
                  })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field type" />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center">
                          <option.icon className="w-4 h-4 mr-2" />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {(editingColumn.type === 'select' || editingColumn.type === 'multiselect') && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(editingColumn.options || []).map((option) => (
                      <Badge key={option} variant="secondary" className="flex items-center gap-1">
                        {option}
                        <button
                          type="button"
                          onClick={() => removeOption(option)}
                          className="ml-1 rounded-full hover:bg-primary/20"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add option"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && e.target.value) {
                          addOption(e.target.value);
                          e.target.value = '';
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        const input = e.target.previousSibling;
                        if (input.value) {
                          addOption(input.value);
                          input.value = '';
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              )}
              
              {(editingColumn.type === 'text' || editingColumn.type === 'number') && (
                <div className="space-y-2">
                  <Label>Default Value (Optional)</Label>
                  <Input
                    type={editingColumn.type === 'number' ? 'number' : 'text'}
                    value={editingColumn.default_value || ''}
                    onChange={(e) => setEditingColumn({ 
                      ...editingColumn, 
                      default_value: e.target.value 
                    })}
                    placeholder="Default value"
                  />
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-required-field"
                  checked={editingColumn.is_required}
                  onCheckedChange={(checked) => 
                    setEditingColumn({ ...editingColumn, is_required: checked })
                  }
                />
                <Label htmlFor="edit-required-field">Required Field</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-visible-field"
                  checked={editingColumn.is_visible}
                  onCheckedChange={(checked) => 
                    setEditingColumn({ ...editingColumn, is_visible: checked })
                  }
                />
                <Label htmlFor="edit-visible-field">Visible in Task Board</Label>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEditColumn(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateColumn}
              disabled={!editingColumn?.title || (
                (editingColumn?.type === 'select' || editingColumn?.type === 'multiselect') && 
                (!editingColumn?.options || editingColumn.options.length === 0)
              )}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}