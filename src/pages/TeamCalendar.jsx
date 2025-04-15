import React, { useState, useEffect } from 'react';
import { TeamMember, Task, Project } from '@/api/entities';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';
import { Loader2, ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Users } from 'lucide-react';

export default function TeamCalendar() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedMember, setSelectedMember] = useState(null);
  const [viewMode, setViewMode] = useState('calendar');
  const [showMemberDetails, setShowMemberDetails] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadTeamData();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    try {
      const fetchedProjects = await Project.list('-created_date');
      setProjects(fetchedProjects);
      if (fetchedProjects.length > 0) {
        setSelectedProject(fetchedProjects[0]);
      }
    } catch (error) {
      console.error("Error loading projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadTeamData = async () => {
    setLoading(true);
    try {
      const [members, projectTasks] = await Promise.all([
        TeamMember.filter({ project_id: selectedProject.id }),
        Task.filter({ project_id: selectedProject.id })
      ]);
      
      setTeamMembers(members);
      setTasks(projectTasks);
      
      if (members.length > 0 && !selectedMember) {
        setSelectedMember(members[0]);
      }
    } catch (error) {
      console.error("Error loading team data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleProjectChange = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (project) {
      setSelectedProject(project);
      setSelectedMember(null);
    }
  };

  const handleViewMemberDetails = (member) => {
    setSelectedMember(member);
    setShowMemberDetails(true);
  };

  // Get member task assignments for the month
  const getMemberTasks = (member) => {
    if (!member) return [];
    return tasks.filter(task => task.assigned_to === member.email);
  };

  // Get tasks for a specific date and member
  const getTasksForDate = (date, member) => {
    if (!member) return [];
    return tasks.filter(task => {
      if (!task.assigned_to || task.assigned_to !== member.email || !task.due_date) return false;
      return isSameDay(new Date(task.due_date), date);
    });
  };

  // Render member calendar
  const renderMemberCalendar = () => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    const days = eachDayOfInterval({ start, end });

    return (
      <div className="bg-white rounded-lg border">
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center font-medium text-sm">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 auto-rows-fr">
          {days.map((day, i) => {
            // Calculate day position - need to account for starting day of the month
            const startDay = start.getDay();
            const emptyDays = Array.from({ length: startDay }).map((_, i) => (
              <div key={`empty-${i}`} className="border-t border-r p-1 bg-gray-50"></div>
            ));
            
            if (i === 0) {
              return [
                ...emptyDays,
                <DayCell key={day.toString()} day={day} member={selectedMember} tasks={getTasksForDate(day, selectedMember)} />
              ];
            }
            
            return (
              <DayCell key={day.toString()} day={day} member={selectedMember} tasks={getTasksForDate(day, selectedMember)} />
            );
          })}
        </div>
      </div>
    );
  };

  // Day cell component
  const DayCell = ({ day, member, tasks }) => {
    const isToday = isSameDay(day, new Date());
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    
    return (
      <div 
        className={`border-t border-r p-1 min-h-[100px] ${
          isWeekend ? 'bg-gray-50' : ''
        } ${isToday ? 'bg-blue-50' : ''}`}
      >
        <div className="text-right text-sm">
          {format(day, 'd')}
        </div>
        <div className="mt-1 space-y-1">
          {tasks.map(task => (
            <div 
              key={task.id} 
              className={`text-xs p-1 rounded truncate ${
                task.priority === 'high' || task.priority === 'urgent' 
                  ? 'bg-red-100 text-red-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}
              title={task.title}
            >
              {task.title}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render team members list
  const renderTeamList = () => {
    return (
      <div className="space-y-4">
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No team members found for this project
          </div>
        ) : (
          teamMembers.map(member => (
            <div 
              key={member.id}
              className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleViewMemberDetails(member)}
            >
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{member.email}</h3>
                  <div className="text-sm text-gray-500 mt-1">
                    <Badge>{member.role.replace('_', ' ')}</Badge>
                    <span className="ml-2 capitalize">{member.seniority}</span>
                  </div>
                </div>
                <div>
                  <Badge variant="outline">
                    {getMemberTasks(member).length} tasks
                  </Badge>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  if (loading && !projects.length) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-[1800px]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Team Calendar</h1>
        <p className="text-gray-600">View and manage team member schedules and assignments</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-72 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Project</CardTitle>
            </CardHeader>
            <CardContent>
              <Select 
                value={selectedProject?.id}
                onValueChange={handleProjectChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map(project => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">View Mode</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={viewMode} onValueChange={setViewMode}>
                <TabsList className="w-full">
                  <TabsTrigger value="calendar" className="flex-1">
                    <CalendarIcon className="w-4 h-4 mr-1" />
                    Calendar
                  </TabsTrigger>
                  <TabsTrigger value="team" className="flex-1">
                    <Users className="w-4 h-4 mr-1" />
                    Team
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>

          {viewMode === 'calendar' && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Team Members</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {teamMembers.length === 0 ? (
                    <p className="text-sm text-gray-500">No team members found</p>
                  ) : (
                    teamMembers.map(member => (
                      <Button 
                        key={member.id} 
                        variant={selectedMember?.id === member.id ? "secondary" : "outline"}
                        className="w-full justify-start text-left"
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className="truncate">
                          {member.email}
                        </div>
                      </Button>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>
                {viewMode === 'calendar' 
                  ? `${selectedMember?.email || 'Team'} Calendar` 
                  : 'Team Members'}
              </CardTitle>
              
              {viewMode === 'calendar' && (
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrevMonth}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-lg font-medium min-w-[150px] text-center">
                    {format(currentDate, 'MMMM yyyy')}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleNextMonth}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent>
              <TabsContent value="calendar" className="mt-0">
                {renderMemberCalendar()}
              </TabsContent>
              
              <TabsContent value="team" className="mt-0">
                {renderTeamList()}
              </TabsContent>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Member Details Dialog */}
      <Dialog open={showMemberDetails} onOpenChange={setShowMemberDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Team Member Details</DialogTitle>
          </DialogHeader>
          
          {selectedMember && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium">Email</div>
                  <div>{selectedMember.email}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Role</div>
                  <div className="capitalize">{selectedMember.role.replace(/_/g, ' ')}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Seniority</div>
                  <div className="capitalize">{selectedMember.seniority}</div>
                </div>
                <div>
                  <div className="text-sm font-medium">Availability</div>
                  <div className="capitalize">{selectedMember.availability?.replace(/_/g, ' ') || 'Full Time'}</div>
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium mb-2">Assigned Tasks</div>
                {getMemberTasks(selectedMember).length === 0 ? (
                  <p className="text-gray-500">No tasks assigned</p>
                ) : (
                  <div className="space-y-2">
                    {getMemberTasks(selectedMember).map(task => (
                      <div key={task.id} className="p-2 border rounded-md">
                        <div className="font-medium">{task.title}</div>
                        <div className="flex justify-between mt-1">
                          <Badge>{task.status}</Badge>
                          {task.due_date && (
                            <span className="text-sm text-gray-500">
                              Due: {format(new Date(task.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button onClick={() => setShowMemberDetails(false)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}