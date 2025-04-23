
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  User, 
  Clock, 
  Calendar as CalendarSchedule,
  Link,
  Flag,
  Plus,
  Search
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TeamMember } from '@/api/entities';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import useLocalStorage from '../hooks/useLocalStorage';

export default function TaskForm({ task, tasks, project, teamMembers = [], onSubmit, onCancel, projects = [], initialStatus }) {
  const [currentTask, setCurrentTask] = useState(task || {
    title: '',
    description: '',
    status: initialStatus || 'todo',
    priority: 'medium',
    assigned_to: '',
    due_date: '',
    start_date: '',
    estimated_hours: null,
    progress: 0,
    group_name: '',
    dependencies: [],
    custom_field: '',
    labels: [],
    custom_fields: {}
  });

  const [allTeamMembers, setAllTeamMembers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomFieldModal, setShowCustomFieldModal] = useState(false);
  const [newCustomField, setNewCustomField] = useState({
    name: '',
    key: '',
    type: 'text',
    validation: '',
    defaultValue: ''
  });
  
  // Store custom field definitions in local storage
  const [customFieldDefinitions, setCustomFieldDefinitions] = useLocalStorage(
    'synapse_custom_fields',
    []
  );
  
  // Load all team members on component mount
  useEffect(() => {
    loadAllTeamMembers();
  }, []);

  // Set initial task data when editing
  useEffect(() => {
    if (task) {
      setCurrentTask(task);
    }
  }, [task]);

  const loadAllTeamMembers = async () => {
    try {
      const members = await TeamMember.list();
      setAllTeamMembers(members);
    } catch (error) {
      console.error("Error loading team members:", error);
    }
  };

  // Filter team members by the current project
  const filteredTeamMembers = allTeamMembers.filter(member => {
    return member.projects && Array.isArray(member.projects) && 
           member.projects.includes(project?.id);
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Process the data before submission to handle numeric fields correctly
    const processedTask = { ...currentTask };
    
    // Convert empty string to null for numeric fields
    if (processedTask.estimated_hours === '') {
      processedTask.estimated_hours = null;
    }
    
    // Convert string to number if it has a value
    if (processedTask.estimated_hours !== null && processedTask.estimated_hours !== undefined) {
      const numVal = parseFloat(processedTask.estimated_hours);
      if (!isNaN(numVal)) {
        processedTask.estimated_hours = numVal;
      } else {
        processedTask.estimated_hours = null;
      }
    }
    
    // Ensure progress is a number
    if (typeof processedTask.progress === 'string') {
      const progressVal = parseInt(processedTask.progress, 10);
      processedTask.progress = isNaN(progressVal) ? 0 : progressVal;
    }
    
    // Only include fields that have been modified
    const updates = {};
    Object.keys(processedTask).forEach(key => {
      if (task) {
        // If editing, only include changed fields
        if (processedTask[key] !== task[key]) {
          updates[key] = processedTask[key];
        }
      } else {
        // If creating new, include all fields
        updates[key] = processedTask[key];
      }
    });
    
    onSubmit(task ? { id: task.id, ...updates } : processedTask);
  };

  const handleAddCustomField = () => {
    // Generate a snake_case key from the field name
    const key = newCustomField.key || 
                newCustomField.name.toLowerCase().replace(/\s+/g, '_');
    
    // Create the custom field definition and store it
    const fieldDefinition = {
      ...newCustomField,
      key,
      created_at: new Date().toISOString()
    };
    
    // Add to saved definitions if not already exists
    if (!customFieldDefinitions.some(def => def.key === key)) {
      setCustomFieldDefinitions([...customFieldDefinitions, fieldDefinition]);
    }
    
    // Create the custom field in the task
    const customFields = currentTask.custom_fields || {};
    customFields[key] = newCustomField.defaultValue || '';
    
    setCurrentTask({
      ...currentTask,
      custom_fields: customFields
    });
    
    setShowCustomFieldModal(false);
    
    // Reset form
    setNewCustomField({
      name: '',
      key: '',
      type: 'text',
      validation: '',
      defaultValue: ''
    });
  };

  // Function to remove a custom field
  const removeCustomField = (key) => {
    const updatedFields = { ...currentTask.custom_fields };
    delete updatedFields[key];
    
    setCurrentTask({
      ...currentTask,
      custom_fields: updatedFields
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        placeholder="Task title"
        value={currentTask.title}
        onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
        required
      />
      
      <Textarea
        placeholder="Task description"
        value={currentTask.description}
        onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Assignee</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between"
                role="combobox"
              >
                {currentTask.assigned_to ? (
                  <div className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    {currentTask.assigned_to}
                  </div>
                ) : (
                  <div className="flex items-center text-muted-foreground">
                    <User className="mr-2 h-4 w-4" />
                    <span>Assign to...</span>
                  </div>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
              <Command>
                <CommandInput 
                  placeholder="Search team members..." 
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                />
                <CommandList>
                  <CommandEmpty>No team members found.</CommandEmpty>
                  <CommandGroup heading="Project Team Members">
                    <ScrollArea className="h-[200px]">
                      {filteredTeamMembers.length === 0 ? (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          No team members assigned to this project
                        </div>
                      ) : (
                        filteredTeamMembers
                          .filter(member => 
                            member.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            member.email?.toLowerCase().includes(searchTerm.toLowerCase())
                          )
                          .map(member => (
                            <CommandItem
                              key={member.id}
                              value={member.email}
                              onSelect={() => {
                                setCurrentTask({...currentTask, assigned_to: member.email});
                                setSearchTerm('');
                              }}
                            >
                              <User className="mr-2 h-4 w-4" />
                              <span>{member.name || member.email}</span>
                            </CommandItem>
                          ))
                      )}
                    </ScrollArea>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        <div>
          <label className="text-sm font-medium">Status</label>
          <Select
            value={currentTask.status}
            onValueChange={(value) => setCurrentTask({...currentTask, status: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="review">Review</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Start Date</label>
          <Input
            type="date"
            value={currentTask.start_date}
            onChange={(e) => setCurrentTask({...currentTask, start_date: e.target.value})}
          />
        </div>
        
        <div>
          <label className="text-sm font-medium">Due Date</label>
          <Input
            type="date"
            value={currentTask.due_date}
            onChange={(e) => setCurrentTask({...currentTask, due_date: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Priority</label>
          <Select
            value={currentTask.priority}
            onValueChange={(value) => setCurrentTask({...currentTask, priority: value})}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
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
          <label className="text-sm font-medium">Group</label>
          <Input
            placeholder="Group name"
            value={currentTask.group_name}
            onChange={(e) => setCurrentTask({...currentTask, group_name: e.target.value})}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Estimated Hours</label>
          <Input
            type="number"
            min="0"
            step="0.5"
            placeholder="Enter estimated hours"
            value={currentTask.estimated_hours === null ? '' : currentTask.estimated_hours}
            onChange={(e) => {
              const value = e.target.value === '' ? null : parseFloat(e.target.value);
              setCurrentTask({...currentTask, estimated_hours: value});
            }}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Progress (%)</label>
          <Input
            type="number"
            min="0"
            max="100"
            step="1"
            placeholder="Enter progress percentage"
            value={currentTask.progress || 0}
            onChange={(e) => {
              const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
              setCurrentTask({...currentTask, progress: Math.min(100, Math.max(0, value))});
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium">Custom Fields</label>
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => setShowCustomFieldModal(true)}
              className="h-8"
            >
              <Plus className="mr-1 h-4 w-4" /> Add New Field
            </Button>
          </div>
        </div>
        
        {/* Existing custom fields */}
        {currentTask.custom_fields && Object.keys(currentTask.custom_fields).length > 0 ? (
          <div className="space-y-2">
            {Object.entries(currentTask.custom_fields).map(([key, value]) => (
              <div key={key} className="grid grid-cols-[1fr,auto] gap-2 items-center">
                <div className="grid grid-cols-[100px,1fr] gap-2">
                  <label className="text-sm capitalize">{key.replace(/_/g, ' ')}</label>
                  <Input 
                    value={value}
                    onChange={(e) => {
                      const updatedFields = { ...currentTask.custom_fields };
                      updatedFields[key] = e.target.value;
                      setCurrentTask({...currentTask, custom_fields: updatedFields});
                    }}
                    placeholder={`Enter ${key.replace(/_/g, ' ')}`}
                  />
                </div>
                <Button 
                  type="button"
                  variant="ghost" 
                  size="icon"
                  onClick={() => removeCustomField(key)}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            No custom fields. Click "Add New Field" to create one.
          </div>
        )}

        {/* Show saved field definitions that aren't already added to this task */}
        {customFieldDefinitions.length > 0 && (
          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Available Custom Fields</div>
            <div className="flex flex-wrap gap-2">
              {customFieldDefinitions.map(field => {
                // Only show fields that aren't already added to this task
                if (currentTask.custom_fields && currentTask.custom_fields.hasOwnProperty(field.key)) {
                  return null;
                }
                
                return (
                  <Badge 
                    key={field.key}
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => {
                      const updatedFields = { ...currentTask.custom_fields } || {};
                      updatedFields[field.key] = field.defaultValue || '';
                      setCurrentTask({
                        ...currentTask,
                        custom_fields: updatedFields
                      });
                    }}
                  >
                    <Plus className="mr-1 h-3 w-3" /> 
                    {field.name}
                  </Badge>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {task ? 'Update Task' : 'Create Task'}
        </Button>
      </div>

      {/* Custom Field Dialog */}
      <Dialog open={showCustomFieldModal} onOpenChange={setShowCustomFieldModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Field Name</Label>
              <Input 
                placeholder="e.g. Story Points"
                value={newCustomField.name}
                onChange={(e) => setNewCustomField({...newCustomField, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Field Key (optional)</Label>
              <Input 
                placeholder="e.g. story_points"
                value={newCustomField.key}
                onChange={(e) => setNewCustomField({...newCustomField, key: e.target.value})}
              />
              <p className="text-xs text-gray-500">
                This will be generated from Field Name if left empty
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select
                value={newCustomField.type}
                onValueChange={(value) => setNewCustomField({...newCustomField, type: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select field type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="number">Number</SelectItem>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="select">Dropdown</SelectItem>
                  <SelectItem value="checkbox">Checkbox</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Default Value (optional)</Label>
              <Input 
                placeholder="Default value"
                value={newCustomField.defaultValue}
                onChange={(e) => setNewCustomField({...newCustomField, defaultValue: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomFieldModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomField}>
              Add Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </form>
  );
}
