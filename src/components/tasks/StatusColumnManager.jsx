import React, { useState } from 'react';
import { StatusColumn } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { MoveVertical, Plus, Edit, Trash2, Check } from 'lucide-react';

const COLOR_OPTIONS = [
  { value: 'gray', label: 'Gray', class: 'bg-gray-100' },
  { value: 'blue', label: 'Blue', class: 'bg-blue-100' },
  { value: 'green', label: 'Green', class: 'bg-green-100' },
  { value: 'yellow', label: 'Yellow', class: 'bg-yellow-100' },
  { value: 'red', label: 'Red', class: 'bg-red-100' },
  { value: 'purple', label: 'Purple', class: 'bg-purple-100' },
  { value: 'pink', label: 'Pink', class: 'bg-pink-100' },
  { value: 'orange', label: 'Orange', class: 'bg-orange-100' }
];

export default function StatusColumnManager({ project, statusColumns, onStatusColumnsChange }) {
  const [newColumn, setNewColumn] = useState({
    project_id: project?.id,
    key: '',
    title: '',
    color: 'gray',
    order: statusColumns?.length || 0,
    is_active: true
  });
  const [editingId, setEditingId] = useState(null);
  const [dragEnabled, setDragEnabled] = useState(false);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(statusColumns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order for all items
    try {
      const updates = items.map((item, index) =>
        StatusColumn.update(item.id, { order: index })
      );

      await Promise.all(updates);
      onStatusColumnsChange();
    } catch (error) {
      console.error('Error reordering status columns:', error);
    }
  };

  const handleAddColumn = async () => {
    try {
      const key = newColumn.key || newColumn.title.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await StatusColumn.create({
        ...newColumn,
        key
      });
      onStatusColumnsChange();
      setNewColumn({
        project_id: project?.id,
        key: '',
        title: '',
        color: 'gray',
        order: statusColumns?.length || 0,
        is_active: true
      });
    } catch (error) {
      console.error('Error creating status column:', error);
    }
  };

  const handleUpdateColumn = async (column) => {
    try {
      await StatusColumn.update(column.id, column);
      onStatusColumnsChange();
      setEditingId(null);
    } catch (error) {
      console.error('Error updating status column:', error);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    try {
      await StatusColumn.delete(columnId);
      onStatusColumnsChange();
    } catch (error) {
      console.error('Error deleting status column:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add New Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Status Name</Label>
            <Input
              value={newColumn.title}
              onChange={(e) => setNewColumn({ ...newColumn, title: e.target.value })}
              placeholder="e.g., In Review, Testing, Blocked"
            />
          </div>
          <div>
            <Label>Color</Label>
            <Select
              value={newColumn.color}
              onValueChange={(color) => setNewColumn({ ...newColumn, color })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COLOR_OPTIONS.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded ${color.class}`} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={handleAddColumn} disabled={!newColumn.title}>
          <Plus className="w-4 h-4 mr-2" /> Add Status Column
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Current Status Columns</h3>
          <div className="flex items-center space-x-2">
            <Switch
              checked={dragEnabled}
              onCheckedChange={setDragEnabled}
              id="reorder-mode"
            />
            <Label htmlFor="reorder-mode">Reorder Mode</Label>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="status-columns" isDropDisabled={!dragEnabled}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2"
              >
                {statusColumns.map((column, index) => (
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
                        {editingId === column.id ? (
                          <div className="flex-1 flex items-center gap-4">
                            <Input
                              value={column.title}
                              onChange={(e) =>
                                handleUpdateColumn({
                                  ...column,
                                  title: e.target.value
                                })
                              }
                              className="w-48"
                            />
                            <Select
                              value={column.color}
                              onValueChange={(color) =>
                                handleUpdateColumn({
                                  ...column,
                                  color
                                })
                              }
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {COLOR_OPTIONS.map((color) => (
                                  <SelectItem key={color.value} value={color.value}>
                                    <div className="flex items-center gap-2">
                                      <div className={`w-4 h-4 rounded ${color.class}`} />
                                      {color.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              size="sm"
                              onClick={() => setEditingId(null)}
                              className="ml-2"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 flex-1">
                            {dragEnabled && (
                              <div {...provided.dragHandleProps}>
                                <MoveVertical className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <div className={`w-4 h-4 rounded ${COLOR_OPTIONS.find(c => c.value === column.color)?.class}`} />
                            <span className="font-medium">{column.title}</span>
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingId(column.id)}
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
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}