/**
 * Create Document Dialog
 */
import { useEffect, useState } from 'react';
import { BookOpen, FileText, Users, MapPin, Sparkles, StickyNote } from 'lucide-react';
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
import { cn } from '@/lib/utils';

const docTypes = [
  { type: 'chapter', label: 'Chapter', icon: BookOpen, description: 'Main story chapter' },
  { type: 'scene', label: 'Scene', icon: FileText, description: 'Individual scene within a chapter' },
  { type: 'character', label: 'Character', icon: Users, description: 'Character profile' },
  { type: 'location', label: 'Location', icon: MapPin, description: 'Place or setting' },
  { type: 'theme', label: 'Theme', icon: Sparkles, description: 'Theme or style note' },
  { type: 'narrative_spine', label: 'Narrative Spine', icon: FileText, description: 'Story structure and core throughline' },
  { type: 'style_guide', label: 'Style Guide', icon: FileText, description: 'Voice, tone, and guardrails' },
  { type: 'story_compass', label: 'Story Compass', icon: FileText, description: 'North star and reader promise' },
  { type: 'emotional_arc', label: 'Emotional Arc', icon: FileText, description: 'Emotional movement across the draft' },
  { type: 'note', label: 'Note', icon: StickyNote, description: 'General note' },
];

export function CreateDocumentDialog({ open, onClose, initialType, onCreateDocument }) {
  const [selectedType, setSelectedType] = useState(initialType || 'chapter');
  const [title, setTitle] = useState('');
  
  const handleCreate = async () => {
    if (!title.trim()) return;
    
    await onCreateDocument(selectedType, title.trim());
    setTitle('');
    onClose();
  };
  
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && title.trim()) {
      handleCreate();
    }
  };
  
  // Reset type when dialog opens with initialType
  useEffect(() => {
    if (open) {
      setSelectedType(initialType || 'chapter');
    }
  }, [open, initialType]);
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg" data-testid="create-document-dialog">
        <DialogHeader>
          <DialogTitle>Create New Document</DialogTitle>
          <DialogDescription>
            Choose a type and enter a title for your new document.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Type Selection */}
          <div className="grid grid-cols-4 gap-2">
            {docTypes.map(({ type, label, icon: Icon }) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                  'hover:bg-muted/50',
                  selectedType === type 
                    ? 'border-primary bg-primary/5 text-primary' 
                    : 'border-border'
                )}
                data-testid={`type-${type}`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-xs font-medium">{label}</span>
              </button>
            ))}
          </div>
          
          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Enter ${selectedType} title...`}
              autoFocus
              data-testid="document-title-input"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleCreate} 
            disabled={!title.trim()}
            data-testid="create-document-btn"
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateDocumentDialog;
