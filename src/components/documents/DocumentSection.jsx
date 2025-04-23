import React, { useState } from 'react';
import { Document } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Upload, Globe, Music, Video, Clock, FileEdit } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function DocumentSection({ documents, project, onDocumentsChange }) {
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [showCreateDoc, setShowCreateDoc] = useState(false);
  const [newDoc, setNewDoc] = useState({
    project_id: project?.id,
    title: '',
    type: 'specification',
    content: '',
    language: 'en',
    duration: null,
  });
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const typeIcons = {
    specification: '📄',
    meeting_notes: '📝',
    status_update: '📊',
    email: '📧',
    audio: '🎵',
    video: '🎥',
    other: '📎'
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const createDocument = async (isUpload = true) => {
    if (isUpload) {
      // Handle file upload
      let fileUrl = '';
      if (file) {
        setUploading(true);
        const { file_url } = await UploadFile({ file });
        fileUrl = file_url;
        setUploading(false);
      }

      await Document.create({
        ...newDoc,
        file_url: fileUrl,
        project_id: project.id // Ensure project ID is set
      });

      setShowNewDoc(false);
      setFile(null);
    } else {
      // Handle manual document creation
      await Document.create({
        ...newDoc,
        project_id: project.id // Ensure project ID is set
      });
      
      setShowCreateDoc(false);
    }
    
    // Reset form
    setNewDoc({
      project_id: project?.id,
      title: '',
      type: 'specification',
      content: '',
      language: 'en',
      duration: null,
    });
    
    onDocumentsChange();
  };

  const handleFileUpload = async (e) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setFile(file);
      setNewDoc(prev => ({
        ...prev,
        title: file.name.split('.')[0] // Set default title to filename
      }));
      
      // Auto-detect type based on file
      if (file.type.startsWith('audio/')) {
        setNewDoc(prev => ({ ...prev, type: 'audio' }));
      } else if (file.type.startsWith('video/')) {
        setNewDoc(prev => ({ ...prev, type: 'video' }));
      }

      // Get duration for audio/video files
      if (file.type.startsWith('audio/') || file.type.startsWith('video/')) {
        const url = URL.createObjectURL(file);
        const media = file.type.startsWith('audio/') ? new Audio(url) : document.createElement('video');
        media.src = url;
        
        media.onloadedmetadata = () => {
          setNewDoc(prev => ({ ...prev, duration: Math.round(media.duration) }));
          URL.revokeObjectURL(url);
        };
      }
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Documents</CardTitle>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateDoc(true)} className="flex items-center gap-2">
            <FileEdit className="w-4 h-4" /> Create File
          </Button>
          <Button onClick={() => setShowNewDoc(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Upload File
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {documents.map(doc => (
            <div
              key={doc.id}
              className="flex items-start gap-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl">{typeIcons[doc.type]}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium truncate">{doc.title}</h3>
                  <span className="text-sm text-gray-500">
                    {format(new Date(doc.created_date), 'MMM d, yyyy')}
                  </span>
                </div>
                {doc.content && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{doc.content}</p>
                )}
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-sm flex items-center gap-1 text-gray-500">
                    {doc.type === 'audio' ? (
                      <Music className="w-4 h-4" />
                    ) : doc.type === 'video' ? (
                      <Video className="w-4 h-4" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    {doc.type.replace('_', ' ')}
                  </span>
                  {doc.duration && (
                    <span className="text-sm flex items-center gap-1 text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatDuration(doc.duration)}
                    </span>
                  )}
                  <span className="text-sm flex items-center gap-1 text-gray-500">
                    <Globe className="w-4 h-4" />
                    {doc.language.toUpperCase()}
                  </span>
                </div>
              </div>
              {doc.file_url && (doc.type === 'audio' || doc.type === 'video') ? (
                <div className="w-64">
                  {doc.type === 'audio' && (
                    <audio controls className="w-full">
                      <source src={doc.file_url} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  )}
                  {doc.type === 'video' && (
                    <video controls className="w-full rounded">
                      <source src={doc.file_url} type="video/mp4" />
                      Your browser does not support the video element.
                    </video>
                  )}
                </div>
              ) : doc.file_url ? (
                <a
                  href={doc.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View File
                </a>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>

      {/* Upload File Dialog */}
      <Dialog open={showNewDoc} onOpenChange={setShowNewDoc}>
        <DialogContent className="max-w-md max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(80vh-180px)]">
            <div className="space-y-4 py-4 pr-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <Upload className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm font-medium text-gray-700">
                      {file ? file.name : "Drag and drop file here or click to browse"}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Supports PDFs, documents, images, audio, and video
                    </p>
                  </div>
                  <Input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    onChange={handleFileUpload}
                    accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.mp3,.wav,.mp4,.mov"
                  />
                </label>
              </div>

              {file && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Document Title</label>
                    <Input
                      value={newDoc.title}
                      onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                      placeholder="Enter document title"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Document Type</label>
                      <Select
                        value={newDoc.type}
                        onValueChange={(value) => setNewDoc({ ...newDoc, type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Document Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="specification">Specification</SelectItem>
                          <SelectItem value="meeting_notes">Meeting Notes</SelectItem>
                          <SelectItem value="status_update">Status Update</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="audio">Audio Recording</SelectItem>
                          <SelectItem value="video">Video Recording</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Language</label>
                      <Select
                        value={newDoc.language}
                        onValueChange={(value) => setNewDoc({ ...newDoc, language: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Language" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="he">Hebrew</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description (Optional)</label>
                    <Textarea
                      placeholder="Enter additional details about this document"
                      value={newDoc.content}
                      onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDoc(false)}>Cancel</Button>
            <Button 
              onClick={() => createDocument(true)}
              disabled={!file || uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Upload Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Document Dialog */}
      <Dialog open={showCreateDoc} onOpenChange={setShowCreateDoc}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[calc(80vh-180px)]">
            <div className="space-y-4 py-4 pr-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Document Title</label>
                <Input
                  value={newDoc.title}
                  onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                  placeholder="Enter document title"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Document Type</label>
                  <Select
                    value={newDoc.type}
                    onValueChange={(value) => setNewDoc({ ...newDoc, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Document Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="specification">Specification</SelectItem>
                      <SelectItem value="meeting_notes">Meeting Notes</SelectItem>
                      <SelectItem value="status_update">Status Update</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Language</label>
                  <Select
                    value={newDoc.language}
                    onValueChange={(value) => setNewDoc({ ...newDoc, language: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="he">Hebrew</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Document Content</label>
                <Textarea
                  placeholder="Enter document content here..."
                  value={newDoc.content}
                  onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
                  className="min-h-[300px]"
                />
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDoc(false)}>Cancel</Button>
            <Button 
              onClick={() => createDocument(false)}
              className="flex items-center gap-2"
            >
              <FileEdit className="w-4 h-4" /> Create Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}