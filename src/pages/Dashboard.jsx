import React, { useState, useEffect } from 'react';
import { Project, Task, Document, User } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import ProjectHeader from '../components/projects/ProjectHeader';
import TaskBoard from '../components/tasks/TaskBoard';
import DocumentSection from '../components/documents/DocumentSection';
import TeamSection from '../components/team/TeamSection';
import EmailSection from '../components/communication/EmailSection';
import AIAssistant from '../components/assistant/AIAssistant';
import { Loader2 } from 'lucide-react';

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData();
    }
  }, [selectedProject]);

  const loadProjects = async () => {
    const fetchedProjects = await Project.list('-created_date');
    setProjects(fetchedProjects);
    if (fetchedProjects.length > 0) {
      setSelectedProject(fetchedProjects[0]);
    }
    setLoading(false);
  };

  const loadProjectData = async () => {
    setLoading(true);
    const [projectTasks, projectDocs] = await Promise.all([
      Task.filter({ project_id: selectedProject.id }, '-updated_date'),
      Document.filter({ project_id: selectedProject.id }, '-created_date')
    ]);
    setTasks(projectTasks);
    setDocuments(projectDocs);
    setLoading(false);
  };

  const generateProjectUpdate = async () => {
    const context = {
      project: selectedProject,
      tasks: tasks.map(t => ({
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-[1800px] mx-auto p-4 md:p-6 space-y-6">
        <ProjectHeader 
          projects={projects}
          selectedProject={selectedProject}
          onProjectSelect={setSelectedProject}
          onProjectsChange={loadProjects}
        />

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <TaskBoard 
              tasks={tasks}
              project={selectedProject}
              onTasksChange={loadProjectData}
            />
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