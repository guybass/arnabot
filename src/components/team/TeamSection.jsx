import React, { useState, useEffect } from 'react';
import { TeamMember } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  User,
  Calendar,
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
import { format } from 'date-fns';

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
  const [members, setMembers] = useState([]);
  const [showNewMember, setShowNewMember] = useState(false);
  const [selectedExpertise, setSelectedExpertise] = useState([]);
  const [newMember, setNewMember] = useState({
    project_id: project?.id,
    email: '',
    role: '',
    seniority: 'mid',
    expertise: [],
    availability: 'full_time',
    start_date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    if (project) {
      loadTeamMembers();
    }
  }, [project]);

  const loadTeamMembers = async () => {
    const teamMembers = await TeamMember.filter({ project_id: project.id });
    setMembers(teamMembers);
  };

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
    await TeamMember.create(newMember);
    setShowNewMember(false);
    setNewMember({
      project_id: project?.id,
      email: '',
      role: '',
      seniority: 'mid',
      expertise: [],
      availability: 'full_time',
      start_date: format(new Date(), 'yyyy-MM-dd')
    });
    setSelectedExpertise([]);
    loadTeamMembers();
  };

  const removeMember = async (memberId) => {
    await TeamMember.delete(memberId);
    loadTeamMembers();
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
          {members.map(member => {
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
                      <span className="font-medium">{member.email}</span>
                      <Badge variant="outline" className={getRoleColor(member.role)}>
                        {member.role.replace(/_/g, ' ')}
                      </Badge>
                      <Badge variant="outline">
                        {member.seniority}
                      </Badge>
                    </div>
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
                        {member.availability.replace('_', ' ')}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(member.start_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeMember(member.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>

      <Dialog open={showNewMember} onOpenChange={setShowNewMember}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Input
                  placeholder="Email"
                  value={newMember.email}
                  onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                />
              </div>
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
            <div className="grid grid-cols-2 gap-4">
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
            <div>
              <Input
                type="date"
                value={newMember.start_date}
                onChange={(e) => setNewMember({ ...newMember, start_date: e.target.value })}
              />
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
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewMember(false)}>Cancel</Button>
            <Button onClick={createMember}>Add Member</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}