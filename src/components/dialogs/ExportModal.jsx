/**
 * Export Modal - Export options dialog
 */
import { useState } from 'react';
import { Download, FolderSync, Loader2, Check, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProjectStore, useUIStore } from '@/stores';
import { exportProjectAsZip, downloadZip, syncToFolder, isFileSystemAccessSupported } from '@/lib/export';
import { toast } from 'sonner';

export function ExportModal() {
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  
  const open = useUIStore((state) => state.exportModalOpen);
  const closeExportModal = useUIStore((state) => state.closeExportModal);
  const currentProject = useProjectStore((state) => state.currentProject);
  
  const handleExportZip = async () => {
    if (!currentProject) return;
    
    setExporting(true);
    try {
      const { blob, filename } = await exportProjectAsZip(currentProject.id);
      downloadZip(blob, filename);
      toast.success('Project exported successfully');
      closeExportModal();
    } catch (e) {
      toast.error(`Export failed: ${e.message}`);
    } finally {
      setExporting(false);
    }
  };
  
  const handleSyncToFolder = async () => {
    if (!currentProject) return;
    
    setSyncing(true);
    try {
      const success = await syncToFolder(currentProject.id);
      if (success) {
        toast.success('Project synced to folder');
        closeExportModal();
      }
    } catch (e) {
      toast.error(`Sync failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };
  
  const fsApiSupported = isFileSystemAccessSupported();
  
  return (
    <Dialog open={open} onOpenChange={closeExportModal}>
      <DialogContent className="sm:max-w-md" data-testid="export-modal">
        <DialogHeader>
          <DialogTitle>Export Project</DialogTitle>
          <DialogDescription>
            Export your project as a ZIP file or sync to a local folder.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={handleExportZip}
            disabled={exporting || !currentProject}
            data-testid="export-zip-btn"
          >
            {exporting ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <Download className="h-5 w-5 mr-3" />
            )}
            <div className="text-left">
              <div className="font-medium">Download as ZIP</div>
              <div className="text-xs text-muted-foreground">
                {currentProject 
                  ? 'Export all markdown files in organized folders'
                  : 'No project selected'
                }
              </div>
            </div>
          </Button>
          
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-4"
            onClick={handleSyncToFolder}
            disabled={syncing || !fsApiSupported || !currentProject}
            data-testid="sync-folder-btn"
          >
            {syncing ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <FolderSync className="h-5 w-5 mr-3" />
            )}
            <div className="text-left">
              <div className="font-medium flex items-center gap-2">
                Sync to Folder
                {!fsApiSupported && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    Not supported
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {fsApiSupported 
                  ? 'Write files directly to a local folder'
                  : 'Your browser does not support the File System Access API'
                }
              </div>
            </div>
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground border-t pt-4">
          <p className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Export creates a folder structure with /manuscript, /bible, and /notes 
              containing your markdown files with YAML frontmatter.
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExportModal;
