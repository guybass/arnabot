import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { MessageSquare, Star, Bug, Lightbulb, ThumbsUp, AlertTriangle } from 'lucide-react';
import { PageFeedback, User } from '@/api/entities';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';

const PAGE_SPECIFIC_QUESTIONS = {
  'Dashboard': [
    { key: 'metrics_useful', label: 'Are the displayed metrics useful for your work?' },
    { key: 'missing_info', label: 'What information would you like to see on the dashboard?' }
  ],
  'TaskManager': [
    { key: 'task_creation', label: 'How easy is it to create and manage tasks?' },
    { key: 'view_preference', label: 'Which view do you use most often (Table/Kanban)?' },
    { key: 'features_usage', label: 'Which features do you use the most?' }
  ],
  'ProjectDashboard': [
    { key: 'project_overview', label: 'Is the project overview providing all necessary information?' },
    { key: 'team_collaboration', label: 'How well does the dashboard support team collaboration?' }
  ],
  'TeamManagement': [
    { key: 'team_organization', label: 'How effective is the team organization system?' },
    { key: 'member_management', label: 'Is managing team members straightforward?' }
  ],
  'Navigation': [
    { key: 'navigation_ease', label: 'How easy is it to navigate between different sections?' },
    { key: 'feature_discovery', label: 'Can you easily find all features you need?' }
  ]
};

export default function FeedbackButton({ pageName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('feedback');
  const [feedback, setFeedback] = useState({
    rating: 5,
    feedback_type: 'general',
    description: '',
    page_specific_answers: {}
  });
  const [bugReport, setBugReport] = useState({
    title: '',
    severity: 'minor',
    steps: '',
    expected: '',
    actual: '',
    screenshot_url: ''
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const user = await User.me();
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading current user:", error);
    }
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    try {
      await PageFeedback.create({
        ...feedback,
        page_name: pageName,
        user_email: currentUser?.email,
        browser_info: navigator.userAgent,
      });
      setIsOpen(false);
      setFeedback({
        rating: 5,
        feedback_type: 'general',
        description: '',
        page_specific_answers: {}
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
    }
    setIsSubmitting(false);
  };

  const handleSubmitBugReport = async () => {
    setIsSubmitting(true);
    try {
      await PageFeedback.create({
        feedback_type: 'bug',
        rating: 1,
        description: `Bug: ${bugReport.title}\n\nSeverity: ${bugReport.severity}\n\nSteps to Reproduce: ${bugReport.steps}\n\nExpected Result: ${bugReport.expected}\n\nActual Result: ${bugReport.actual}`,
        page_name: pageName,
        user_email: currentUser?.email,
        browser_info: navigator.userAgent,
        is_bug_report: true
      });
      setIsOpen(false);
      setBugReport({
        title: '',
        severity: 'minor',
        steps: '',
        expected: '',
        actual: '',
        screenshot_url: ''
      });
    } catch (error) {
      console.error("Error submitting bug report:", error);
    }
    setIsSubmitting(false);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'bug':
        return <Bug className="w-4 h-4" />;
      case 'feature_request':
        return <Lightbulb className="w-4 h-4" />;
      case 'user_experience':
        return <ThumbsUp className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  return (
    <>
      <div className="fixed bottom-4 right-4 flex flex-col space-y-2">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            setIsOpen(true);
            setActiveTab('bug');
          }}
          className="shadow-lg"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          Report Issue
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsOpen(true);
            setActiveTab('feedback');
          }}
          className="shadow-lg bg-white"
        >
          <MessageSquare className="w-4 h-4 mr-2" />
          Feedback
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Share Your Thoughts</DialogTitle>
            <DialogDescription>
              Help us improve by sharing your feedback or reporting issues.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="feedback">
                <MessageSquare className="w-4 h-4 mr-2" />
                Feedback
              </TabsTrigger>
              <TabsTrigger value="bug">
                <Bug className="w-4 h-4 mr-2" />
                Report Issue
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="feedback" className="space-y-4">
              <ScrollArea className="h-[50vh] pr-4">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          variant={feedback.rating === rating ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFeedback({ ...feedback, rating })}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              feedback.rating >= rating ? 'fill-current' : ''
                            }`}
                          />
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Feedback Type</label>
                    <Select
                      value={feedback.feedback_type}
                      onValueChange={(value) =>
                        setFeedback({ ...feedback, feedback_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature_request">
                          <div className="flex items-center">
                            <Lightbulb className="w-4 h-4 mr-2" />
                            Feature Request
                          </div>
                        </SelectItem>
                        <SelectItem value="user_experience">
                          <div className="flex items-center">
                            <ThumbsUp className="w-4 h-4 mr-2" />
                            User Experience
                          </div>
                        </SelectItem>
                        <SelectItem value="general">
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            General Feedback
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={feedback.description}
                      onChange={(e) =>
                        setFeedback({ ...feedback, description: e.target.value })
                      }
                      placeholder="Tell us more about your feedback..."
                      className="min-h-[100px]"
                    />
                  </div>

                  {PAGE_SPECIFIC_QUESTIONS[pageName] && (
                    <div className="space-y-4">
                      <label className="text-sm font-medium">Additional Questions</label>
                      {PAGE_SPECIFIC_QUESTIONS[pageName].map((question) => (
                        <div key={question.key} className="space-y-2">
                          <label className="text-sm text-gray-600">
                            {question.label}
                          </label>
                          <Textarea
                            value={feedback.page_specific_answers[question.key] || ''}
                            onChange={(e) =>
                              setFeedback({
                                ...feedback,
                                page_specific_answers: {
                                  ...feedback.page_specific_answers,
                                  [question.key]: e.target.value,
                                },
                              })
                            }
                            placeholder="Your answer..."
                            className="min-h-[60px]"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmitFeedback} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </Button>
              </DialogFooter>
            </TabsContent>
            
            <TabsContent value="bug" className="space-y-4">
              <ScrollArea className="h-[50vh] pr-4">
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Issue Title</label>
                    <Input
                      value={bugReport.title}
                      onChange={(e) =>
                        setBugReport({ ...bugReport, title: e.target.value })
                      }
                      placeholder="Brief description of the issue"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Severity</label>
                    <Select
                      value={bugReport.severity}
                      onValueChange={(value) =>
                        setBugReport({ ...bugReport, severity: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="critical">
                          <div className="flex items-center">
                            <Badge className="bg-red-500 mr-2">Critical</Badge>
                            Application crash or data loss
                          </div>
                        </SelectItem>
                        <SelectItem value="major">
                          <div className="flex items-center">
                            <Badge className="bg-orange-500 mr-2">Major</Badge>
                            Feature doesn't work
                          </div>
                        </SelectItem>
                        <SelectItem value="minor">
                          <div className="flex items-center">
                            <Badge className="bg-yellow-500 mr-2">Minor</Badge>
                            Feature works but has problems
                          </div>
                        </SelectItem>
                        <SelectItem value="trivial">
                          <div className="flex items-center">
                            <Badge className="bg-blue-500 mr-2">Trivial</Badge>
                            Visual or minor issues
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Steps to Reproduce</label>
                    <Textarea
                      value={bugReport.steps}
                      onChange={(e) =>
                        setBugReport({ ...bugReport, steps: e.target.value })
                      }
                      placeholder="1. Go to page X
2. Click on Y
3. Enter Z"
                      className="min-h-[100px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Expected Result</label>
                    <Textarea
                      value={bugReport.expected}
                      onChange={(e) =>
                        setBugReport({ ...bugReport, expected: e.target.value })
                      }
                      placeholder="What should have happened?"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Actual Result</label>
                    <Textarea
                      value={bugReport.actual}
                      onChange={(e) =>
                        setBugReport({ ...bugReport, actual: e.target.value })
                      }
                      placeholder="What actually happened?"
                    />
                  </div>
                </div>
              </ScrollArea>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={handleSubmitBugReport} 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Report Issue'}
                </Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}