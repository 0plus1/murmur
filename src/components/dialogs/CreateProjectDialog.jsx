/**
 * Create Project Dialog
 */
import { useState, useEffect } from 'react';
import { FolderPlus } from 'lucide-react';
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

export function CreateProjectDialog({ open, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  
  useEffect(() => {
    if (!open) {
      setName('');
      setCreating(false);
    }
  }, [open]);
  
  const handleCreate = async () => {
    if (!name.trim()) return;
    
    setCreating(true);
    try {
      await onCreate(name.trim());
      onClose();
    } catch (e) {
      console.error('Create failed:', e);
      setCreating(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && name.trim()) {
      handleCreate();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="create-project-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            New Project
          </DialogTitle>
          <DialogDescription>
            Create a new writing project. You can add chapters, characters, and more after creating it.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="My Novel"
              autoFocus
              data-testid="project-name-input"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!name.trim() || creating}
            data-testid="create-project-btn"
          >
            {creating ? 'Creating...' : 'Create Project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateProjectDialog;
