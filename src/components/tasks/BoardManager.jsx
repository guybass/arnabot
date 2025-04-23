import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { StatusColumn } from '@/api/entities';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card } from '@/components/ui/card';
import { Move, Edit, Trash2 } from 'lucide-react';

export default function BoardManager({ columns, onColumnsChange }) {
  const [editingColumn, setEditingColumn] = useState(null);
  const [newColumn, setNewColumn] = useState({
    title: '',
    color: 'gray',
    key: ''
  });

  const colors = [
    { value: 'gray', label: 'Gray' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'yellow', label: 'Yellow' },
    { value: 'red', label: 'Red' },
    { value: 'purple', label: 'Purple' },
    { value: 'pink', label: 'Pink' },
    { value: 'orange', label: 'Orange' }
  ];

  const handleAddColumn = async () => {
    try {
      const key = newColumn.key || newColumn.title.toLowerCase().replace(/\s+/g, '_');
      await StatusColumn.create({
        ...newColumn,
        key,
        order: columns.length
      });
      setNewColumn({ title: '', color: 'gray', key: '' });
      onColumnsChange();
    } catch (error) {
      console.error('Error adding column:', error);
    }
  };

  const handleUpdateColumn = async (column) => {
    try {
      await StatusColumn.update(column.id, {
        title: column.title,
        color: column.color,
        order: column.order
      });
      setEditingColumn(null);
      onColumnsChange();
    } catch (error) {
      console.error('Error updating column:', error);
    }
  };

  const handleDeleteColumn = async (columnId) => {
    if (confirm('Are you sure you want to delete this column? Tasks in this column will be moved to Uncategorized.')) {
      try {
        await StatusColumn.delete(columnId);
        onColumnsChange();
      } catch (error) {
        console.error('Error deleting column:', error);
      }
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(columns);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order for all affected columns
    const updates = items.map((column, index) =>
      StatusColumn.update(column.id, { order: index })
    );

    try {
      await Promise.all(updates);
      onColumnsChange();
    } catch (error) {
      console.error('Error reordering columns:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Add New Column</h3>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={newColumn.title}
              onChange={(e) => setNewColumn({ ...newColumn, title: e.target.value })}
              placeholder="Column title"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="color">Color</Label>
            <Select
              value={newColumn.color}
              onValueChange={(value) => setNewColumn({ ...newColumn, color: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color.value} value={color.value}>
                    <div className="flex items-center">
                      <div className={`w-4 h-4 rounded mr-2 bg-${color.value}-200`} />
                      {color.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleAddColumn}
            disabled={!newColumn.title.trim()}
          >
            Add Column
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium">Manage Columns</h3>
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="columns">
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
                  >
                    {(provided) => (
                      <Card
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className="p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div {...provided.dragHandleProps}>
                              <Move className="h-5 w-5 text-gray-500" />
                            </div>
                            <div>
                              <div className="font-medium">{column.title}</div>
                              <div className="text-sm text-gray-500">{column.key}</div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingColumn(column)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteColumn(column.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {editingColumn && (
        <Dialog open={true} onOpenChange={() => setEditingColumn(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Column</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editingColumn.title}
                  onChange={(e) => setEditingColumn({ 
                    ...editingColumn, 
                    title: e.target.value 
                  })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-color">Color</Label>
                <Select
                  value={editingColumn.color}
                  onValueChange={(value) => setEditingColumn({ 
                    ...editingColumn, 
                    color: value 
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded mr-2 bg-${color.value}-200`} />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingColumn(null)}>
                Cancel
              </Button>
              <Button onClick={() => handleUpdateColumn(editingColumn)}>
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}