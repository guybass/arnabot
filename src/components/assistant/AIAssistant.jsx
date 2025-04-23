
import React, { useState, useEffect } from 'react';
import { Document, Task, TeamMember } from '@/api/entities';
import { InvokeLLM, SendEmail } from '@/api/integrations';
import { transcribeAudio, extractAudioFromVideo } from '@/components/integrations/SpeechToText';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
  AlertCircle,
  File,
  AudioWaveform,
  Video
} from 'lucide-react';
import {
  FUNCTIONAL_SPEC_SECTIONS,
  ACTION_ITEMS_SECTIONS,
  DOCUMENT_ANALYSIS_PROMPTS
} from './HeadersDatabase';

export default function AIAssistant({ project, onGenerateUpdate, onDocumentCreate }) {
  const [question, setQuestion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generationTask, setGenerationTask] = useState('');
  const [messageHistory, setMessageHistory] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [includeSelectedDocument, setIncludeSelectedDocument] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [currentAIStep, setCurrentAIStep] = useState('');
  const [AIThoughts, setAIThoughts] = useState([]);
  const [documentSelectionMode, setDocumentSelectionMode] = useState('ai'); // 'none', 'manual', 'ai'

  useEffect(() => {
    if (project) {
      loadProjectData();
    }
  }, [project]);

  const loadProjectData = async () => {
    try {
      const [projectDocs, members] = await Promise.all([
        Document.filter({ project_id: project.id }, '-created_date'),
        TeamMember.filter({ project_id: project.id })
      ]);
      setDocuments(projectDocs);
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading project data:', error);
    }
  };

  const analyzeDocumentRelevance = async (document, context) => {
    try {
      const relevanceAnalysis = await InvokeLLM({
        prompt: `Analyze this document's relevance to the current context:
        
        Document: ${JSON.stringify(document)}
        Context: ${context}
        
        ${DOCUMENT_ANALYSIS_PROMPTS.relevance_assessment}`,
        response_json_schema: {
          type: "object",
          properties: {
            relevance_score: { type: "number" },
            reasoning: { type: "string" },
            key_points: { type: "array", items: { type: "string" } }
          }
        }
      });

      return relevanceAnalysis;
    } catch (error) {
      console.error('Error analyzing document relevance:', error);
      return null;
    }
  };

  const selectRelevantDocuments = async (context, maxDocuments = 3) => {
    setAIThoughts(prev => [...prev, {
      step: "Document analysis",
      thought: "Analyzing project documents for relevance..."
    }]);

    const documentScores = await Promise.all(
      documents.map(async doc => {
        const analysis = await analyzeDocumentRelevance(doc, context);
        return {
          document: doc,
          score: analysis?.relevance_score || 0,
          reasoning: analysis?.reasoning || '',
          key_points: analysis?.key_points || []
        };
      })
    );

    // Sort by relevance score and take top N
    return documentScores
      .sort((a, b) => b.score - a.score)
      .slice(0, maxDocuments);
  };

  const askQuestion = async () => {
    if (!question.trim()) return;

    const newMessage = { role: 'user', content: question };
    setMessageHistory(prev => [...prev, newMessage]);
    setQuestion('');
    setGenerating(true);
    setAIThoughts([{ step: "Initial analysis", thought: "Processing question and gathering context..." }]);

    try {
      // First stage: Gather context and analyze the question
      const initialThought = await InvokeLLM({
        prompt: `You are analyzing a question about the project "${project.title}".
        
        Question: ${question}
        
        Project context:
        ${JSON.stringify(project, null, 2)}
        
        Based on this question, what specific information would be most relevant to provide a helpful answer? 
        Think about what project data, documents, team information, or tasks would be useful to answer this question effectively.
        
        Return your analysis as a JSON with these fields:
        - relevant_data_types: array of strings (e.g., ["tasks", "documents", "team"])
        - approach: brief explanation of how you will answer this question
        - additional_context_needed: what other information would help provide a better answer`,
        response_json_schema: {
          type: "object",
          properties: {
            relevant_data_types: {
              type: "array",
              items: { type: "string" }
            },
            approach: { type: "string" },
            additional_context_needed: { type: "string" }
          }
        }
      });

      setAIThoughts(prev => [...prev, {
        step: "Context analysis",
        thought: `I need to consider: ${initialThought.relevant_data_types.join(", ")}\nApproach: ${initialThought.approach}`
      }]);

      // Second stage: Generate a comprehensive response based on all available context
      const response = await InvokeLLM({
        prompt: `You are a project management AI assistant helping with the project "${project.title}". 
        
        The question is: ${question}

        Consider this context about the project:
        ${JSON.stringify(project, null, 2)}
        
        Team members:
        ${JSON.stringify(teamMembers, null, 2)}
        
        Recent documents (titles only):
        ${documents.slice(0, 5).map(d => `- ${d.title} (${d.type})`).join('\n')}
        
        Your initial analysis:
        ${JSON.stringify(initialThought, null, 2)}
        
        Based on your analysis and all available context, provide a clear, concise, and helpful response.
        If you don't have enough information, be transparent about limitations but still try to provide the most helpful response possible.`
      });

      setAIThoughts(prev => [...prev, {
        step: "Response generation",
        thought: "Formulating comprehensive response based on all available context and analysis."
      }]);

      setMessageHistory(prev => [...prev, { role: 'assistant', content: response }]);
    } catch (error) {
      console.error('Error in AI processing:', error);
      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      }]);
    }

    setGenerating(false);
    setAIThoughts([]);
  };

  const generateStatusUpdate = async () => {
    setGenerating(true);
    setGenerationTask('status');
    setAIThoughts([{ step: "Preparation", thought: "Analyzing project status..." }]);

    try {
      let documentContext = "";

      if (documentSelectionMode === 'manual' && selectedDocument) {
        const doc = documents.find(d => d.id === selectedDocument);
        setAIThoughts(prev => [...prev, {
          step: "Document processing",
          thought: `Including "${doc.title}" in status update context.`
        }]);

        if ((doc.type === 'audio' || doc.type === 'video') && doc.file_url) {
          setCurrentAIStep("Transcribing media file...");

          try {
            let audioUrl = doc.file_url;

            if (doc.type === 'video') {
              audioUrl = await extractAudioFromVideo({ videoUrl: doc.file_url });
            }

            const transcript = await transcribeAudio({
              audioUrl,
              language: doc.language || 'en'
            });

            documentContext = `
            Transcript of ${doc.type} file "${doc.title}":
            ${transcript}
            `;
          } catch (error) {
            console.error('Error in transcription:', error);
            setAIThoughts(prev => [...prev, {
              step: "Transcription error",
              thought: `Failed to transcribe ${doc.type} file. Continuing with available text content.`
            }]);
          }
        } else if (doc.content) {
          documentContext = `
          Content of document "${doc.title}":
          ${doc.content}
          `;
        }
      } else if (documentSelectionMode === 'ai') {
        const relevantDocs = await selectRelevantDocuments(
          "Generating project status update",
          3
        );

        if (relevantDocs.length > 0) {
          setAIThoughts(prev => [...prev, {
            step: "Document selection",
            thought: `Selected ${relevantDocs.length} relevant documents for context.`
          }]);

          documentContext = relevantDocs
            .map(({ document, reasoning, key_points }) => `
              Document: ${document.title}
              Relevance: ${reasoning}
              Key Points:
              ${key_points.map(point => `- ${point}`).join('\n')}
              
              Content:
              ${document.content || 'No content available'}
            `).join('\n\n');
        }
      }

      // Get project tasks
      const tasks = await Task.filter({ project_id: project.id });

      setAIThoughts(prev => [...prev, {
        step: "Task analysis",
        thought: `Analyzing ${tasks.length} tasks to determine overall project status, progress, and priorities.`
      }]);

      // Calculate task statistics
      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(t => t.status === 'done').length;
      const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
      const blockedTasks = tasks.filter(t => t.priority === 'high' && t.status !== 'done').length;

      const tasksByOwner = tasks.reduce((acc, task) => {
        if (task.assigned_to) {
          if (!acc[task.assigned_to]) acc[task.assigned_to] = [];
          acc[task.assigned_to].push(task);
        }
        return acc;
      }, {});

      setAIThoughts(prev => [...prev, {
        step: "Status assessment",
        thought: `Project completion: ${Math.round((completedTasks / totalTasks) * 100)}%, In progress: ${inProgressTasks}, Blocked/High priority: ${blockedTasks}`
      }]);

      // First pass: Analyze project status
      const statusAnalysis = await InvokeLLM({
        prompt: `You're analyzing the current status of project "${project.title}" to prepare a comprehensive status report.
        
        Project details:
        ${JSON.stringify(project, null, 2)}
        
        Task statistics:
        - Total tasks: ${totalTasks}
        - Completed: ${completedTasks} (${Math.round((completedTasks / totalTasks) * 100)}%)
        - In progress: ${inProgressTasks}
        - High priority tasks: ${blockedTasks}
        
        ${documentContext ? `Additional context from selected document:\n${documentContext}` : ''}
        
        First, analyze the overall project status. Consider:
        1. Is the project on track, ahead, or behind schedule?
        2. What are the main achievements since the last update?
        3. What are the current blockers or risks?
        4. What are the next priorities?
        
        Output your analysis as JSON with these fields:
        - status: one of ["on_track", "ahead", "behind", "at_risk"]
        - progress_assessment: detailed assessment of progress
        - key_achievements: list of main accomplishments
        - blockers: list of current blockers
        - priorities: list of next priorities`,
        response_json_schema: {
          type: "object",
          properties: {
            status: {
              type: "string",
              enum: ["on_track", "ahead", "behind", "at_risk"]
            },
            progress_assessment: { type: "string" },
            key_achievements: {
              type: "array",
              items: { type: "string" }
            },
            blockers: {
              type: "array",
              items: { type: "string" }
            },
            priorities: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      setAIThoughts(prev => [...prev, {
        step: "Status analysis complete",
        thought: `Project assessed as "${statusAnalysis.status}". Identified ${statusAnalysis.key_achievements.length} achievements, ${statusAnalysis.blockers.length} blockers, and ${statusAnalysis.priorities.length} priorities.`
      }]);

      // Second pass: Generate the full status update
      const update = await InvokeLLM({
        prompt: `As a project management AI assistant, generate a comprehensive project status update based on the following context:
        
        Project: ${project.title}
        Description: ${project.description || 'No description provided'}
        Current Status: ${project.status}
        
        Your status analysis:
        ${JSON.stringify(statusAnalysis, null, 2)}
        
        ${documentContext ? `Additional context from selected document:\n${documentContext}` : ''}
        
        Format the status update as a professional email or report with these sections:
        1. Executive Summary (brief overview of current status: ${statusAnalysis.status})
        2. Progress Update (detailed progress assessment)
        3. Key Achievements
        4. Current Challenges/Blockers
        5. Next Steps/Priorities
        6. Additional Notes (include any relevant observations from the document context if available)
        
        Keep the tone professional and action-oriented. Highlight both accomplishments and areas requiring attention.`,
      });

      setAIThoughts(prev => [...prev, {
        step: "Document creation",
        thought: "Finalizing status update document"
      }]);

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
      console.error('Error generating status update:', error);
      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the status update. Please try again.'
      }]);
    }

    setGenerating(false);
    setGenerationTask('');
    setCurrentAIStep('');
    setAIThoughts([]);
  };

  const generateFunctionalSpec = async () => {
    setGenerating(true);
    setGenerationTask('spec');
    setAIThoughts([{ step: "Preparation", thought: "Analyzing project for functional specification..." }]);

    try {
      // Define comprehensive functional spec sections - extensive list
      const functionalSpecSections = [
        // Core sections
        { id: "introduction", title: "Introduction", required: true },
        { id: "purpose", title: "Purpose and Scope", required: true },
        { id: "definitions", title: "Definitions, Acronyms, and Abbreviations", required: true },
        { id: "system_overview", title: "System Overview", required: true },

        // Requirements sections
        { id: "functional_req", title: "Functional Requirements", required: true },
        { id: "user_req", title: "User Requirements", required: true },
        { id: "business_req", title: "Business Requirements", required: false },
        { id: "system_req", title: "System Requirements", required: false },

        // Technical sections
        { id: "arch_overview", title: "System Architecture Overview", required: true },
        { id: "data_models", title: "Data Models and Database Design", required: false },
        { id: "api_specs", title: "API Specifications", required: false },
        { id: "integrations", title: "Third-party Integrations", required: false },
        { id: "tech_stack", title: "Technology Stack", required: false },

        // UI/UX sections
        { id: "user_interfaces", title: "User Interfaces", required: false },
        { id: "ux_workflows", title: "User Experience Workflows", required: false },
        { id: "accessibility", title: "Accessibility Requirements", required: false },

        // Non-functional sections
        { id: "performance_req", title: "Performance Requirements", required: false },
        { id: "security_req", title: "Security Requirements", required: false },
        { id: "reliability_req", title: "Reliability Requirements", required: false },
        { id: "scalability", title: "Scalability", required: false },
        { id: "compliance", title: "Compliance and Regulatory Requirements", required: false },

        // Development sections
        { id: "dev_approach", title: "Development Approach", required: false },
        { id: "testing_strategy", title: "Testing Strategy", required: true },
        { id: "deployment", title: "Deployment Strategy", required: false },
        { id: "ci_cd", title: "CI/CD Pipeline", required: false },

        // Project management sections
        { id: "milestones", title: "Milestones and Deliverables", required: false },
        { id: "risks", title: "Risks and Mitigations", required: false },
        { id: "assumptions", title: "Assumptions and Dependencies", required: true },

        // Specialized sections
        { id: "ml_ai", title: "Machine Learning/AI Components", required: false },
        { id: "mobile_specs", title: "Mobile-specific Requirements", required: false },
        { id: "cloud_infra", title: "Cloud Infrastructure", required: false },
        { id: "analytics", title: "Analytics and Reporting", required: false },
        { id: "localization", title: "Localization and Internationalization", required: false },

        // Documentation sections
        { id: "appendices", title: "Appendices", required: false },
        { id: "references", title: "References", required: false },
        { id: "revision_history", title: "Revision History", required: true }
      ];

      // Get project tasks and documents for context
      const [tasks, projectDocs] = await Promise.all([
        Task.filter({ project_id: project.id }),
        Document.filter({ project_id: project.id })
      ]);

      // Extract content from relevant documents (specs, meeting notes)
      const relevantDocs = projectDocs.filter(d =>
        d.type === 'specification' || d.type === 'meeting_notes'
      );

      const docsContent = relevantDocs.map(d =>
        `Document "${d.title}" (${d.type}):\n${d.content || 'No content available'}\n`
      ).join('\n---\n');

      setAIThoughts(prev => [...prev, {
        step: "Document analysis",
        thought: `Analyzed ${relevantDocs.length} relevant documents and ${tasks.length} tasks for context.`
      }]);

      // First pass: Analyze project to determine appropriate sections
      const sectionAnalysis = await InvokeLLM({
        prompt: `You are preparing to create a functional specification document for the software project "${project.title}".
        
        Project details:
        ${JSON.stringify(project, null, 2)}
        
        Task summary:
        ${tasks.map(t => `- ${t.title} (${t.status})`).join('\n')}
        
        Available document context:
        ${docsContent.substring(0, 1000)}... (truncated)
        
        Below is a comprehensive list of potential sections for inclusion in the functional specification.
        Your task is to determine which sections are relevant for this specific project.
        
        Available sections:
        ${functionalSpecSections.map(section =>
          `${section.id}: "${section.title}" (${section.required ? 'Required' : 'Optional'})`
        ).join('\n')}
        
        Please analyze the project and determine:
        1. Which sections should be included in the spec
        2. If any additional custom sections should be added that are not in the list
        3. The appropriate order of sections for this specific project type
        
        For custom sections, explain why they're needed. Consider the project's domain, complexity, and specific requirements.
        
        Output your analysis as JSON with:
        - included_section_ids: array of section IDs to include
        - custom_sections: array of objects with {title, reason_needed}
        - section_order: array of all section IDs in recommended order`,
        response_json_schema: {
          type: "object",
          properties: {
            included_section_ids: {
              type: "array",
              items: { type: "string" }
            },
            custom_sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  reason_needed: { type: "string" }
                }
              }
            },
            section_order: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      // Add information about custom sections
      let customSectionsDetails = "";
      if (sectionAnalysis.custom_sections && sectionAnalysis.custom_sections.length > 0) {
        customSectionsDetails = sectionAnalysis.custom_sections.map(s =>
          `${s.title}: ${s.reason_needed}`
        ).join('\n');

        setAIThoughts(prev => [...prev, {
          step: "Custom sections analysis",
          thought: `Adding ${sectionAnalysis.custom_sections.length} custom sections based on project needs: ${sectionAnalysis.custom_sections.map(s => s.title).join(', ')}`
        }]);
      }

      // Build ordered section list
      const orderedSections = sectionAnalysis.section_order.map(id => {
        const standardSection = functionalSpecSections.find(s => s.id === id);
        if (standardSection) return standardSection.title;

        // Must be a custom section
        const customSection = sectionAnalysis.custom_sections.find(s => s.id === id || s.title.toLowerCase().replace(/\s+/g, '_') === id);
        return customSection ? customSection.title : id;
      });

      setAIThoughts(prev => [...prev, {
        step: "Document structure",
        thought: `Finalized document structure with ${orderedSections.length} sections in optimized order.`
      }]);

      // Generate the full specification with detailed content for each section
      setAIThoughts(prev => [...prev, {
        step: "Content generation",
        thought: "Generating comprehensive content for each section..."
      }]);

      const spec = await InvokeLLM({
        prompt: `Create a detailed functional specification document for the software project titled "${project.title}".
        
        Project details:
        ${JSON.stringify(project, null, 2)}
        
        Based on careful analysis of this project, the document should include the following sections in this order:
        ${orderedSections.map((title, index) => `${index + 1}. ${title}`).join('\n')}
        
        ${customSectionsDetails ? `Additional custom sections with explanations:\n${customSectionsDetails}\n` : ''}
        
        Context from project tasks:
        ${tasks.map(t => `- ${t.title} (${t.status}): ${t.description || 'No description'}`).slice(0, 20).join('\n')}
        
        Context from existing documents:
        ${docsContent.substring(0, 2000)}... (truncated)
        
        For each section:
        1. Include a clear heading formatted as "## [Section Title]"
        2. Provide comprehensive, detailed content specific to this project
        3. Include relevant subsections where appropriate
        4. Be specific and avoid generic content - refer to project details
        5. Use clear, professional language suitable for implementation by a development team
        
        The final document should be complete and ready for use by the development team to implement the system as specified.`,
      });

      setAIThoughts(prev => [...prev, {
        step: "Document finalization",
        thought: "Generating complete functional specification document"
      }]);

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
      console.error('Error generating functional specification:', error);
      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the functional specification. Please try again.'
      }]);
    }

    setGenerating(false);
    setGenerationTask('');
    setCurrentAIStep('');
    setAIThoughts([]);
  };

  const generateActionItems = async () => {
    setGenerating(true);
    setGenerationTask('actions');
    setAIThoughts([{ step: "Preparation", thought: "Analyzing project status to identify action items..." }]);

    try {
      // Get project context
      const [tasks, members, projectDocs] = await Promise.all([
        Task.filter({ project_id: project.id }),
        TeamMember.filter({ project_id: project.id }),
        Document.filter({ project_id: project.id }),
      ]);

      // Filter recent meeting notes and status updates
      const recentMeetingNotes = projectDocs.filter(d =>
        d.type === 'meeting_notes' || d.type === 'status_update'
      ).sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 3);

      const meetingContent = recentMeetingNotes.map(d =>
        `Document "${d.title}" (${d.type}):\n${d.content || 'No content available'}\n`
      ).join('\n---\n');

      setAIThoughts(prev => [...prev, {
        step: "Context analysis",
        thought: `Analyzed ${tasks.length} tasks, ${members.length} team members, and ${recentMeetingNotes.length} recent meeting documents.`
      }]);

      // First pass: Identify topics and areas that need action items
      const topicAnalysis = await InvokeLLM({
        prompt: `You're analyzing the project "${project.title}" to identify key areas that require action items.
        
        Project details:
        ${JSON.stringify(project, null, 2)}
        
        Current tasks summary:
        ${tasks.map(t => `- ${t.title} (${t.status}, priority: ${t.priority})`).join('\n')}
        
        Team composition:
        ${members.map(m => `- ${m.email} (${m.role}, ${m.seniority})`).join('\n')}
        
        Recent meeting notes and status updates:
        ${meetingContent.substring(0, 2000)}... (truncated)
        
        Based on this context, identify the key topics/areas that require action items.
        Consider:
        1. Bottlenecks and blockers in the current workflow
        2. Unassigned high-priority tasks
        3. Missing dependencies for in-progress work
        4. Issues mentioned in meeting notes
        5. Upcoming deadlines or milestones
        6. Resource allocation and team capacity
        
        For each topic, identify which team role(s) should be involved in addressing it.
        
        Output as JSON with:
        - action_topics: array of objects with {topic_name, priority, involved_roles, reason}`,
        response_json_schema: {
          type: "object",
          properties: {
            action_topics: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  topic_name: { type: "string" },
                  priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                  involved_roles: { type: "array", items: { type: "string" } },
                  reason: { type: "string" }
                }
              }
            }
          }
        }
      });

      setAIThoughts(prev => [...prev, {
        step: "Topic identification",
        thought: `Identified ${topicAnalysis.action_topics.length} key topics that need action items.`
      }]);

      // Second pass: Generate specific action items for each topic
      const actionItemsByTopic = {};
      let topicIndex = 0;

      for (const topic of topicAnalysis.action_topics) {
        setAIThoughts(prev => [...prev, {
          step: `Action items for "${topic.topic_name}"`,
          thought: `Generating specific action items for ${topic.involved_roles.join(', ')}`
        }]);

        topicIndex++;
        setCurrentAIStep(`Generating action items (${topicIndex}/${topicAnalysis.action_topics.length}): ${topic.topic_name}`);

        const topicActions = await InvokeLLM({
          prompt: `Generate specific action items for the topic "${topic.topic_name}" in project "${project.title}".
          
          Topic details:
          - Priority: ${topic.priority}
          - Involved roles: ${topic.involved_roles.join(', ')}
          - Reason needed: ${topic.reason}
          
          Project context:
          ${JSON.stringify(project, null, 2)}
          
          For this topic, create 2-4 specific, actionable tasks that address the needs identified.
          Each action item should:
          1. Have a clear, specific title starting with an action verb
          2. Include a detailed description explaining what needs to be done
          3. Assign a specific role responsible (from the involved_roles list)
          4. Set an appropriate priority level
          5. Suggest a reasonable due date (relative to today)
          6. Include any dependencies or prerequisites 
          
          Output as JSON with:
          - action_items: array of objects with detailed fields`,
          response_json_schema: {
            type: "object",
            properties: {
              action_items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    description: { type: "string" },
                    assigned_role: { type: "string" },
                    priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
                    due_timeframe: { type: "string" },
                    dependencies: { type: "array", items: { type: "string" } }
                  }
                }
              }
            }
          }
        });

        actionItemsByTopic[topic.topic_name] = {
          ...topic,
          action_items: topicActions.action_items
        };
      }

      setAIThoughts(prev => [...prev, {
        step: "Final compilation",
        thought: "Compiling all action items into a comprehensive document..."
      }]);

      // Final pass: Compile all action items into a formatted document
      const actionItemsContent = await InvokeLLM({
        prompt: `Create a comprehensive action items document for project "${project.title}" based on the analysis below.
        
        Project details:
        ${JSON.stringify(project, null, 2)}
        
        Action items by topic:
        ${JSON.stringify(actionItemsByTopic, null, 2)}
        
        Format this as a professional action items document with:
        1. A brief executive summary of the current project state
        2. Sections for each topic area, ordered by priority
        3. Clearly formatted action items within each section
        4. For each action item: title, description, assigned role, priority, timeframe, and dependencies
        5. A summary of next steps
        
        Use markdown formatting for headings, bullets, and emphasis to create a well-structured document.`,
      });

      await Document.create({
        project_id: project.id,
        title: `Action Items - ${new Date().toLocaleDateString()}`,
        type: 'status_update',
        content: actionItemsContent,
        language: 'en'
      });

      onDocumentCreate();

      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'I\'ve generated a list of prioritized action items for your project. You can find it in the Documents section.'
      }]);
    } catch (error) {
      console.error('Error generating action items:', error);
      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the action items. Please try again.'
      }]);
    }

    setGenerating(false);
    setGenerationTask('');
    setCurrentAIStep('');
    setAIThoughts([]);
  };

  const generateRiskAssessment = async () => {
    setGenerating(true);
    setGenerationTask('risks');
    setAIThoughts([{ step: "Preparation", thought: "Analyzing project for risk identification..." }]);

    try {
      // Get project context 
      const [tasks, members, projectDocs] = await Promise.all([
        Task.filter({ project_id: project.id }),
        TeamMember.filter({ project_id: project.id }),
        Document.filter({ project_id: project.id })
      ]);

      setAIThoughts(prev => [...prev, {
        step: "Context gathering",
        thought: `Retrieved ${tasks.length} tasks, ${members.length} team members, and ${projectDocs.length} documents for analysis.`
      }]);

      // Calculate task statistics for risk indicators
      const taskStats = {
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === 'done').length,
        highPriorityTasks: tasks.filter(t => t.priority === 'high' || t.priority === 'urgent').length,
        unassignedTasks: tasks.filter(t => !t.assigned_to).length,
        tasksByStatus: tasks.reduce((acc, task) => {
          acc[task.status] = (acc[task.status] || 0) + 1;
          return acc;
        }, {}),
      };

      // Add completion percentage
      taskStats.completionPercentage = taskStats.totalTasks > 0
        ? Math.round((taskStats.completedTasks / taskStats.totalTasks) * 100)
        : 0;

      // First pass: Identify risk categories and project-specific risk factors
      const riskCategoriesAnalysis = await InvokeLLM({
        prompt: `You are conducting the initial phase of a comprehensive risk assessment for the project "${project.title}".
        
        Project details:
        ${JSON.stringify(project, null, 2)}
        
        Task statistics:
        ${JSON.stringify(taskStats, null, 2)}
        
        Team composition:
        ${members.map(m => `- ${m.email} (${m.role}, ${m.seniority})`).join('\n')}
        
        Based on this context, identify the key risk categories relevant to this project.
        Standard risk categories include: Technical, Schedule, Resource, Scope, Quality, and Communication.
        
        For each category:
        1. Determine if it's applicable to this project
        2. Identify project-specific risk factors within that category
        3. Explain why these factors represent risks
        
        Think systematically about what could go wrong in each area based on the project context.
        
        Output as JSON with:
        - risk_categories: array of objects with {category, applicable, risk_factors, reasoning}`,
        response_json_schema: {
          type: "object",
          properties: {
            risk_categories: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  applicable: { type: "boolean" },
                  risk_factors: {
                    type: "array",
                    items: { type: "string" }
                  },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });

      const applicableCategories = riskCategoriesAnalysis.risk_categories
        .filter(c => c.applicable)
        .map(c => c.category);

      setAIThoughts(prev => [...prev, {
        step: "Risk category analysis",
        thought: `Identified ${applicableCategories.length} applicable risk categories: ${applicableCategories.join(', ')}`
      }]);

      // Second pass: Identify specific risks within each category
      const risksByCategory = {};
      let categoryIndex = 0;

      for (const category of riskCategoriesAnalysis.risk_categories) {
        if (!category.applicable) continue;

        categoryIndex++;
        setCurrentAIStep(`Analyzing risks (${categoryIndex}/${applicableCategories.length}): ${category.category}`);

        setAIThoughts(prev => [...prev, {
          step: `Risk identification for ${category.category}`,
          thought: `Analyzing ${category.risk_factors.length} risk factors in this category`
        }]);

        const categoryRisks = await InvokeLLM({
          prompt: `Generate specific risks for the category "${category.category}" in project "${project.title}".
          
          Category details:
          - Risk factors identified: ${category.risk_factors.join(', ')}
          - Reasoning: ${category.reasoning}
          
          Project context:
          ${JSON.stringify(project, null, 2)}
          
          For each risk factor in this category:
          1. Create a specific, detailed risk statement
          2. Assess impact (High/Medium/Low)
          3. Assess probability (High/Medium/Low)
          4. Calculate risk level (H+H=High, H+M=High, M+M=Medium, etc.)
          5. Provide a detailed mitigation strategy
          6. Suggest a contingency plan if the risk occurs
          7. Identify who should be responsible for monitoring this risk
          
          Output as JSON with:
          - risks: array of objects with detailed fields`,
          response_json_schema: {
            type: "object",
            properties: {
              risks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    risk_statement: { type: "string" },
                    impact: { type: "string", enum: ["Low", "Medium", "High"] },
                    probability: { type: "string", enum: ["Low", "Medium", "High"] },
                    risk_level: { type: "string", enum: ["Low", "Medium", "High"] },
                    mitigation_strategy: { type: "string" },
                    contingency_plan: { type: "string" },
                    responsible_role: { type: "string" }
                  }
                }
              }
            }
          }
        });

        risksByCategory[category.category] = {
          ...category,
          risks: categoryRisks.risks
        };
      }

      // Third pass: Prioritize risks across all categories
      setAIThoughts(prev => [...prev, {
        step: "Risk prioritization",
        thought: "Prioritizing risks across all categories and performing final analysis"
      }]);

      const riskPrioritization = await InvokeLLM({
        prompt: `Review and prioritize all identified risks across categories for project "${project.title}".
        
        Risk analysis by category:
        ${JSON.stringify(risksByCategory, null, 2)}
        
        Based on all risks identified across categories:
        1. Identify the top 3-5 most critical risks that need immediate attention
        2. Assess the overall risk profile of the project (High/Medium/Low)
        3. Identify any common themes or interdependencies between risks
        4. Suggest an overall risk management approach for the project
        
        Output as JSON with:
        - top_risks: array of the most critical risks
        - overall_risk_level: string
        - risk_themes: array of common themes
        - overall_approach: string`,
        response_json_schema: {
          type: "object",
          properties: {
            top_risks: { type: "array", items: { type: "object" } },
            overall_risk_level: { type: "string" },
            risk_themes: { type: "array", items: { type: "string" } },
            overall_approach: { type: "string" }
          }
        }
      });

      // Final pass: Generate the full risk assessment document
      const riskAssessment = await InvokeLLM({
        prompt: `Create a comprehensive risk assessment document for the project "${project.title}" based on the analysis below.
        
        Project details:
        ${JSON.stringify(project, null, 2)}
        
        Detailed risk analysis:
        ${JSON.stringify(risksByCategory, null, 2)}
        
        Risk prioritization:
        ${JSON.stringify(riskPrioritization, null, 2)}
        
        Format this as a professional risk assessment document with:
        1. Executive Summary
           - Overall risk profile: ${riskPrioritization.overall_risk_level}
           - Top risks summary
           - Key risk themes: ${riskPrioritization.risk_themes.join(', ')}
        
        2. Project Context
           - Brief project description
           - Current state and progress
        
        3. Risk Assessment Methodology
           - Approach used
           - Risk evaluation criteria
        
        4. Detailed Risk Analysis
           - Sections for each risk category
           - Tables for risks showing all details
           - Prioritization within categories
        
        5. Top Project Risks
           - Detailed analysis of the most critical risks
           - Immediate action recommendations
        
        6. Risk Management Strategy
           - Overall approach: ${riskPrioritization.overall_approach}
           - Monitoring and control procedures
           - Escalation paths
        
        7. Conclusion and Recommendations
        
        Use markdown formatting for headings, tables, and emphasis to create a well-structured document.`,
      });

      setAIThoughts(prev => [...prev, {
        step: "Document creation",
        thought: "Finalizing comprehensive risk assessment document"
      }]);

      await Document.create({
        project_id: project.id,
        title: `Risk Assessment - ${project.title}`,
        type: 'specification',
        content: riskAssessment,
        language: 'en'
      });

      onDocumentCreate();

      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'I\'ve generated a risk assessment document for your project. You can find it in the Documents section.'
      }]);
    } catch (error) {
      console.error('Error generating risk assessment:', error);
      setMessageHistory(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error generating the risk assessment. Please try again.'
      }]);
    }

    setGenerating(false);
    setGenerationTask('');
    setCurrentAIStep('');
    setAIThoughts([]);
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
        <Tabs defaultValue="assistant" className="mb-4">
          <TabsList>
            <TabsTrigger value="assistant">Assistant</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="assistant">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 mb-4">
                <Select
                  value={documentSelectionMode}
                  onValueChange={setDocumentSelectionMode}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Document Selection Mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Documents</SelectItem>
                    <SelectItem value="manual">Manual Selection</SelectItem>
                    <SelectItem value="ai">AI Selection</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
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

                {generating && generationTask && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 space-y-2 max-w-[80%]">
                      <div className="flex items-center">
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        <span>
                          {currentAIStep || `Generating ${generationTask}...`}
                        </span>
                      </div>

                      {AIThoughts.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                          <div className="font-medium mb-1">AI Thought Process:</div>
                          {AIThoughts.map((thought, idx) => (
                            <div key={idx} className="mb-1">
                              <span className="font-medium">{thought.step}:</span> {thought.thought}
                            </div>
                          ))}
                        </div>
                      )}
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
            </div>
          </TabsContent>

          <TabsContent value="documents">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <label className="text-sm font-medium">Include Document Content</label>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="include-document"
                    checked={includeSelectedDocument}
                    onCheckedChange={setIncludeSelectedDocument}
                  />
                  <label htmlFor="include-document" className="text-sm">
                    Include content from selected document in generation
                  </label>
                </div>

                <Select
                  value={selectedDocument}
                  onValueChange={setSelectedDocument}
                  disabled={!includeSelectedDocument}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select document" />
                  </SelectTrigger>
                  <SelectContent>
                    {documents.map(doc => (
                      <SelectItem key={doc.id} value={doc.id}>
                        <div className="flex items-center">
                          {doc.type === 'audio' ? (
                            <AudioWaveform className="mr-2 h-4 w-4" />
                          ) : doc.type === 'video' ? (
                            <Video className="mr-2 h-4 w-4" />
                          ) : (
                            <File className="mr-2 h-4 w-4" />
                          )}
                          {doc.title}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-gray-500 mt-1">
                  For audio/video files, the AI will automatically transcribe the content.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium mb-2">Available Project Documents</h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2 border rounded hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          {doc.type === 'audio' ? (
                            <AudioWaveform className="mr-2 h-4 w-4" />
                          ) : doc.type === 'video' ? (
                            <Video className="mr-2 h-4 w-4" />
                          ) : doc.type === 'meeting_notes' ? (
                            <FileText className="mr-2 h-4 w-4" />
                          ) : (
                            <File className="mr-2 h-4 w-4" />
                          )}
                          <div>
                            <div className="text-sm font-medium">{doc.title}</div>
                            <div className="text-xs text-gray-500">{doc.type}</div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(doc.id);
                            setIncludeSelectedDocument(true);
                          }}
                        >
                          Select
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
