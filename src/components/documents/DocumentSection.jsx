
import React, { useState } from 'react';
import { Document } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Plus, Upload, Globe, Music, Video, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentSection({ documents, project, onDocumentsChange }) {
  const [showNewDoc, setShowNewDoc] = useState(false);
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

  const createDocument = async () => {
    let fileUrl = '';
    if (file) {
      setUploading(true);
      const { file_url } = await UploadFile({ file });
      fileUrl = file_url;
      setUploading(false);
    }

    await Document.create({
      ...newDoc,
      file_url: fileUrl
    });

    setShowNewDoc(false);
    setFile(null);
    onDocumentsChange();
  };

  const handleFileUpload = async (e) => {
    if (e.target.files?.length) {
      const file = e.target.files[0];
      setFile(file);
      
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
        <Button onClick={() => setShowNewDoc(true)} className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Document
        </Button>
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

      <Dialog open={showNewDoc} onOpenChange={setShowNewDoc}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              placeholder="Document Title"
              value={newDoc.title}
              onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
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
            <Textarea
              placeholder="Document Content"
              value={newDoc.content}
              onChange={(e) => setNewDoc({ ...newDoc, content: e.target.value })}
            />
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Upload File
              </label>
              <Input
                type="file"
                onChange={handleFileUpload}
                accept={newDoc.type === 'audio' ? 'audio/*' : 
                        newDoc.type === 'video' ? 'video/*' : 
                        '.pdf,.doc,.docx,.txt,audio/*,video/*'}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDoc(false)}>Cancel</Button>
            <Button 
              onClick={createDocument}
              disabled={uploading}
              className="flex items-center gap-2"
            >
              {uploading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload className="w-4 h-4" /> Create Document
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
