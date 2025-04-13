import React, { useState, useEffect } from 'react';
import { TaskDependency } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Link2, X, Plus, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function DependencySelector({ task, tasks, onDependencyChange }) {
  const [showDependencyDialog, setShowDependencyDialog] = useState(false);
  const [dependencies, setDependencies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newDependency, setNewDependency] = useState({
    project_id: task.project_id,
    source_task_id: task.id,
    target_task_id: '',
    type: 'blocks'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (task?.id) {
      loadDependencies();
    }
  }, [task]);

  const loadDependencies = async () => {
    try {
      const deps = await TaskDependency.filter({ project_id: task.project_id });
      setDependencies(deps.filter(d => 
        d.source_task_id === task.id || d.target_task_id === task.id
      ));
    } catch (error) {
      console.error("Error loading dependencies:", error);
    }
  };

  const addDependency = async () => {
    if (newDependency.target_task_id === task.id) {
      setError("A task cannot depend on itself");
      return;
    }

    if (dependencies.some(d => 
      (d.source_task_id === task.id && d.target_task_id === newDependency.target_task_id) ||
      (d.target_task_id === task.id && d.source_task_id === newDependency.target_task_id)
    )) {
      setError("This dependency already exists");
      return;
    }

    try {
      await TaskDependency.create(newDependency);
      await loadDependencies();
      setNewDependency({
        ...newDependency,
        target_task_id: '',
        type: 'blocks'
      });
      setError('');
      onDependencyChange();
    } catch (error) {
      setError("Failed to create dependency");
    }
  };

  const removeDependency = async (dependencyId) => {
    try {
      await TaskDependency.delete(dependencyId);
      await loadDependencies();
      onDependencyChange();
    } catch (error) {
      console.error("Error removing dependency:", error);
    }
  };

  const getTaskById = (taskId) => tasks.find(t => t.id === taskId);

  const dependencyTypes = {
    blocks: { label: 'Blocks', color: 'bg-red-100 text-red-800' },
    relates_to: { label: 'Relates to', color: 'bg-blue-100 text-blue-800' },
    duplicates: { label: 'Duplicates', color: 'bg-purple-100 text-purple-800' },
    requires: { label: 'Requires', color: 'bg-orange-100 text-orange-800' }
  };

  const filteredTasks = tasks.filter(t => 
    t.id !== task.id && 
    (t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
     t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDependencyDialog(true)}
        className="flex items-center gap-2"
      >
        <Link2 className="w-4 h-4" />
        Dependencies
        {dependencies.length > 0 && (
          <Badge variant="secondary" className="ml-1">
            {dependencies.length}
          </Badge>
        )}
      </Button>

      <Dialog open={showDependencyDialog} onOpenChange={setShowDependencyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Dependencies</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <Label>Current Dependencies</Label>
              {dependencies.length === 0 ? (
                <p className="text-sm text-gray-500">No dependencies yet</p>
              ) : (
                <div className="space-y-2">
                  {dependencies.map(dep => {
                    const isSource = dep.source_task_id === task.id;
                    const relatedTask = getTaskById(isSource ? dep.target_task_id : dep.source_task_id);
                    const type = dependencyTypes[dep.type];
                    
                    return (
                      <div 
                        key={dep.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={type.color}>
                            {isSource ? type.label : `Is ${type.label.toLowerCase()} by`}
                          </Badge>
                          <span className="font-medium">{relatedTask?.title}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeDependency(dep.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Label>Add New Dependency</Label>
              <div className="flex gap-4 mt-2">
                <Select
                  value={newDependency.type}
                  onValueChange={(value) => setNewDependency({ ...newDependency, type: value })}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dependencyTypes).map(([value, { label }]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex-1">
                  <Input
                    placeholder="Search tasks..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <ScrollArea className="h-[200px] mt-2 rounded-md border">
                <div className="p-4 space-y-2">
                  {filteredTasks.map(t => (
                    <div
                      key={t.id}
                      className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer ${
                        newDependency.target_task_id === t.id ? 'border-2 border-primary' : 'border'
                      }`}
                      onClick={() => setNewDependency({ ...newDependency, target_task_id: t.id })}
                    >
                      <div>
                        <div className="font-medium">{t.title}</div>
                        {t.description && (
                          <div className="text-sm text-gray-500 line-clamp-1">
                            {t.description}
                          </div>
                        )}
                      </div>
                      {newDependency.target_task_id === t.id && (
                        <Badge variant="secondary">Selected</Badge>
                      )}
                    </div>
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="text-center text-gray-500 py-4">
                      No matching tasks found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDependencyDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={addDependency}
              disabled={!newDependency.target_task_id || !newDependency.type}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Dependency
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}