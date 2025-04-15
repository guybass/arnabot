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
    loadDependencies();
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

            <div>
              <h3 className="text-sm font-medium mb-2">Current Dependencies</h3>
              <div className="border rounded-md divide-y">
                {dependencies.length === 0 ? (
                  <p className="p-3 text-sm text-gray-500">No dependencies</p>
                ) : (
                  dependencies.map(dep => {
                    const isSource = dep.source_task_id === task.id;
                    const relatedTaskId = isSource ? dep.target_task_id : dep.source_task_id;
                    const relatedTask = getTaskById(relatedTaskId);
                    
                    return (
                      <div key={dep.id} className="p-3 flex justify-between items-center">
                        <div className="flex-1">
                          <div className="flex items-center">
                            {isSource ? (
                              <>
                                <span className="text-sm">This task</span>
                                <Badge className={`mx-2 ${dependencyTypes[dep.type].color}`}>
                                  {dependencyTypes[dep.type].label}
                                </Badge>
                                <span className="font-medium">{relatedTask?.title || 'Unknown task'}</span>
                              </>
                            ) : (
                              <>
                                <span className="font-medium">{relatedTask?.title || 'Unknown task'}</span>
                                <Badge className={`mx-2 ${dependencyTypes[dep.type].color}`}>
                                  {dependencyTypes[dep.type].label}
                                </Badge>
                                <span className="text-sm">this task</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDependency(dep.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium mb-2">Add Dependency</h3>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="dependency-type">Type</Label>
                  <Select
                    value={newDependency.type}
                    onValueChange={(value) => setNewDependency({...newDependency, type: value})}
                  >
                    <SelectTrigger id="dependency-type" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="blocks">Blocks</SelectItem>
                      <SelectItem value="relates_to">Relates to</SelectItem>
                      <SelectItem value="duplicates">Duplicates</SelectItem>
                      <SelectItem value="requires">Requires</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="task-search">Find task</Label>
                  <Input
                    id="task-search"
                    placeholder="Search for a task..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <ScrollArea className="h-[200px] border rounded-md p-2">
                  <div className="space-y-2">
                    {filteredTasks.length === 0 ? (
                      <p className="text-sm text-gray-500 p-2">No matching tasks found</p>
                    ) : (
                      filteredTasks.map(t => (
                        <div
                          key={t.id}
                          className={`p-2 rounded-md cursor-pointer ${
                            newDependency.target_task_id === t.id ? 'bg-blue-50 border-blue-200 border' : 'hover:bg-gray-50 border'
                          }`}
                          onClick={() => setNewDependency({...newDependency, target_task_id: t.id})}
                        >
                          <div className="font-medium">{t.title}</div>
                          {t.description && (
                            <div className="text-sm text-gray-500 truncate">{t.description}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDependencyDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={addDependency}
              disabled={!newDependency.target_task_id}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Dependency
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}