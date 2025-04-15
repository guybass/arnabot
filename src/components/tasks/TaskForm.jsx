import React, { useState, useEffect } from 'react';
import { Task, TaskColumn, TeamMember } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Users, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export default function TaskForm({ 
  task, 
  tasks, 
  project, 
  columns, 
  teamMembers = [], 
  onSubmit, 
  onCancel
}) {
  const [customFields, setCustomFields] = useState({});
  const [currentTask, setCurrentTask] = useState({
    project_id: project?.id,
    title: '',
    description: '',
    role: 'other',
    status: 'todo',
    priority: 'medium',
    parent_task_id: null,
    hierarchy_level: 'parent',
    due_date: '',
    assigned_to: '',
    custom_fields: {}
  });
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState(null);
  const [hierarchyRelation, setHierarchyRelation] = useState('child');

  useEffect(() => {
    if (task) {
      setCurrentTask({
        ...task,
        project_id: project?.id,
      });
      if (task.parent_task_id) {
        const parentTask = tasks.find(t => t.id === task.parent_task_id);
        setSelectedParentTask(parentTask);
      }
    } else {
      setCurrentTask({
        project_id: project?.id,
        title: '',
        description: '',
        role: 'other',
        status: 'todo',
        priority: 'medium',
        parent_task_id: null,
        hierarchy_level: 'parent',
        due_date: '',
        assigned_to: '',
        custom_fields: {}
      });
    }
  }, [task, project]);

  useEffect(() => {
    // Set up custom fields based on columns
    if (columns?.length > 0) {
      const fieldsObject = {};
      columns.forEach(column => {
        // Initialize with existing value or default
        fieldsObject[column.field_key] = 
          (currentTask.custom_fields && currentTask.custom_fields[column.field_key]) || 
          column.default_value || 
          (column.type === 'multiselect' ? [] : '');
      });
      setCustomFields(fieldsObject);
    }
  }, [columns, currentTask.custom_fields]);

  const handleChange = (key, value) => {
    setCurrentTask(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  const handleCustomFieldChange = (key, value) => {
    setCustomFields(prev => ({
      ...prev,
      [key]: value
    }));
    
    setCurrentTask(prev => ({
      ...prev,
      custom_fields: {
        ...prev.custom_fields,
        [key]: value
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Apply parent task relationship if selected
    let taskToSubmit = { ...currentTask };
    
    if (selectedParentTask && hierarchyRelation !== 'none') {
      taskToSubmit = {
        ...taskToSubmit,
        parent_task_id: selectedParentTask.id,
        hierarchy_level: hierarchyRelation
      };
    } else {
      taskToSubmit = {
        ...taskToSubmit,
        parent_task_id: null,
        hierarchy_level: 'parent'
      };
    }
    
    onSubmit(taskToSubmit);
  };

  const getFieldComponent = (column) => {
    const value = customFields[column.field_key] || '';
    
    switch (column.type) {
      case 'text':
        return (
          <Input
            value={value}
            onChange={(e) => handleCustomFieldChange(column.field_key, e.target.value)}
            placeholder={column.title}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleCustomFieldChange(column.field_key, parseInt(e.target.value) || '')}
            placeholder={column.title}
          />
        );
      case 'date':
        return (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {value ? format(new Date(value), 'PPP') : `Select ${column.title}`}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={value ? new Date(value) : undefined}
                onSelect={(date) => handleCustomFieldChange(column.field_key, date)}
              />
            </PopoverContent>
          </Popover>
        );
      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(val) => handleCustomFieldChange(column.field_key, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={column.title} />
            </SelectTrigger>
            <SelectContent>
              {column.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : [];
        return (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {selectedValues.map((selected) => (
                <Badge key={selected} className="flex items-center gap-1">
                  {selected}
                  <button 
                    onClick={() => {
                      const newValues = selectedValues.filter(v => v !== selected);
                      handleCustomFieldChange(column.field_key, newValues);
                    }}
                    className="ml-1 rounded-full hover:bg-primary/20"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
            <Select
              value=""
              onValueChange={(val) => {
                if (!selectedValues.includes(val)) {
                  handleCustomFieldChange(column.field_key, [...selectedValues, val]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${column.title}`} />
              </SelectTrigger>
              <SelectContent>
                {column.options?.filter(option => !selectedValues.includes(option)).map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={column.field_key}
              checked={!!value}
              onCheckedChange={(checked) => handleCustomFieldChange(column.field_key, checked)}
            />
            <Label htmlFor={column.field_key}>{column.title}</Label>
          </div>
        );
      case 'user':
        return (
          <div className="space-y-2">
            {value && (
              <Badge className="flex items-center gap-1">
                {value}
                <button 
                  onClick={() => handleCustomFieldChange(column.field_key, '')}
                  className="ml-1 rounded-full hover:bg-primary/20"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            <Select
              value={value || ""}
              onValueChange={(val) => handleCustomFieldChange(column.field_key, val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={`Select ${column.title}`} />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.email} value={member.email}>
                    {member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      default:
        return <Input value={value} onChange={(e) => handleCustomFieldChange(column.field_key, e.target.value)} />;
    }
  };

  const filteredTeamMembers = teamMembers.filter(
    member => member.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  // Filter tasks to exclude current task when selecting parent
  const availableTasks = tasks.filter(t => !task || t.id !== task.id);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Task Title"
        value={currentTask.title}
        onChange={(e) => handleChange('title', e.target.value)}
        className="text-lg font-medium"
      />
      
      <Textarea
        placeholder="Task Description"
        value={currentTask.description}
        onChange={(e) => handleChange('description', e.target.value)}
        className="min-h-[100px]"
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Status</Label>
          <Select
            value={currentTask.status}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Priority</Label>
          <Select
            value={currentTask.priority}
            onValueChange={(value) => handleChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Role</Label>
          <Select
            value={currentTask.role}
            onValueChange={(value) => handleChange('role', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Role" />
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
        </div>
        
        <div>
          <Label>Due Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {currentTask.due_date ? format(new Date(currentTask.due_date), 'PPP') : 'Set due date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentTask.due_date ? new Date(currentTask.due_date) : undefined}
                onSelect={(date) => handleChange('due_date', date)}
              />
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <Label>Assigned To</Label>
          <Select
            value={currentTask.assigned_to}
            onValueChange={(value) => handleChange('assigned_to', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Assign to team member" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={null}>Unassigned</SelectItem>
              {teamMembers.map((member) => (
                <SelectItem key={member.email} value={member.email}>
                  {member.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Task Hierarchy</Label>
          <Button
            type="button"
            variant="outline"
            className="w-full flex justify-between items-center"
            onClick={() => setShowTaskPicker(true)}
          >
            <span>
              {selectedParentTask ? `${hierarchyRelation === 'child' ? 'Subtask of' : hierarchyRelation === 'sibling' ? 'Sibling of' : ''} ${selectedParentTask.title}` : 'No parent task (standalone)'}
            </span>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Custom Fields Section */}
      {columns?.length > 0 && (
        <div className="space-y-4 border-t pt-4">
          <h3 className="font-medium">Custom Fields</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {columns.map(column => (
              <div key={column.field_key}>
                <Label>{column.title}</Label>
                {getFieldComponent(column)}
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {task ? 'Save Changes' : 'Create Task'}
        </Button>
      </div>
      
      {/* Task Hierarchy Picker Dialog */}
      <Dialog open={showTaskPicker} onOpenChange={setShowTaskPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Related Task</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Select
              value={hierarchyRelation}
              onValueChange={setHierarchyRelation}
            >
              <SelectTrigger>
                <SelectValue placeholder="Relationship Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No Relationship</SelectItem>
                <SelectItem value="child">Subtask (Child)</SelectItem>
                <SelectItem value="sibling">Sibling Task</SelectItem>
              </SelectContent>
            </Select>
            
            {hierarchyRelation !== 'none' && (
              <>
                <Input
                  placeholder="Search tasks..."
                  onChange={(e) => setAssigneeSearch(e.target.value)}
                />
                
                <ScrollArea className="h-[200px]">
                  {availableTasks.length === 0 ? (
                    <p className="text-center py-4 text-gray-500">No tasks available</p>
                  ) : (
                    <div className="space-y-2">
                      {availableTasks
                        .filter(t => 
                          t.title.toLowerCase().includes(assigneeSearch.toLowerCase()) ||
                          t.description?.toLowerCase().includes(assigneeSearch.toLowerCase())
                        )
                        .map(t => (
                          <div
                            key={t.id}
                            className={`p-2 border rounded cursor-pointer hover:bg-gray-50 ${
                              selectedParentTask?.id === t.id ? 'border-primary bg-primary/5' : ''
                            }`}
                            onClick={() => setSelectedParentTask(t)}
                          >
                            <div className="font-medium">{t.title}</div>
                            {t.description && (
                              <div className="text-sm text-gray-500 truncate">{t.description}</div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </ScrollArea>
              </>
            )}
          </div>
          
          <DialogFooter>
            {hierarchyRelation !== 'none' && selectedParentTask && (
              <Button
                type="button"
                variant="ghost"
                className="mr-auto"
                onClick={() => {
                  setSelectedParentTask(null);
                  setHierarchyRelation('none');
                }}
              >
                Clear Selection
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => setShowTaskPicker(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (hierarchyRelation === 'none') {
                  setSelectedParentTask(null);
                }
                setShowTaskPicker(false);
              }}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}