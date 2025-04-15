
import React, { useState, useEffect } from 'react';
import { Project, Task, Document, User, TeamMember } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import ProjectHeader from '../components/projects/ProjectHeader';
import DocumentSection from '../components/documents/DocumentSection';
import TeamSection from '../components/team/TeamSection';
import EmailSection from '../components/communication/EmailSection';
import AIAssistant from '../components/assistant/AIAssistant';
import { Loader2, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useSearchParams } from 'react-router-dom';

export default function ProjectDashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [projectStats, setProjectStats] = useState(null);
  const [projectTasks, setProjectTasks] = useState([]);
  const [searchParams] = useSearchParams();
  const projectIdFromUrl = searchParams.get('projectId');

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (projects.length > 0) {
      // If there's a project ID in the URL, use that project
      if (projectIdFromUrl) {
        const projectFromUrl = projects.find(p => p.id === projectIdFromUrl);
        if (projectFromUrl) {
          setSelectedProject(projectFromUrl);
          return;
        }
      }
      
      // Otherwise use the first project
      if (!selectedProject) {
        setSelectedProject(projects[0]);
      }
    }
  }, [projects, projectIdFromUrl, selectedProject]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    const fetchedProjects = await Project.list('-created_date');
    setProjects(fetchedProjects);
    setLoading(false);
  };

  const loadProjectData = async () => {
    setLoading(true);
    const [projectTasks, projectDocs] = await Promise.all([
      Task.filter({ project_id: selectedProject.id }, '-updated_date'),
      Document.filter({ project_id: selectedProject.id }, '-created_date')
    ]);
    setProjectTasks(projectTasks);
    setDocuments(projectDocs);
    setLoading(false);
    
    // Load project statistics
    loadProjectStats(projectTasks);
  };

  const loadProjectStats = async (tasks) => {
    try {
      const teamMembers = await TeamMember.filter({ project_id: selectedProject.id });
      
      // Calculate task statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      const todoTasks = tasks.filter(t => t.status === 'todo').length;
      const reviewTasks = tasks.filter(t => t.status === 'review').length;
      
      // Calculate task distribution by role
      const tasksByRole = tasks.reduce((acc, task) => {
        acc[task.role] = (acc[task.role] || 0) + 1;
        return acc;
      }, {});

      // Calculate progress percentage
      const progressPercentage = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;
      
      // Calculate high priority tasks
      const highPriorityTasks = tasks.filter(t => 
        t.priority === 'high' || t.priority === 'urgent'
      ).length;
      
      setProjectStats({
        totalTasks,
        completedTasks,
        inProgressTasks,
        todoTasks,
        reviewTasks,
        progressPercentage,
        highPriorityTasks,
        tasksByRole,
        teamMemberCount: teamMembers.length
      });
    } catch (error) {
      console.error('Error loading project stats:', error);
    }
  };

  const generateProjectUpdate = async () => {
    const context = {
      project: selectedProject,
      tasks: projectTasks.map(t => ({
        title: t.title,
        status: t.status,
        assignee: t.assigned_to,
        priority: t.priority
      })),
      recentDocuments: documents
        .filter(d => d.type === 'meeting_notes' || d.type === 'status_update')
        .slice(0, 5)
        .map(d => ({ title: d.title, content: d.content }))
    };

    const prompt = `As a project management AI assistant, generate a comprehensive project status update based on the following context:
    ${JSON.stringify(context, null, 2)}
    
    Include:
    1. Overall project status and progress
    2. Key achievements and milestones
    3. Ongoing tasks and their status
    4. Potential risks or blockers
    5. Next steps and recommendations
    
    Format the response in a clear, professional manner.`;

    return await InvokeLLM({ prompt });
  };

  if (loading && !selectedProject) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'planning': return 'bg-purple-100 text-purple-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto p-4 md:p-6 space-y-6">
        <ProjectHeader 
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
          onProjectsChange={loadProjects}
        />

        {selectedProject && projectStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{projectStats.progressPercentage}%</div>
                <Progress 
                  value={projectStats.progressPercentage} 
                  className="h-2 mt-2" 
                />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <div>{projectStats.completedTasks} of {projectStats.totalTasks} tasks completed</div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Task Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-500">To Do</div>
                    <div className="text-xl font-bold">{projectStats.todoTasks}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">In Progress</div>
                    <div className="text-xl font-bold">{projectStats.inProgressTasks}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Review</div>
                    <div className="text-xl font-bold">{projectStats.reviewTasks}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Done</div>
                    <div className="text-xl font-bold">{projectStats.completedTasks}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Team & Priority</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <div className="text-xs text-gray-500">Team Members</div>
                    <div className="text-xl font-bold">{projectStats.teamMemberCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">High Priority</div>
                    <div className="text-xl font-bold">{projectStats.highPriorityTasks}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Project Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Badge className={getStatusColor(selectedProject.status)}>
                    {selectedProject.status.replace('_', ' ')}
                  </Badge>
                  <div className="flex items-center justify-between">
                    <Link 
                      to={createPageUrl(`TaskManager?projectId=${selectedProject.id}`)}
                      className="w-full"
                    >
                      <Button variant="outline" className="w-full">
                        <span>Go to Tasks</span>
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            {selectedProject && projectTasks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Recent Tasks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {projectTasks.slice(0, 5).map(task => (
                      <div 
                        key={task.id} 
                        className="flex justify-between items-center p-3 border rounded-md hover:bg-gray-50"
                      >
                        <div>
                          <div className="font-medium">{task.title}</div>
                          <div className="text-sm text-gray-500">
                            {task.assigned_to ? `Assigned to: ${task.assigned_to}` : 'Unassigned'} 
                            • Priority: {task.priority}
                          </div>
                        </div>
                        <Badge
                          className={
                            task.status === 'done' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            task.status === 'review' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        >
                          {task.status}
                        </Badge>
                      </div>
                    ))}
                    
                    <Link to={createPageUrl(`TaskManager?projectId=${selectedProject.id}`)}>
                      <Button variant="outline" className="w-full mt-4">
                        View All Tasks
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <TeamSection project={selectedProject} />
            <EmailSection project={selectedProject} />
            <DocumentSection 
              documents={documents}
              project={selectedProject}
              onDocumentsChange={loadProjectData}
            />
          </div>
          
          <div className="lg:col-span-4">
            <AIAssistant
              project={selectedProject}
              onGenerateUpdate={generateProjectUpdate}
              onDocumentCreate={loadProjectData}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
