/**
 * Export Modal - Export options dialog
 */
import { useEffect, useState } from 'react';
import { Download, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProjectStore, useUIStore } from '@/stores';
import { exportProjectAsZip, downloadZip } from '@/lib/export';
import { getStoragePath, syncProjectToDisk } from '@/lib/storage';
import { toast } from 'sonner';

export function ExportModal() {
  const [exporting, setExporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [storagePath, setStoragePathState] = useState('');
  
  const open = useUIStore((state) => state.exportModalOpen);
  const closeExportModal = useUIStore((state) => state.closeExportModal);
  const currentProject = useProjectStore((state) => state.currentProject);

  useEffect(() => {
    if (!open) return;
    getStoragePath().then((path) => setStoragePathState(path || ''));
  }, [open]);
  
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
      await syncProjectToDisk(currentProject.id);
      toast.success('Project files synced');
      closeExportModal();
    } catch (e) {
      toast.error(`Sync failed: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };
  
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
            disabled={syncing || !storagePath || !currentProject}
            data-testid="sync-folder-btn"
          >
            {syncing ? (
              <Loader2 className="h-5 w-5 mr-3 animate-spin" />
            ) : (
              <RefreshCw className="h-5 w-5 mr-3" />
            )}
            <div className="text-left">
              <div className="font-medium flex items-center gap-2">
                Resync Project Files
                {!storagePath && (
                  <span className="text-xs bg-muted px-1.5 py-0.5 rounded">
                    Set location
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground">
                {storagePath
                  ? 'Rewrite all project files to the storage folder'
                  : 'Choose a storage folder in Settings'
                }
              </div>
            </div>
          </Button>
        </div>
        
        <div className="text-xs text-muted-foreground border-t pt-4">
          <p className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Export creates a folder structure with /manuscript, /bible, and /notes containing
              your markdown files with YAML frontmatter.
            </span>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ExportModal;
