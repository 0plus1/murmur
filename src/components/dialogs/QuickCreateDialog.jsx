/**
 * Quick Create Document Dialog - just asks for title, type is pre-selected
 */
import { useState, useEffect } from 'react';
import { BookOpen, FileText, Users, MapPin, Sparkles, StickyNote } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const typeConfig = {
  chapter: { label: 'Chapter', icon: BookOpen, placeholder: 'Chapter title...' },
  scene: { label: 'Scene', icon: FileText, placeholder: 'Scene title...' },
  character: { label: 'Character', icon: Users, placeholder: 'Character name...' },
  location: { label: 'Location', icon: MapPin, placeholder: 'Location name...' },
  theme: { label: 'Theme', icon: Sparkles, placeholder: 'Theme title...' },
  narrative_spine: { label: 'Narrative Spine', icon: FileText, placeholder: 'Narrative spine title...' },
  note: { label: 'Note', icon: StickyNote, placeholder: 'Note title...' },
};

export function QuickCreateDialog({ open, onClose, type, onCreate }) {
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);
  
  const config = typeConfig[type] || typeConfig.note;
  const Icon = config.icon;
  
  useEffect(() => {
    if (!open) {
      setTitle('');
      setCreating(false);
    }
  }, [open]);
  
  const handleCreate = async () => {
    if (!title.trim()) return;
    
    setCreating(true);
    try {
      await onCreate(type, title.trim());
      onClose();
    } catch (e) {
      console.error('Create failed:', e);
    } finally {
      setCreating(false);
    }
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && title.trim()) {
      handleCreate();
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="quick-create-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            New {config.label}
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="space-y-2">
            <Label htmlFor="doc-title">{config.label} Name</Label>
            <Input
              id="doc-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              autoFocus
              data-testid="quick-create-input"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={creating}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!title.trim() || creating}
            data-testid="quick-create-btn"
          >
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default QuickCreateDialog;
