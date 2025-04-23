
import React, { useState, useEffect } from 'react';
import { TeamMember } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  User,
  Briefcase,
  Star,
  Clock,
  X,
  Code,
  Database,
  Cloud,
  TestTube,
  Palette,
  LineChart,
  Shield,
  Smartphone,
  Brain,
  ClipboardList,
  FileText,
  Users
} from 'lucide-react';
import { applyOwnershipFilter } from '@/components/utils/ownershipFilters';

const EXPERTISE_OPTIONS = {
  frontend_developer: ['React', 'Vue', 'Angular', 'TypeScript', 'CSS/SASS', 'WebGL', 'Responsive Design'],
  backend_developer: ['Node.js', 'Python', 'Java', 'Go', 'REST', 'GraphQL', 'Microservices'],
  fullstack_developer: ['React', 'Node.js', 'TypeScript', 'Python', 'Full Stack Architecture'],
  devops_engineer: ['AWS', 'Azure', 'GCP', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform'],
  qa_engineer: ['Selenium', 'Jest', 'Cypress', 'Manual Testing', 'Test Automation', 'Performance Testing'],
  ui_designer: ['Figma', 'Adobe XD', 'Sketch', 'Design Systems', 'Typography', 'Color Theory'],
  ux_designer: ['User Research', 'Wireframing', 'Prototyping', 'Usability Testing', 'Information Architecture'],
  product_manager: ['Agile', 'Product Strategy', 'Market Research', 'User Stories', 'Roadmapping'],
  project_manager: ['Agile', 'Scrum', 'Risk Management', 'Budgeting', 'Resource Planning'],
  tech_lead: ['System Design', 'Code Review', 'Mentoring', 'Technical Planning', 'Architecture'],
  architect: ['System Architecture', 'Cloud Architecture', 'Scalability', 'Security', 'Integration'],
  security_engineer: ['Penetration Testing', 'Security Audits', 'Encryption', 'Security Protocols'],
  database_admin: ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Database Optimization'],
  mobile_developer: ['iOS', 'Android', 'React Native', 'Flutter', 'Mobile Architecture'],
  data_scientist: ['Python', 'R', 'Machine Learning', 'Data Analysis', 'Statistical Modeling'],
  scrum_master: ['Agile', 'Scrum', 'Kanban', 'Team Facilitation', 'Process Improvement'],
  technical_writer: ['Documentation', 'API Docs', 'Technical Communication', 'Content Strategy'],
  business_analyst: ['Requirements Gathering', 'Process Modeling', 'Data Analysis', 'Stakeholder Management']
};

const ROLE_ICONS = {
  frontend_developer: Code,
  backend_developer: Database,
  fullstack_developer: Code,
  devops_engineer: Cloud,
  qa_engineer: TestTube,
  ui_designer: Palette,
  ux_designer: Palette,
  product_manager: LineChart,
  project_manager: Users,
  tech_lead: Star,
  architect: Shield,
  security_engineer: Shield,
  database_admin: Database,
  mobile_developer: Smartphone,
  data_scientist: Brain,
  scrum_master: Users,
  technical_writer: FileText,
  business_analyst: ClipboardList
};

export default function TeamSection({ project }) {
  const [allMembers, setAllMembers] = useState([]);
  const [showNewMember, setShowNewMember] = useState(false);
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: '',
    seniority: 'mid',
    expertise: [],
    availability: 'full_time',
    projects: [] // Array of project IDs
  });

  useEffect(() => {
    loadTeamMembers();
  }, [project]);

  const loadTeamMembers = async () => {
    try {
      // Apply ownership filter combined with project filter
      const filter = await applyOwnershipFilter();
      const teamMembers = await TeamMember.list();
      
      // We need to filter the team members based on the current project
      const filteredMembers = teamMembers.filter(member => {
        return member.projects && Array.isArray(member.projects) && 
              member.projects.includes(project?.id);
      });
      
      setAllMembers(filteredMembers);
    } catch (error) {
      console.error("Error loading team members:", error);
    }
  };

  // Filter team members for the current project
  const projectMembers = allMembers.filter(member => {
    return member.projects && Array.isArray(member.projects) && member.projects.includes(project?.id);
  });

  const handleRoleChange = (role) => {
    setNewMember(prev => ({ ...prev, role }));
    setSelectedExpertise([]);
  };

  const toggleExpertise = (skill) => {
    if (selectedExpertise.includes(skill)) {
      setSelectedExpertise(prev => prev.filter(s => s !== skill));
    } else {
      setSelectedExpertise(prev => [...prev, skill]);
    }
    setNewMember(prev => ({
      ...prev,
      expertise: selectedExpertise.includes(skill)
        ? prev.expertise.filter(s => s !== skill)
        : [...prev.expertise, skill]
    }));
  };

  const createMember = async () => {
    try {
      // Ensure the current project is assigned to this team member
      const projectsArray = newMember.projects || [];
      
      // Add current project to projects array if not already included
      if (project && !projectsArray.includes(project.id)) {
        projectsArray.push(project.id);
      }
      
      const memberToCreate = {
        ...newMember,
        projects: projectsArray
      };
      
      await TeamMember.create(memberToCreate);
      setShowNewMember(false);
      setNewMember({
        name: '',
        email: '',
        role: '',
        seniority: 'mid',
        expertise: [],
        availability: 'full_time',
        projects: []
      });
      setSelectedExpertise([]);
      loadTeamMembers();
    } catch (error) {
      console.error("Error creating team member:", error);
    }
  };

  const removeMemberFromProject = async (member) => {
    try {
      // Remove this project from the member's projects array
      const updatedProjects = (member.projects || []).filter(id => id !== project.id);
      
      await TeamMember.update(member.id, {
        ...member,
        projects: updatedProjects
      });
      
      loadTeamMembers();
    } catch (error) {
      console.error("Error updating team member:", error);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      frontend_developer: 'bg-purple-100 text-purple-800',
      backend_developer: 'bg-blue-100 text-blue-800',
      fullstack_developer: 'bg-indigo-100 text-indigo-800',
      devops_engineer: 'bg-cyan-100 text-cyan-800',
      qa_engineer: 'bg-green-100 text-green-800',
      ui_designer: 'bg-pink-100 text-pink-800',
      ux_designer: 'bg-rose-100 text-rose-800',
      product_manager: 'bg-yellow-100 text-yellow-800',
      project_manager: 'bg-orange-100 text-orange-800',
      tech_lead: 'bg-red-100 text-red-800',
      architect: 'bg-emerald-100 text-emerald-800',
      security_engineer: 'bg-teal-100 text-teal-800',
      database_admin: 'bg-blue-100 text-blue-800',
      mobile_developer: 'bg-violet-100 text-violet-800',
      data_scientist: 'bg-fuchsia-100 text-fuchsia-800',
      scrum_master: 'bg-amber-100 text-amber-800',
      technical_writer: 'bg-lime-100 text-lime-800',
      business_analyst: 'bg-orange-100 text-orange-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Technical Team
        </CardTitle>
        <Button onClick={() => setShowNewMember(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Team Member
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {projectMembers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No team members assigned to this project yet.
              Click "Add Team Member" to assign someone to this project.
            </div>
          ) : (
            projectMembers.map(member => {
              const RoleIcon = ROLE_ICONS[member.role] || User;
              return (
                <div
                  key={member.id}
                  className="flex items-start justify-between p-4 rounded-lg border hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-lg ${getRoleColor(member.role)}`}>
                      <RoleIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{member.name || member.email}</span>
                        <Badge variant="outline" className={getRoleColor(member.role)}>
                          {member.role?.replace(/_/g, ' ') || 'No role assigned'}
                        </Badge>
                        <Badge variant="outline">
                          {member.seniority}
                        </Badge>
                      </div>
                      {member.email && <div className="text-sm text-gray-500">{member.email}</div>}
                      {member.expertise?.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {member.expertise.map(skill => (
                            <Badge key={skill} variant="secondary" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {member.availability?.replace('_', ' ') || 'No availability set'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMemberFromProject(member)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      <Dialog open={showNewMember} onOpenChange={setShowNewMember}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(80vh-180px)]">
            <div className="space-y-4 py-4 pr-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="Full Name"
                    value={newMember.name}
                    onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    placeholder="Email Address"
                    value={newMember.email}
                    onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Role</label>
                  <Select
                    value={newMember.role}
                    onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Role" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(ROLE_ICONS).map(role => (
                        <SelectItem key={role} value={role}>
                          {role.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
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
                      <SelectValue placeholder="Seniority Level" />
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
              </div>
              <div>
                <label className="text-sm font-medium">Availability</label>
                <Select
                  value={newMember.availability}
                  onValueChange={(value) => setNewMember({ ...newMember, availability: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Availability" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newMember.role && EXPERTISE_OPTIONS[newMember.role] && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Expertise</label>
                  <div className="flex flex-wrap gap-2">
                    {EXPERTISE_OPTIONS[newMember.role].map(skill => (
                      <Badge
                        key={skill}
                        variant={selectedExpertise.includes(skill) ? 'default' : 'outline'}
                        className="cursor-pointer"
                        onClick={() => toggleExpertise(skill)}
                      >
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMember(false)}>Cancel</Button>
            <Button onClick={createMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
