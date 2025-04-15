import React, { useState, useEffect } from 'react';
import { Task, TaskColumn, TeamMember, Project } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus, Users, X, Search, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';

export default function TaskForm({ 
  task, 
  tasks, 
  project, 
  columns, 
  teamMembers = [], 
  onSubmit, 
  onCancel,
  projects = [],
  initialStatus
}) {
  const [customFields, setCustomFields] = useState({});
  const [currentTask, setCurrentTask] = useState({
    title: '',
    description: '',
    role: 'other',
    status: initialStatus || 'todo',
    priority: 'medium',
    parent_task_id: null,
    hierarchy_level: 'parent',
    due_date: '',
    assigned_to: '',
    custom_fields: {},
    project_id: project?.id || null
  });
  const [assigneeSearch, setAssigneeSearch] = useState('');
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [selectedParentTask, setSelectedParentTask] = useState(null);
  const [hierarchyRelation, setHierarchyRelation] = useState('child');
  const [selectedProject, setSelectedProject] = useState(project?.id || null);
  const [assigneePopoverOpen, setAssigneePopoverOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setCurrentTask({
        ...task,
        project_id: task.project_id || null
      });
      setSelectedProject(task.project_id || null);
      if (task.parent_task_id) {
        const parentTask = tasks.find(t => t.id === task.parent_task_id);
        setSelectedParentTask(parentTask);
      }
    } else {
      setCurrentTask({
        title: '',
        description: '',
        role: 'other',
        status: initialStatus || 'todo',
        priority: 'medium',
        parent_task_id: null,
        hierarchy_level: 'parent',
        due_date: '',
        assigned_to: '',
        custom_fields: {},
        project_id: project?.id || null
      });
      setSelectedProject(project?.id || null);
    }
  }, [task, project, initialStatus]);

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
    
    if (selectedParentTask) {
      taskToSubmit.parent_task_id = selectedParentTask.id;
      taskToSubmit.hierarchy_level = hierarchyRelation;
    } else {
      taskToSubmit.parent_task_id = null;
      taskToSubmit.hierarchy_level = 'parent';
    }
    
    // Apply project selection
    taskToSubmit.project_id = selectedProject;
    
    onSubmit(taskToSubmit);
  };

  // Get filtered team members based on project selection
  const getFilteredTeamMembers = () => {
    if (!selectedProject) return teamMembers;
    return teamMembers.filter(member => 
      member.projects?.includes(selectedProject) || 
      !member.projects || 
      member.projects.length === 0
    );
  };

  const filteredTeamMembers = getFilteredTeamMembers();
  
  const filteredAssigneeSuggestions = filteredTeamMembers.filter(member => 
    member.email.toLowerCase().includes(assigneeSearch.toLowerCase())
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Task title"
        value={currentTask.title}
        onChange={(e) => handleChange('title', e.target.value)}
        className="text-lg font-medium"
        required
      />
      
      <div>
        <label className="text-sm font-medium mb-2 block">Project (Optional)</label>
        <Select
          value={selectedProject || ''}
          onValueChange={(value) => {
            setSelectedProject(value || null);
            handleChange('project_id', value || null);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="No Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={null}>No Project</SelectItem>
            {projects.map(proj => (
              <SelectItem key={proj.id} value={proj.id}>
                {proj.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Textarea
        placeholder="Task description"
        value={currentTask.description || ''}
        onChange={(e) => handleChange('description', e.target.value)}
        className="min-h-[100px]"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Status</label>
          <Select
            value={currentTask.status}
            onValueChange={(value) => handleChange('status', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="uncategorized">Uncategorized</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <label className="text-sm font-medium mb-2 block">Priority</label>
          <Select
            value={currentTask.priority}
            onValueChange={(value) => handleChange('priority', value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Role</label>
          <Select
            value={currentTask.role}
            onValueChange={(value) => handleChange('role', value)}
          >
            <SelectTrigger>
              <SelectValue />
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
          <label className="text-sm font-medium mb-2 block">Due Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {currentTask.due_date ? (
                  format(new Date(currentTask.due_date), 'PPP')
                ) : (
                  <span>Pick a date</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={currentTask.due_date ? new Date(currentTask.due_date) : undefined}
                onSelect={(date) => handleChange('due_date', date ? format(date, 'yyyy-MM-dd') : '')}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Assignee</label>
        <Popover open={assigneePopoverOpen} onOpenChange={setAssigneePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
            >
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                {currentTask.assigned_to || "Select Assignee"}
              </div>
              <div className="opacity-50">⌄</div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput 
                placeholder="Search assignees..."
                value={assigneeSearch}
                onValueChange={setAssigneeSearch}
              />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Assignees">
                  <CommandItem
                    key="unassigned"
                    onSelect={() => {
                      handleChange('assigned_to', '');
                      setAssigneeSearch('');
                      setAssigneePopoverOpen(false);
                    }}
                    className="flex items-center justify-between"
                  >
                    <span>Unassigned</span>
                    {!currentTask.assigned_to && <Check className="h-4 w-4" />}
                  </CommandItem>
                  {filteredAssigneeSuggestions.map((member) => (
                    <CommandItem
                      key={member.id}
                      onSelect={() => {
                        handleChange('assigned_to', member.email);
                        setAssigneeSearch('');
                        setAssigneePopoverOpen(false);
                      }}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <span>{member.email}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {member.role.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {currentTask.assigned_to === member.email && (
                        <Check className="h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Parent Task</label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTaskPicker(true)}
          >
            <Plus className="h-4 w-4 mr-1" /> Select Parent
          </Button>
        </div>
        
        {selectedParentTask ? (
          <div className="flex items-start gap-2 p-2 border rounded-md">
            <div className="flex-1">
              <div className="font-medium">{selectedParentTask.title}</div>
              <div className="flex gap-2 mt-1">
                <Badge variant="outline">{selectedParentTask.status}</Badge>
                <Badge variant="outline">{selectedParentTask.priority}</Badge>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedParentTask(null);
                handleChange('parent_task_id', null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="text-sm text-gray-500 p-2 border border-dashed rounded-md">
            No parent task selected
          </div>
        )}
        
        {selectedParentTask && (
          <div className="mt-2">
            <label className="text-sm font-medium mb-1 block">Relationship</label>
            <Select
              value={hierarchyRelation}
              onValueChange={setHierarchyRelation}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="child">Child (subtask of parent)</SelectItem>
                <SelectItem value="sibling">Sibling (same level as parent)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Custom fields based on project configuration */}
      {columns?.length > 0 && (
        <>
          <h3 className="text-sm font-medium">Custom Fields</h3>
          <div className="space-y-3">
            {columns.map(column => (
              <div key={column.field_key}>
                <Label htmlFor={column.field_key}>{column.title}</Label>
                
                {column.type === 'text' && (
                  <Input
                    id={column.field_key}
                    value={customFields[column.field_key] || ''}
                    onChange={(e) => handleCustomFieldChange(column.field_key, e.target.value)}
                    required={column.is_required}
                  />
                )}
                
                {column.type === 'select' && (
                  <Select
                    value={customFields[column.field_key] || ''}
                    onValueChange={(value) => handleCustomFieldChange(column.field_key, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${column.title}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {column.options?.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {column.type === 'checkbox' && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={column.field_key}
                      checked={!!customFields[column.field_key]}
                      onCheckedChange={(checked) => handleCustomFieldChange(column.field_key, checked)}
                    />
                    <label htmlFor={column.field_key} className="text-sm cursor-pointer">
                      Enabled
                    </label>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>
    </form>
  );
}