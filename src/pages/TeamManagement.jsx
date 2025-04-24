
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TeamMember, User, Project } from '@/api/entities';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { format } from 'date-fns';
import { Loader2, Plus, Users, Calendar as CalendarIcon, Edit, Trash2, Check } from 'lucide-react';
import { createPageUrl } from '@/utils';
import FeedbackButton from '../components/feedback/FeedbackButton';
import { applyOwnershipFilter } from '@/components/utils/ownershipFilters';

export default function TeamManagement() {
  const [teamMembers, setTeamMembers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showEditMember, setShowEditMember] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [projectsPopoverOpen, setProjectsPopoverOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Apply ownership filters
      const memberFilter = await applyOwnershipFilter();
      const projectFilter = await applyOwnershipFilter();
      
      const [members, projectsList] = await Promise.all([
        TeamMember.filter(memberFilter),
        Project.filter(projectFilter)
      ]);
      
      setTeamMembers(members);
      setProjects(projectsList);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: 'frontend_developer',
    seniority: 'mid',
    availability: 'full_time',
    expertise: [],
    projects: []
  });

  const handleProjectChange = (projectId) => {
    setNewMember(prev => {
      const projects = prev.projects || [];
      if (projects.includes(projectId)) {
        return { ...prev, projects: projects.filter(id => id !== projectId) };
      } else {
        return { ...prev, projects: [...projects, projectId] };
      }
    });
  };

  const handleAddMember = async () => {
    try {
      await TeamMember.create(newMember);
      setShowAddMember(false);
      setNewMember({
        name: '',
        email: '',
        role: 'frontend_developer',
        seniority: 'mid',
        availability: 'full_time',
        expertise: [],
        projects: []
      });
      loadData();
    } catch (error) {
      console.error("Error adding team member:", error);
      alert("Error adding team member. Please make sure all required fields are filled.");
    }
  };

  const handleEditMember = async () => {
    try {
      await TeamMember.update(selectedMember.id, {
        name: selectedMember.name,
        email: selectedMember.email,
        role: selectedMember.role,
        seniority: selectedMember.seniority,
        availability: selectedMember.availability,
        expertise: selectedMember.expertise || [],
        projects: selectedMember.projects || []
      });
      setShowEditMember(false);
      loadData();
    } catch (error) {
      console.error("Error updating team member:", error);
      alert("Error updating team member.");
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!confirm("Are you sure you want to remove this team member?")) return;
    
    try {
      await TeamMember.delete(memberId);
      loadData();
    } catch (error) {
      console.error("Error deleting team member:", error);
      alert("Error deleting team member.");
    }
  };

  const editMember = (member) => {
    setSelectedMember({
      ...member,
      projects: member.projects || []
    });
    setShowEditMember(true);
  };

  const handleEditProjectChange = (projectId) => {
    setSelectedMember(prev => {
      const projects = prev.projects || [];
      if (projects.includes(projectId)) {
        return { ...prev, projects: projects.filter(id => id !== projectId) };
      } else {
        return { ...prev, projects: [...projects, projectId] };
      }
    });
  };

  const filteredProjects = projects.filter(project => 
    project.title.toLowerCase().includes(projectSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Team Management</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCalendar(true)}
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Team Calendar
          </Button>
          <Button onClick={() => setShowAddMember(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Team Member
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Projects</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Seniority</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teamMembers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    No team members found. Click 'Add Team Member' to create one.
                  </TableCell>
                </TableRow>
              ) : (
                teamMembers.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>{member.name || "-"}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(member.projects || []).map(projectId => {
                          const project = projects.find(p => p.id === projectId);
                          return project ? (
                            <Badge key={projectId} variant="outline">
                              {project.title}
                            </Badge>
                          ) : null;
                        })}
                        {(!member.projects || member.projects.length === 0) &&
                          <span className="text-gray-400 text-sm">No projects assigned</span>
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {member.role.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge>{member.seniority}</Badge>
                    </TableCell>
                    <TableCell>{member.availability.replace(/_/g, ' ')}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editMember(member)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedMember(member);
                            setShowCalendar(true);
                          }}
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteMember(member.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="max-h-[calc(90vh-130px)] overflow-y-auto pr-6">
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  placeholder="Full Name"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  placeholder="Email Address"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Projects</label>
                <Popover open={projectsPopoverOpen} onOpenChange={setProjectsPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {(newMember.projects || []).length > 0
                          ? `${(newMember.projects || []).length} projects selected`
                          : "Select Projects"
                        }
                      </div>
                      <div className="opacity-50">⌄</div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search projects..."
                        value={projectSearch}
                        onValueChange={setProjectSearch}
                      />
                      <CommandList>
                        <CommandEmpty>No projects found.</CommandEmpty>
                        <CommandGroup heading="Available Projects">
                          {filteredProjects.map(project => (
                            <CommandItem
                              key={project.id}
                              onSelect={() => handleProjectChange(project.id)}
                              className="flex items-center justify-between"
                            >
                              <div>{project.title}</div>
                              {(newMember.projects || []).includes(project.id) && (
                                <Check className="h-4 w-4" />
                              )}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {(newMember.projects || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(newMember.projects || []).map(projectId => {
                      const project = projects.find(p => p.id === projectId);
                      return project ? (
                        <Badge key={projectId} variant="secondary" className="flex items-center gap-1">
                          {project.title}
                          <button
                            type="button"
                            className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center hover:bg-gray-200"
                            onClick={() => handleProjectChange(projectId)}
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
              <div>
                <label className="text-sm font-medium">Role</label>
                <Select
                  value={newMember.role}
                  onValueChange={(value) => setNewMember({ ...newMember, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="frontend_developer">Frontend Developer</SelectItem>
                    <SelectItem value="backend_developer">Backend Developer</SelectItem>
                    <SelectItem value="fullstack_developer">Fullstack Developer</SelectItem>
                    <SelectItem value="devops_engineer">DevOps Engineer</SelectItem>
                    <SelectItem value="qa_engineer">QA Engineer</SelectItem>
                    <SelectItem value="ui_designer">UI Designer</SelectItem>
                    <SelectItem value="ux_designer">UX Designer</SelectItem>
                    <SelectItem value="product_manager">Product Manager</SelectItem>
                    <SelectItem value="project_manager">Project Manager</SelectItem>
                    <SelectItem value="tech_lead">Tech Lead</SelectItem>
                    <SelectItem value="architect">Architect</SelectItem>
                    <SelectItem value="cto">CTO</SelectItem>
                    <SelectItem value="security_engineer">Security Engineer</SelectItem>
                    <SelectItem value="database_admin">Database Admin</SelectItem>
                    <SelectItem value="mobile_developer">Mobile Developer</SelectItem>
                    <SelectItem value="data_scientist">Data Scientist</SelectItem>
                    <SelectItem value="scrum_master">Scrum Master</SelectItem>
                    <SelectItem value="technical_writer">Technical Writer</SelectItem>
                    <SelectItem value="business_analyst">Business Analyst</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Seniority</label>
                <Select
                  value={newMember.seniority}
                  onValueChange={(value) => setNewMember({ ...newMember, seniority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid">Mid-Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="lead">Lead</SelectItem>
                    <SelectItem value="principal">Principal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Availability</label>
                <Select
                  value={newMember.availability}
                  onValueChange={(value) => setNewMember({ ...newMember, availability: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMember(false)}>Cancel</Button>
            <Button onClick={handleAddMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={showEditMember} onOpenChange={setShowEditMember}>
        <DialogContent className="max-w-md max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="max-h-[calc(90vh-130px)] overflow-y-auto pr-6">
              <div className="space-y-4 py-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={selectedMember.name || ''}
                    onChange={(e) => setSelectedMember({ ...selectedMember, name: e.target.value })}
                    placeholder="Full Name"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    value={selectedMember.email}
                    onChange={(e) => setSelectedMember({ ...selectedMember, email: e.target.value })}
                    placeholder="Email Address"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Projects</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          {(selectedMember.projects || []).length > 0
                            ? `${(selectedMember.projects || []).length} projects selected`
                            : "Select Projects"
                          }
                        </div>
                        <div className="opacity-50">⌄</div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0" align="start">
                      <Command>
                        <CommandInput
                          placeholder="Search projects..."
                          value={projectSearch}
                          onValueChange={setProjectSearch}
                        />
                        <CommandList>
                          <CommandEmpty>No projects found.</CommandEmpty>
                          <CommandGroup heading="Available Projects">
                            {filteredProjects.map(project => (
                              <CommandItem
                                key={project.id}
                                onSelect={() => handleEditProjectChange(project.id)}
                                className="flex items-center justify-between"
                              >
                                <div>{project.title}</div>
                                {(selectedMember.projects || []).includes(project.id) && (
                                  <Check className="h-4 w-4" />
                                )}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {(selectedMember.projects || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(selectedMember.projects || []).map(projectId => {
                        const project = projects.find(p => p.id === projectId);
                        return project ? (
                          <Badge key={projectId} variant="secondary" className="flex items-center gap-1">
                            {project.title}
                            <button
                              type="button"
                              className="ml-1 rounded-full h-4 w-4 inline-flex items-center justify-center hover:bg-gray-200"
                              onClick={() => handleEditProjectChange(projectId)}
                            >
                              ×
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={selectedMember.role}
                    onValueChange={(value) => setSelectedMember({ ...selectedMember, role: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="frontend_developer">Frontend Developer</SelectItem>
                      <SelectItem value="backend_developer">Backend Developer</SelectItem>
                      <SelectItem value="fullstack_developer">Fullstack Developer</SelectItem>
                      <SelectItem value="devops_engineer">DevOps Engineer</SelectItem>
                      <SelectItem value="qa_engineer">QA Engineer</SelectItem>
                      <SelectItem value="ui_designer">UI Designer</SelectItem>
                      <SelectItem value="ux_designer">UX Designer</SelectItem>
                      <SelectItem value="product_manager">Product Manager</SelectItem>
                      <SelectItem value="project_manager">Project Manager</SelectItem>
                      <SelectItem value="tech_lead">Tech Lead</SelectItem>
                      <SelectItem value="architect">Architect</SelectItem>
                      <SelectItem value="cto">CTO</SelectItem>
                      <SelectItem value="security_engineer">Security Engineer</SelectItem>
                      <SelectItem value="database_admin">Database Admin</SelectItem>
                      <SelectItem value="mobile_developer">Mobile Developer</SelectItem>
                      <SelectItem value="data_scientist">Data Scientist</SelectItem>
                      <SelectItem value="scrum_master">Scrum Master</SelectItem>
                      <SelectItem value="technical_writer">Technical Writer</SelectItem>
                      <SelectItem value="business_analyst">Business Analyst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Seniority</label>
                  <Select
                    value={selectedMember.seniority}
                    onValueChange={(value) => setSelectedMember({ ...selectedMember, seniority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="junior">Junior</SelectItem>
                      <SelectItem value="mid">Mid-Level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="principal">Principal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Availability</label>
                  <Select
                    value={selectedMember.availability}
                    onValueChange={(value) => setSelectedMember({ ...selectedMember, availability: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full Time</SelectItem>
                      <SelectItem value="part_time">Part Time</SelectItem>
                      <SelectItem value="contractor">Contractor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditMember(false)}>Cancel</Button>
            <Button onClick={handleEditMember}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calendar Dialog */}
      <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMember ? `Schedule for ${selectedMember.name || selectedMember.email}` : 'Team Calendar'}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Calendar
              mode="single"
              className="rounded-md border"
            />
          </div>
        </DialogContent>
      </Dialog>
      
      <FeedbackButton pageName="TeamManagement" />
    </div>
  );
}
