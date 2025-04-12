import React, { useState } from 'react';
import { Document, Task } from '@/api/entities';
import { InvokeLLM, SendEmail } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  MessageSquare,
  RefreshCcw,
  Send,
  Loader2,
  FileText,
  Mail,
  Calendar,
  Zap,
  FileCode,
  ClipboardList,
  AlertCircle
} from 'lucide-react';

export default function AIAssistant({ project, onGenerateUpdate, onDocumentCreate }) {
  const [question, setQuestion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationTask, setGenerationTask] = useState('');
  const [messageHistory, setMessageHistory] = useState([]);

  const askQuestion = async () => {
    if (!question.trim()) return;

    const newMessage = { role: 'user', content: question };
    setMessageHistory(prev => [...prev, newMessage]);
    setQuestion('');
    setGenerating(true);

    try {
      const response = await InvokeLLM({
        prompt: `You are a project management AI assistant helping with the project "${project.title}". 
        The question is: ${question}

        Consider this context about the project:
        ${JSON.stringify(project, null, 2)}

        Provide a clear, concise, and helpful response.`
      });

      setMessageHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      setMessageHistory(prev => [...prev, { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    }

    setGenerating(false);
  };

  const generateStatusUpdate = async () => {
    setGenerating(true);
    setGenerationTask('status');
    try {
      const update = await onGenerateUpdate();
      
      // Create document for the status update
      await Document.create({
        project_id: project.id,
        title: `Status Update - ${new Date().toLocaleDateString()}`,
        type: 'status_update',
        content: update,
        language: 'en'
      });

      onDocumentCreate();

      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'I\'ve generated a new status update and saved it as a document. You can find it in the Documents section.'
      }]);
    } catch (error) {
      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the status update. Please try again.'
      }]);
    }
    setGenerating(false);
    setGenerationTask('');
  };

  const generateFunctionalSpec = async () => {
    setGenerating(true);
    setGenerationTask('spec');
    try {
      const prompt = `Create a detailed functional specification document for the software project titled "${project.title}".
      
      Project description: ${project.description || 'No description provided'}
      
      Include the following sections:
      1. Introduction (purpose and scope)
      2. System Overview
      3. User Requirements
      4. Functional Requirements
      5. Interface Requirements
      6. Non-Functional Requirements
      7. System Architecture
      8. Data Models
      9. Testing Strategy
      
      Make it professional, detailed, and ready for implementation by a software development team.`;
      
      const spec = await InvokeLLM({ prompt });
      
      await Document.create({
        project_id: project.id,
        title: `Functional Specification - ${project.title}`,
        type: 'specification',
        content: spec,
        language: 'en'
      });

      onDocumentCreate();

      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'I\'ve generated a comprehensive functional specification document for your project. You can find it in the Documents section.'
      }]);
    } catch (error) {
      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the functional specification. Please try again.'
      }]);
    }
    setGenerating(false);
    setGenerationTask('');
  };

  const generateActionItems = async () => {
    setGenerating(true);
    setGenerationTask('actions');
    try {
      // Get tasks for status context
      const currentTasks = await Task.filter({ project_id: project.id });
      
      const prompt = `Based on the following project information, generate a prioritized list of action items that should be addressed next.
      
      Project: ${project.title}
      Description: ${project.description || 'No description provided'}
      Current status: ${project.status}
      
      Current tasks:
      ${currentTasks.map(t => `- ${t.title} (${t.status})`).join('\n')}
      
      For each action item:
      1. Provide a clear, specific title
      2. Add a brief description
      3. Suggest which role should be responsible (frontend, backend, devops, qa, design, product)
      4. Assign a priority (low, medium, high, urgent)
      5. Suggest a reasonable due date
      
      Format each action item ready to be added as a task.`;
      
      const actionItems = await InvokeLLM({ prompt });
      
      await Document.create({
        project_id: project.id,
        title: `Action Items - ${new Date().toLocaleDateString()}`,
        type: 'status_update',
        content: actionItems,
        language: 'en'
      });

      onDocumentCreate();

      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'I\'ve generated a list of prioritized action items for your project. You can find it in the Documents section.'
      }]);
    } catch (error) {
      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the action items. Please try again.'
      }]);
    }
    setGenerating(false);
    setGenerationTask('');
  };

  const generateRiskAssessment = async () => {
    setGenerating(true);
    setGenerationTask('risks');
    try {
      const prompt = `Create a comprehensive risk assessment for the software project titled "${project.title}".
      
      Project description: ${project.description || 'No description provided'}
      Current status: ${project.status}
      
      Include the following in your assessment:
      1. Identification of potential risks (technical, schedule, resource, scope, etc.)
      2. Impact analysis of each risk (high, medium, low)
      3. Probability of occurrence (high, medium, low)
      4. Risk mitigation strategies
      5. Contingency plans
      
      Format the assessment in a clear, structured manner with actionable insights.`;
      
      const risks = await InvokeLLM({ prompt });
      
      await Document.create({
        project_id: project.id,
        title: `Risk Assessment - ${project.title}`,
        type: 'specification',
        content: risks,
        language: 'en'
      });

      onDocumentCreate();

      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'I\'ve generated a risk assessment document for your project. You can find it in the Documents section.'
      }]);
    } catch (error) {
      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the risk assessment. Please try again.'
      }]);
    }
    setGenerating(false);
    setGenerationTask('');
  };

  return (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[calc(100%-5rem)]">
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={generateStatusUpdate}
            disabled={generating}
            className="flex items-center justify-center gap-1 h-10"
          >
            {generating && generationTask === 'status' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCcw className="w-4 h-4" />
            )}
            <span>Status Update</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateFunctionalSpec}
            disabled={generating}
            className="flex items-center justify-center gap-1 h-10"
          >
            {generating && generationTask === 'spec' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <FileCode className="w-4 h-4" />
            )}
            <span>Functional Spec</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateActionItems}
            disabled={generating}
            className="flex items-center justify-center gap-1 h-10"
          >
            {generating && generationTask === 'actions' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ClipboardList className="w-4 h-4" />
            )}
            <span>Action Items</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={generateRiskAssessment}
            disabled={generating}
            className="flex items-center justify-center gap-1 h-10"
          >
            {generating && generationTask === 'risks' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>Risk Assessment</span>
          </Button>
        </div>
        
        <Separator className="my-2" />
        
        <div className="flex-1 overflow-auto mb-4 space-y-4">
          {messageHistory.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))}
          {generating && !generationTask && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ask me anything about the project..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
            disabled={generating}
          />
          <Button
            onClick={askQuestion}
            disabled={generating || !question.trim()}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}