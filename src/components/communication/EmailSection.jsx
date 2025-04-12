
import React, { useState, useEffect } from 'react';
import { Email, TeamMember, User } from '@/api/entities';
import { InvokeLLM, SendEmail as SendEmailIntegration } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Plus, 
  Send, 
  User as UserIcon,
  Users,
  Clock,
  ChevronRight,
  PaperclipIcon,
  Eye,
  Edit,
  MessageSquare,
  Reply,
  Trash,
  Loader2,
  Copy,
  Sparkles,
  X
} from 'lucide-react';
import { format } from 'date-fns';

export default function EmailSection({ project }) {
  const [emails, setEmails] = useState([]);
  const [showNewEmail, setShowNewEmail] = useState(false);
  const [showEmailDetail, setShowEmailDetail] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newEmail, setNewEmail] = useState({
    project_id: project?.id,
    subject: '',
    body: '',
    sender: '',
    recipients: [],
    cc: [],
    status: 'draft',
    conversation_id: null
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationEmails, setConversationEmails] = useState([]);
  const [tab, setTab] = useState('all');
  const [replyContent, setReplyContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    if (project) {
      loadEmails();
      loadTeamMembers();
      loadCurrentUser();
    }
  }, [project]);

  useEffect(() => {
    if (selectedEmail?.conversation_id) {
      loadConversation(selectedEmail.conversation_id);
    } else {
      setConversationEmails([]);
    }
  }, [selectedEmail]);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const loadEmails = async () => {
    const projectEmails = await Email.filter({ project_id: project.id }, '-sent_date');
    setEmails(projectEmails);
  };

  const loadTeamMembers = async () => {
    const members = await TeamMember.filter({ project_id: project.id });
    setTeamMembers(members);
  };

  const loadConversation = async (conversationId) => {
    const conversation = await Email.filter({ conversation_id: conversationId }, 'sent_date');
    setConversationEmails(conversation);
  };

  const createEmail = async (status = 'draft') => {
    const timestamp = new Date().toISOString();
    let conversationId = newEmail.conversation_id;
    
    if (!conversationId && status === 'sent') {
      // Create new conversation ID for new threads
      conversationId = `conv-${Date.now()}`;
    }
    
    const emailToCreate = {
      ...newEmail,
      sent_date: status === 'sent' ? timestamp : null,
      status,
      conversation_id: conversationId,
      sender: currentUser?.email || newEmail.sender
    };
    
    // If sending, actually send the email
    if (status === 'sent') {
      setIsSending(true);
      try {
        await Promise.all(newEmail.recipients.map(recipient => 
          SendEmailIntegration({
            to: recipient,
            subject: newEmail.subject,
            body: newEmail.body
          })
        ));
      } catch (error) {
        console.error("Error sending email:", error);
      }
      setIsSending(false);
    }
    
    await Email.create(emailToCreate);
    
    setShowNewEmail(false);
    resetEmailForm();
    loadEmails();
  };

  const resetEmailForm = () => {
    setNewEmail({
      project_id: project?.id,
      subject: '',
      body: '',
      sender: currentUser?.email || '',
      recipients: [],
      cc: [],
      status: 'draft',
      conversation_id: null
    });
  };

  const viewEmail = (email) => {
    setSelectedEmail(email);
    setShowEmailDetail(true);
  };

  const deleteEmail = async () => {
    if (selectedEmail) {
      await Email.delete(selectedEmail.id);
      setShowEmailDetail(false);
      setSelectedEmail(null);
      setIsDeleteConfirmOpen(false);
      loadEmails();
    }
  };

  const generateEmail = async (type) => {
    setIsGenerating(true);
    
    let prompt;
    
    switch (type) {
      case 'status':
        prompt = `Generate a professional project status update email for the following project:
        
        Project: ${project.title}
        Description: ${project.description || 'No description provided'}
        Current Status: ${project.status}
        
        Include:
        1. A professional greeting
        2. A brief overview of the project status
        3. Key accomplishments since the last update
        4. Current challenges or blockers
        5. Next steps
        6. A professional closing
        
        Format this as a complete, ready-to-send email with a subject line and body.`;
        break;
        
      case 'meeting':
        prompt = `Generate a professional meeting invitation email for the ${project.title} project.
        
        Include:
        1. A clear subject line indicating it's a meeting invitation
        2. A professional greeting
        3. The purpose of the meeting
        4. Suggested agenda items
        5. A request for the recipient to confirm their availability
        6. A professional closing
        
        Format this as a complete, ready-to-send email with a subject line and body.`;
        break;
        
      case 'follow_up':
        prompt = `Generate a professional follow-up email for the ${project.title} project.
        
        Include:
        1. A clear subject line indicating it's a follow-up
        2. A professional greeting with reference to a previous interaction
        3. A summary of what was discussed previously
        4. Clear next steps and action items
        5. A request for confirmation or feedback
        6. A professional closing
        
        Format this as a complete, ready-to-send email with a subject line and body.`;
        break;
        
      default:
        prompt = `Generate a professional email for the ${project.title} project.`;
    }
    
    try {
      const response = await InvokeLLM({ prompt });
      
      // Extract subject and body
      let subject = '';
      let body = '';
      
      // Basic parsing - looking for Subject: line
      const lines = response.split('\n');
      const subjectLine = lines.find(line => line.toLowerCase().startsWith('subject:'));
      
      if (subjectLine) {
        subject = subjectLine.slice(8).trim();
        // Body is everything after the subject line
        const bodyStart = lines.indexOf(subjectLine) + 1;
        body = lines.slice(bodyStart).join('\n').trim();
      } else {
        // If no subject found, make an educated guess
        subject = type === 'status' ? 'Project Status Update' : 
                 type === 'meeting' ? 'Meeting Invitation' : 
                 'Project Update';
        body = response;
      }
      
      setNewEmail(prev => ({
        ...prev,
        subject,
        body
      }));
      
      setShowNewEmail(true);
    } catch (error) {
      console.error("Error generating email:", error);
    }
    
    setIsGenerating(false);
  };

  const replyToEmail = async () => {
    if (!selectedEmail || !replyContent) return;
    
    setIsSending(true);
    
    const replyEmail = {
      project_id: project.id,
      subject: `Re: ${selectedEmail.subject}`,
      body: replyContent,
      sender: currentUser?.email || '',
      recipients: [selectedEmail.sender],
      cc: [],
      status: 'sent',
      conversation_id: selectedEmail.conversation_id || `conv-${Date.now()}`,
      sent_date: new Date().toISOString()
    };
    
    try {
      // Actually send the email
      await SendEmailIntegration({
        to: selectedEmail.sender,
        subject: `Re: ${selectedEmail.subject}`,
        body: replyContent
      });
      
      // Store it in our system
      await Email.create(replyEmail);
      
      // Reset and refresh
      setReplyContent('');
      loadEmails();
      if (selectedEmail.conversation_id) {
        loadConversation(selectedEmail.conversation_id);
      }
    } catch (error) {
      console.error("Error sending reply:", error);
    }
    
    setIsSending(false);
  };

  const filteredEmails = emails.filter(email => {
    // First filter by tab
    if (tab === 'sent' && email.status !== 'sent') return false;
    if (tab === 'drafts' && email.status !== 'draft') return false;
    
    // Then filter by search query
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(query) ||
      email.body?.toLowerCase().includes(query) ||
      email.sender?.toLowerCase().includes(query) ||
      email.recipients?.some(r => r.toLowerCase().includes(query))
    );
  });

  // Group emails by conversation
  const conversations = {};
  filteredEmails.forEach(email => {
    const conversationId = email.conversation_id || email.id;
    if (!conversations[conversationId]) {
      conversations[conversationId] = [];
    }
    conversations[conversationId].push(email);
  });

  // Sort conversations to show the most recent first
  const sortedConversations = Object.values(conversations).sort((a, b) => {
    const aDate = a.find(e => e.sent_date)?.sent_date || a[0].created_date;
    const bDate = b.find(e => e.sent_date)?.sent_date || b[0].created_date;
    return new Date(bDate) - new Date(aDate);
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Emails
        </CardTitle>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => generateEmail('status')}
            className="text-xs md:text-sm"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            Status Update
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => generateEmail('meeting')}
            className="text-xs md:text-sm"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-1" />
            )}
            Meeting
          </Button>
          <Button onClick={() => setShowNewEmail(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Email
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Tabs defaultValue="all" value={tab} onValueChange={setTab} className="w-full">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="sent">Sent</TabsTrigger>
                <TabsTrigger value="drafts">Drafts</TabsTrigger>
              </TabsList>
              <div className="mt-4">
                <Input
                  placeholder="Search emails..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-sm"
                />
              </div>
            </Tabs>
          </div>

          <div className="space-y-2">
            {sortedConversations.map((conversation, index) => {
              // Get the most recent email in the conversation to display
              const latestEmail = conversation.sort((a, b) => 
                new Date(b.sent_date || b.created_date) - 
                new Date(a.sent_date || a.created_date)
              )[0];
              
              return (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => viewEmail(latestEmail)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="font-medium">{latestEmail.subject}</span>
                      <span className="text-sm text-gray-500 line-clamp-1">
                        {latestEmail.body.substring(0, 100)}...
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant={latestEmail.status === 'draft' ? 'outline' : 'default'}>
                        {latestEmail.status}
                      </Badge>
                      <span className="text-xs text-gray-500 mt-1">
                        {latestEmail.sent_date 
                          ? format(new Date(latestEmail.sent_date), 'MMM d, h:mm a')
                          : format(new Date(latestEmail.created_date), 'MMM d, h:mm a')}
                      </span>
                    </div>
                  </div>
                  <div className="flex justify-between mt-2 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <UserIcon className="w-3 h-3" />
                      <span>{latestEmail.sender}</span>
                    </div>
                    {conversation.length > 1 && (
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        <span>{conversation.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>

      {/* Compose New Email Dialog */}
      <Dialog open={showNewEmail} onOpenChange={setShowNewEmail}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Compose Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <Input
                value={currentUser?.email || newEmail.sender}
                onChange={(e) => setNewEmail({ ...newEmail, sender: e.target.value })}
                placeholder="Your email address"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <div className="flex flex-wrap gap-2 border p-2 rounded-md min-h-9">
                {newEmail.recipients.map((recipient, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {recipient}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0"
                      onClick={() => setNewEmail({
                        ...newEmail,
                        recipients: newEmail.recipients.filter((_, i) => i !== index)
                      })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
                <Input
                  className="flex-1 min-w-[100px] border-none shadow-none focus-visible:ring-0"
                  placeholder="Add recipient email address"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.target.value) {
                      e.preventDefault();
                      setNewEmail({
                        ...newEmail,
                        recipients: [...newEmail.recipients, e.target.value.trim()]
                      });
                      e.target.value = '';
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Team Members:</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {teamMembers.map((member) => (
                  <Badge
                    key={member.id}
                    variant={newEmail.recipients.includes(member.email) ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => {
                      if (newEmail.recipients.includes(member.email)) {
                        setNewEmail({
                          ...newEmail,
                          recipients: newEmail.recipients.filter(r => r !== member.email)
                        });
                      } else {
                        setNewEmail({
                          ...newEmail,
                          recipients: [...newEmail.recipients, member.email]
                        });
                      }
                    }}
                  >
                    {member.email}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Subject:</label>
              <Input
                value={newEmail.subject}
                onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                placeholder="Email subject"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Message:</label>
              <Textarea
                value={newEmail.body}
                onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                placeholder="Type your message here..."
                className="min-h-[200px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => createEmail('draft')}>
              Save as Draft
            </Button>
            <Button 
              onClick={() => createEmail('sent')}
              disabled={!newEmail.subject || !newEmail.body || newEmail.recipients.length === 0 || isSending}
              className="flex items-center gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Email
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Detail Dialog */}
      <Dialog open={showEmailDetail} onOpenChange={setShowEmailDetail}>
        <DialogContent className="max-w-4xl">
          {selectedEmail && (
            <>
              <DialogHeader>
                <div className="flex justify-between">
                  <DialogTitle>{selectedEmail.subject}</DialogTitle>
                  <div className="flex gap-2">
                    {selectedEmail.status === 'draft' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setNewEmail({
                            ...selectedEmail,
                            project_id: project.id
                          });
                          setShowEmailDetail(false);
                          setShowNewEmail(true);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setIsDeleteConfirmOpen(true)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">From:</span>
                    <span>{selectedEmail.sender}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {selectedEmail.sent_date 
                      ? format(new Date(selectedEmail.sent_date), 'MMM d, yyyy h:mm a')
                      : format(new Date(selectedEmail.created_date), 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="font-medium">To:</span>
                  <div className="flex flex-wrap gap-1">
                    {selectedEmail.recipients?.map((recipient, index) => (
                      <Badge key={index} variant="secondary">
                        {recipient}
                      </Badge>
                    ))}
                  </div>
                </div>
                {selectedEmail.cc?.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span className="font-medium">CC:</span>
                    <div className="flex flex-wrap gap-1">
                      {selectedEmail.cc.map((cc, index) => (
                        <Badge key={index} variant="secondary">
                          {cc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="border-t pt-4">
                  <div className="prose max-w-none">
                    {selectedEmail.body.split('\n').map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </div>
                
                {/* Show conversation thread if it exists */}
                {conversationEmails.length > 1 && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium text-lg mb-4">Conversation History</h3>
                    <div className="space-y-4">
                      {conversationEmails
                        .filter(email => email.id !== selectedEmail.id)
                        .sort((a, b) => new Date(b.sent_date || b.created_date) - new Date(a.sent_date || a.created_date))
                        .map(email => (
                          <div key={email.id} className="border-l-4 border-gray-200 pl-4 py-2">
                            <div className="flex justify-between items-center text-sm text-gray-500">
                              <div>
                                <span className="font-medium">{email.sender}</span>
                                <span className="mx-2">•</span>
                                <span>
                                  {email.sent_date 
                                    ? format(new Date(email.sent_date), 'MMM d, yyyy h:mm a')
                                    : format(new Date(email.created_date), 'MMM d, yyyy h:mm a')}
                                </span>
                              </div>
                            </div>
                            <div className="mt-2 prose-sm max-w-none text-gray-700">
                              {email.body.split('\n').slice(0, 3).map((line, i) => (
                                <p key={i}>{line}</p>
                              ))}
                              {email.body.split('\n').length > 3 && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-blue-500"
                                  onClick={() => {
                                    setSelectedEmail(email);
                                  }}
                                >
                                  Show more
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
                
                {/* Reply section */}
                {selectedEmail.status === 'sent' && (
                  <div className="border-t pt-4">
                    <h3 className="font-medium mb-2">Reply</h3>
                    <Textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Type your reply here..."
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end mt-2">
                      <Button
                        onClick={replyToEmail}
                        disabled={!replyContent || isSending}
                        className="flex items-center gap-2"
                      >
                        {isSending ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Reply className="w-4 h-4" />
                            Send Reply
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete this email? This action cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={deleteEmail}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
