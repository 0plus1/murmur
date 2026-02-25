/**
 * Storage Setup Dialog - choose a base folder for markdown files
 */
import { useEffect, useState } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useProjectStore, useUIStore } from '@/stores';
import { getStoragePath, pickStoragePath, setStoragePath } from '@/lib/storage';
import { toast } from 'sonner';

export function StorageSetupDialog() {
  const open = useUIStore((state) => state.storageSetupOpen);
  const close = useUIStore((state) => state.closeStorageSetup);
  const syncAllProjectsToDisk = useProjectStore((state) => state.syncAllProjectsToDisk);

  const [currentPath, setCurrentPath] = useState('');
  const [selecting, setSelecting] = useState(false);

  useEffect(() => {
    if (!open) return;
    getStoragePath().then((path) => setCurrentPath(path || ''));
  }, [open]);

  const handleChooseFolder = async () => {
    setSelecting(true);
    try {
      const selected = await pickStoragePath();
      if (!selected) return;

      await setStoragePath(selected);
      setCurrentPath(selected);
      try {
        await syncAllProjectsToDisk();
        toast.success('Storage folder set');
        close();
      } catch (e) {
        await setStoragePath('');
        setCurrentPath('');
        throw e;
      }
    } catch (e) {
      toast.error(`Failed to set storage folder: ${e.message}`);
    } finally {
      setSelecting(false);
    }
  };

  const handleOpenChange = (nextOpen) => {
    if (!nextOpen && !currentPath) return;
    if (!nextOpen) close();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="storage-setup-dialog">
        <DialogHeader>
          <DialogTitle>Choose Storage Folder</DialogTitle>
          <DialogDescription>
            murmur stores markdown files directly on your device. Pick a folder to keep your projects.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Button
            className="w-full justify-start"
            onClick={handleChooseFolder}
            disabled={selecting}
            data-testid="storage-choose-btn"
          >
            {selecting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FolderOpen className="h-4 w-4 mr-2" />
            )}
            Choose Folder
          </Button>

          {currentPath ? (
            <p className="text-xs text-muted-foreground break-all" data-testid="storage-current-path">
              Current location: {currentPath}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              You can change this later in Settings.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default StorageSetupDialog;
