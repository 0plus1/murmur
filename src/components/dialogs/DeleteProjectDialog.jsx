/**
 * Delete Project Dialog - requires typing project name to confirm
 */
import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
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

export function DeleteProjectDialog({ open, onClose, project, onDelete }) {
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  const isConfirmed = confirmText === project?.name;
  
  // Reset state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setConfirmText('');
      setDeleting(false);
    }
  }, [open]);
  
  const handleDelete = async () => {
    if (!isConfirmed || !project) return;
    
    setDeleting(true);
    try {
      await onDelete(project.id);
      onClose();
    } catch (e) {
      console.error('Delete failed:', e);
      setDeleting(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && isConfirmed) {
      handleDelete();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="delete-project-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Project
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the project
            and all its documents.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm font-medium text-destructive">
              You are about to delete:
            </p>
            <p className="text-sm font-bold mt-1">{project?.name}</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-name" className="text-sm">
              Type <span className="font-mono font-bold">{project?.name}</span> to confirm:
            </Label>
            <Input
              id="confirm-name"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Enter project name"
              autoComplete="off"
              autoFocus
              data-testid="delete-confirm-input"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={deleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive"
            onClick={handleDelete} 
            disabled={!isConfirmed || deleting}
            data-testid="delete-project-btn"
          >
            {deleting ? 'Deleting...' : 'Delete Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteProjectDialog;
