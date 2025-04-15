import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ChevronDown, 
  ChevronRight, 
  Search, 
  Filter, 
  Plus,
  Star,
  Folder,
  Trello,
  Calendar as CalendarIcon,
  List,
  Clock,
  BarChart2
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function TaskManagerSidebar({ 
  projects, 
  selectedProject, 
  onProjectSelect, 
  view, 
  onViewChange, 
  onSearch, 
  filters, 
  onFilterChange 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showNewProject, setShowNewProject] = useState(false);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    onSearch(e.target.value);
  };

  const handleFilterChange = (key, value) => {
    onFilterChange({ [key]: value });
  };

  const VIEW_OPTIONS = [
    { value: 'board', label: 'Board', icon: Trello },
    { value: 'timeline', label: 'Timeline', icon: Clock },
    { value: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { value: 'list', label: 'List', icon: List },
    { value: 'reports', label: 'Reports', icon: BarChart2 }
  ];

  return (
    <div className="w-64 border-r bg-white h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-lg">Projects</h2>
          <Button variant="ghost" size="icon" onClick={() => setShowNewProject(true)}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search projects..."
            className="pl-8"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="p-2">
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-md">
              <div className="flex items-center">
                <Folder className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">All Projects</span>
              </div>
              <ChevronDown className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {projects.map(project => (
                <Button
                  key={project.id}
                  variant="ghost"
                  className={`w-full justify-start pl-8 mb-1 ${
                    selectedProject?.id === project.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => onProjectSelect(project)}
                >
                  <span className="truncate">{project.title}</span>
                </Button>
              ))}
            </CollapsibleContent>
          </Collapsible>
          
          <Collapsible>
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 hover:bg-gray-100 rounded-md mt-2">
              <div className="flex items-center">
                <Star className="h-4 w-4 mr-2 text-gray-500" />
                <span className="font-medium">Favorites</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pl-8 py-2 text-gray-500 text-sm">
                No favorite projects yet
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Views</h3>
        </div>
        
        <div className="space-y-1">
          {VIEW_OPTIONS.map(option => {
            const ViewIcon = option.icon;
            return (
              <Button
                key={option.value}
                variant={view === option.value ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => onViewChange(option.value)}
              >
                <ViewIcon className="h-4 w-4 mr-2" />
                {option.label}
              </Button>
            );
          })}
        </div>
        
        <Button
          variant="outline"
          className="w-full mt-4 flex items-center"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
        </Button>
        
        {showFilters && (
          <div className="mt-3 space-y-3">
            <div>
              <label className="text-xs font-medium block mb-1">Status</label>
              <Select
                value={filters.status}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="review">Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium block mb-1">Assignee</label>
              <Select
                value={filters.assignee}
                onValueChange={(value) => handleFilterChange('assignee', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assignees</SelectItem>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  <SelectItem value="me">Assigned to Me</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="text-xs font-medium block mb-1">Priority</label>
              <Select
                value={filters.priority}
                onValueChange={(value) => handleFilterChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>
      
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Project Title" />
            <Input placeholder="Project Description" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProject(false)}>
              Cancel
            </Button>
            <Button>Create Project</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}