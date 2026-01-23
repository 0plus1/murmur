/**
 * Rename Document Dialog
 */
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function RenameDocumentDialog({ open, onClose, document, onRename }) {
  const [title, setTitle] = useState('');
  
  useEffect(() => {
    if (document) {
      setTitle(document.title);
    }
  }, [document]);
  
  const handleRename = async () => {
    if (!title.trim() || !document) return;
    
    await onRename(document.id, title.trim());
    onClose();
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && title.trim()) {
      handleRename();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="rename-document-dialog">
        <DialogHeader>
          <DialogTitle>Rename Document</DialogTitle>
          <DialogDescription>
            Enter a new title. Links to this document will be updated automatically.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-title">New Title</Label>
            <Input
              id="new-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              data-testid="rename-input"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleRename} 
            disabled={!title.trim() || title === document?.title}
            data-testid="rename-btn"
          >
            Rename
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default RenameDocumentDialog;
