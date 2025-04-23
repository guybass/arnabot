export const FUNCTIONAL_SPEC_SECTIONS = [
  // Core sections
  {
    id: "introduction",
    title: "Introduction",
    required: true,
    description: "Project overview and document purpose",
    common_subsections: ["Purpose", "Scope", "Document Conventions"]
  },
  {
    id: "executive_summary",
    title: "Executive Summary",
    required: true,
    description: "Brief overview of the key points and decisions"
  },
  {
    id: "definitions",
    title: "Definitions, Acronyms, and Abbreviations",
    required: true,
    description: "Key terms and concepts used throughout the document"
  },
  {
    id: "system_overview",
    title: "System Overview",
    required: true,
    description: "High-level description of the system architecture and components"
  },
  
  // Requirements sections
  {
    id: "functional_req",
    title: "Functional Requirements",
    required: true,
    description: "Detailed system functionality requirements",
    common_subsections: ["User Features", "System Features", "APIs", "Database Requirements"]
  },
  {
    id: "user_req",
    title: "User Requirements",
    required: true,
    description: "User-specific needs and expectations"
  },
  {
    id: "business_req",
    title: "Business Requirements",
    required: false,
    description: "Business goals and objectives"
  },
  
  // Technical sections
  {
    id: "arch_overview",
    title: "System Architecture Overview",
    required: true,
    description: "Detailed technical architecture",
    common_subsections: ["Component Diagram", "Data Flow", "Integration Points"]
  },
  {
    id: "data_models",
    title: "Data Models and Database Design",
    required: false,
    description: "Database schema and data relationships"
  },
  {
    id: "api_specs",
    title: "API Specifications",
    required: false,
    description: "Detailed API documentation"
  },
  
  // UI/UX sections
  {
    id: "user_interfaces",
    title: "User Interfaces",
    required: false,
    description: "UI design specifications and wireframes"
  },
  {
    id: "ux_workflows",
    title: "User Experience Workflows",
    required: false,
    description: "User journey maps and interaction flows"
  },
  
  // Non-functional sections
  {
    id: "performance_req",
    title: "Performance Requirements",
    required: false,
    description: "System performance specifications"
  },
  {
    id: "security_req",
    title: "Security Requirements",
    required: false,
    description: "Security specifications and compliance requirements"
  },
  
  // Implementation sections
  {
    id: "dev_approach",
    title: "Development Approach",
    required: false,
    description: "Development methodology and practices"
  },
  {
    id: "testing_strategy",
    title: "Testing Strategy",
    required: true,
    description: "Testing approach and requirements"
  },
  
  // Project management sections
  {
    id: "milestones",
    title: "Milestones and Deliverables",
    required: false,
    description: "Project timeline and key deliverables"
  },
  {
    id: "risks",
    title: "Risks and Mitigations",
    required: false,
    description: "Identified risks and mitigation strategies"
  }
];

export const ACTION_ITEMS_SECTIONS = [
  {
    id: "immediate_actions",
    title: "Immediate Actions",
    required: true,
    description: "Tasks requiring immediate attention",
    stakeholders: ["Project Manager", "Team Leads"],
    priority: "high"
  },
  {
    id: "technical_tasks",
    title: "Technical Implementation Tasks",
    required: false,
    description: "Development and technical tasks",
    stakeholders: ["Developers", "Architects"],
    priority: "medium"
  },
  {
    id: "design_tasks",
    title: "Design and UX Tasks",
    required: false,
    description: "Design-related action items",
    stakeholders: ["Designers", "UX Specialists"],
    priority: "medium"
  },
  {
    id: "review_tasks",
    title: "Review and Testing Tasks",
    required: true,
    description: "QA and review-related tasks",
    stakeholders: ["QA Team", "Reviewers"],
    priority: "high"
  },
  {
    id: "documentation_tasks",
    title: "Documentation Tasks",
    required: false,
    description: "Documentation-related action items",
    stakeholders: ["Technical Writers", "Team Leads"],
    priority: "medium"
  },
  {
    id: "management_tasks",
    title: "Management Tasks",
    required: true,
    description: "Project management action items",
    stakeholders: ["Project Manager", "Product Owner"],
    priority: "high"
  },
  {
    id: "communication_tasks",
    title: "Communication Tasks",
    required: true,
    description: "Stakeholder communication items",
    stakeholders: ["Project Manager", "Team Leads"],
    priority: "medium"
  },
  {
    id: "dependencies",
    title: "External Dependencies",
    required: false,
    description: "Tasks depending on external factors",
    stakeholders: ["Project Manager", "Team Leads"],
    priority: "high"
  },
  {
    id: "decisions_needed",
    title: "Decisions Needed",
    required: true,
    description: "Items requiring stakeholder decisions",
    stakeholders: ["Stakeholders", "Project Manager"],
    priority: "high"
  }
];

export const DOCUMENT_ANALYSIS_PROMPTS = {
  relevance_assessment: `Analyze the relevance of this document to the current context:
  1. How recent is this document?
  2. Does it contain information directly related to the current topic?
  3. Are there any conflicts with other known information?
  4. What unique insights does this document provide?
  
  Rate relevance on a scale of 1-5 and explain why.`,
  
  key_points_extraction: `Extract the key points from this document that are most relevant to the current context:
  1. What are the main decisions or conclusions?
  2. What actions were taken or planned?
  3. What problems or challenges were identified?
  4. What solutions were proposed?`,
  
  stakeholder_impact: `Analyze how this document affects different stakeholders:
  1. Which team members are mentioned or impacted?
  2. What actions are required from specific roles?
  3. Are there any dependencies on specific individuals?
  4. What follow-up is needed and by whom?`
};

// Create a default export that combines all the constants
const HeadersDatabase = {
  FUNCTIONAL_SPEC_SECTIONS,
  ACTION_ITEMS_SECTIONS,
  DOCUMENT_ANALYSIS_PROMPTS
};

export default HeadersDatabase;