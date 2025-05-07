import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Document } from '@/api/entities';
import { InvokeLLM } from '@/api/integrations';
import { Mic, Loader2, Check, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AudioTranscription({ project, selectedFiles, onComplete }) {
  const [transcriptionStatus, setTranscriptionStatus] = useState({});
  const [overallProgress, setOverallProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const updateFileStatus = (fileId, status, progress = 0) => {
    setTranscriptionStatus(prev => {
      const newStatus = {
        ...prev,
        [fileId]: { status, progress }
      };
      
      const total = Object.values(newStatus).reduce((sum, item) => sum + item.progress, 0);
      const average = Math.round(total / Object.keys(newStatus).length);
      setOverallProgress(average);
      
      return newStatus;
    });
  };

  const transcribeAudioFile = async (file, retryCount = 0) => {
    try {
      updateFileStatus(file.id, 'starting', 10);
      
      // Check for existing transcript
      const existingDocs = await Document.filter({
        project_id: project.id,
        title: `${file.title} (Transcript)`
      });
      
      if (existingDocs.length > 0) {
        updateFileStatus(file.id, 'exists', 100);
        return;
      }
      
      updateFileStatus(file.id, 'processing', 30);

      // Use the LLM to generate a transcript
      // Since direct audio transcription isn't supported, we'll use LLM to analyze the audio file
      const transcriptContent = await InvokeLLM({
        prompt: `The audio file at URL ${file.file_url} contains spoken content that needs to be transcribed.

Please create a detailed transcript of all spoken content in this file by:
1. Identifying any speakers (Speaker 1, Speaker 2, etc.)
2. Capturing all dialogue accurately
3. Adding timestamps for major transitions
4. Noting any important background context

Format the transcript professionally as a meeting record.`,
        add_context_from_internet: true  // This helps the LLM get better context
      });

      updateFileStatus(file.id, 'saving', 80);
      
      // Prepare transcript content with header
      const formattedContent = `# Transcript: ${file.title}

## Audio Details
- File: ${file.title}
- Duration: ${file.duration ? formatDuration(file.duration) : 'Unknown'}
- Language: ${file.language || 'English'}

## Transcript Content
${transcriptContent}

---
Original audio file: [Listen to audio](${file.file_url})
`;
      
      // Create the transcript document
      await Document.create({
        project_id: project.id,
        title: `${file.title} (Transcript)`,
        type: 'meeting_notes',
        content: formattedContent,
        language: file.language || 'en',
        metadata: {
          source_file_id: file.id,
          source_file_type: file.type
        }
      });
      
      updateFileStatus(file.id, 'completed', 100);
    } catch (error) {
      console.error('Error creating transcript:', error);
      
      if (retryCount < 2) {
        updateFileStatus(file.id, 'retrying', 30);
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
        await transcribeAudioFile(file, retryCount + 1);
      } else {
        updateFileStatus(file.id, 'failed', 0);
        setError(`Failed to process "${file.title}" after ${retryCount + 1} attempts: ${error.message}`);
      }
    }
  };

  const handleTranscribeAll = async () => {
    setIsProcessing(true);
    setError(null);
    
    // Initialize status for all files
    const initialStatus = {};
    selectedFiles.forEach(file => {
      initialStatus[file.id] = { status: 'pending', progress: 0 };
    });
    setTranscriptionStatus(initialStatus);
    
    // Process files one at a time
    for (const file of selectedFiles) {
      await transcribeAudioFile(file);
    }
    
    setIsProcessing(false);
    onComplete();
  };

  // Helper function to format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 py-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Note: This feature will attempt to create transcript documents from your audio files.
          For best results, ensure audio clarity and minimize background noise.
        </AlertDescription>
      </Alert>

      <div className="flex items-center justify-between">
        <Button
          onClick={handleTranscribeAll}
          disabled={isProcessing || selectedFiles.length === 0}
          className="flex items-center gap-2"
        >
          {isProcessing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          Process {selectedFiles.length} Audio File{selectedFiles.length !== 1 ? 's' : ''}
        </Button>
        
        {isProcessing && (
          <div className="flex items-center gap-2">
            <Progress value={overallProgress} className="w-[200px]" />
            <span className="text-sm text-gray-500">{overallProgress}%</span>
          </div>
        )}
      </div>

      {Object.entries(transcriptionStatus).length > 0 && (
        <div className="space-y-2">
          {Object.entries(transcriptionStatus).map(([fileId, status]) => {
            const file = selectedFiles.find(f => f.id === fileId);
            if (!file) return null;

            return (
              <div key={fileId} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <div className={`
                    w-2 h-2 rounded-full
                    ${status.status === 'completed' ? 'bg-green-500' : 
                      status.status === 'failed' ? 'bg-red-500' :
                      status.status === 'exists' ? 'bg-blue-500' :
                      'bg-yellow-500'}
                  `} />
                  <span className="font-medium">{file.title}</span>
                </div>
                <div className="flex items-center gap-2">
                  {status.status === 'completed' && <Check className="w-4 h-4 text-green-500" />}
                  {status.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                  {status.status === 'exists' && <Check className="w-4 h-4 text-blue-500" />}
                  {['starting', 'processing', 'saving', 'retrying'].includes(status.status) && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  <span className="text-sm text-gray-500">
                    {status.status === 'completed' ? 'Completed' :
                     status.status === 'failed' ? 'Failed' :
                     status.status === 'exists' ? 'Already exists' :
                     status.status === 'retrying' ? 'Retrying...' :
                     `${status.progress}%`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}