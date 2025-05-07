import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Download, Link, Globe, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentViewDialog({ document: doc, open, onOpenChange }) {
  if (!doc) return null;

  const downloadDocument = () => {
    // For documents with file URLs, directly open/download the file
    if (doc.file_url) {
      window.open(doc.file_url, '_blank');
      return;
    }
    
    // For text-based documents without file URLs, create a download from content
    if (doc.content) {
      const blob = new Blob([doc.content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const downloadLink = window.document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `${doc.title}.txt`;
      window.document.body.appendChild(downloadLink);
      downloadLink.click();
      window.document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="text-xl">{doc.title}</DialogTitle>
          <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(doc.created_date), 'MMM d, yyyy')}
            </div>
            <div className="flex items-center gap-1">
              <Globe className="h-4 w-4" />
              {doc.language?.toUpperCase() || 'EN'}
            </div>
            {doc.created_by && (
              <div className="flex items-center gap-1">
                <User className="h-4 w-4" />
                {doc.created_by}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex justify-between items-center py-2">
          <div className="text-sm font-medium">
            Document Type: {doc.type?.replace('_', ' ')}
          </div>
          <div className="flex gap-2">
            {doc.file_url && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => window.open(doc.file_url, '_blank')}
              >
                <Link className="h-4 w-4" />
                Open Original
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              onClick={downloadDocument}
            >
              <Download className="h-4 w-4" />
              Download
            </Button>
          </div>
        </div>

        <ScrollArea className="h-[50vh] border rounded-md p-4 bg-gray-50">
          {doc.content ? (
            <div className="prose max-w-none">
              {doc.content.split('\n').map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  <br />
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-gray-500 italic text-center py-8">
              No content available for this document.
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}