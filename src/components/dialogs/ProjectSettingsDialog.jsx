import { RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export function ProjectSettingsDialog({
  open,
  onOpenChange,
  project,
  onReindex,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="project-settings-dialog">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>
            {project ? `Settings for ${project.name}` : 'Select a project to manage project-specific settings'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h4 className="text-sm font-medium mb-3">Project Actions</h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={onReindex}
                disabled={!project}
                data-testid="project-settings-reindex-btn"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reindex Project
              </Button>
            </div>
          </div>

          <Separator />

          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">Scope</p>
            <p>These settings and actions apply to the selected project only.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProjectSettingsDialog;
