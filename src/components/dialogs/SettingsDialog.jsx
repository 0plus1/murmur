/**
 * Settings Dialog
 */
import { Sun, Moon, RefreshCw, FolderOpen, FolderPlus, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useProjectStore, useUIStore } from '@/stores';
import { getStoragePath, pickStoragePath, setStoragePath } from '@/lib/storage';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';

export function SettingsDialog() {
  const [recreating, setRecreating] = useState(false);
  const [storagePath, setStoragePathState] = useState('');
  const [selectingStorage, setSelectingStorage] = useState(false);
  const [syncingStorage, setSyncingStorage] = useState(false);
  
  const open = useUIStore((state) => state.settingsOpen);
  const closeSettings = useUIStore((state) => state.closeSettings);
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  
  const recreateSampleProject = useProjectStore((state) => state.recreateSampleProject);
  const syncAllProjectsToDisk = useProjectStore((state) => state.syncAllProjectsToDisk);

  useEffect(() => {
    if (!open) return;
    getStoragePath().then((path) => setStoragePathState(path || ''));
  }, [open]);
  
  const handleThemeToggle = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  
  const handleRecreateSample = async () => {
    setRecreating(true);
    try {
      await recreateSampleProject();
      toast.success('Sample project recreated');
      closeSettings();
    } catch (e) {
      toast.error(`Failed to recreate sample: ${e.message}`);
    } finally {
      setRecreating(false);
    }
  };
  
  const handleChooseStorage = async () => {
    setSelectingStorage(true);
    const previousPath = storagePath;
    try {
      const selected = await pickStoragePath();
      if (!selected) return;

      await setStoragePath(selected);
      setStoragePathState(selected);
      try {
        await syncAllProjectsToDisk();
        toast.success('Storage folder updated');
      } catch (e) {
        await setStoragePath(previousPath || '');
        setStoragePathState(previousPath || '');
        throw e;
      }
    } catch (e) {
      toast.error(`Failed to update storage: ${e.message}`);
    } finally {
      setSelectingStorage(false);
    }
  };

  const handleResyncStorage = async () => {
    setSyncingStorage(true);
    try {
      await syncAllProjectsToDisk();
      toast.success('Storage synced');
    } catch (e) {
      toast.error(`Sync failed: ${e.message}`);
    } finally {
      setSyncingStorage(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={closeSettings}>
      <DialogContent className="sm:max-w-md" data-testid="settings-dialog">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your writing environment
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Theme */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Sun className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <Label className="text-sm font-medium">Dark Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Toggle between light and dark theme
                </p>
              </div>
            </div>
            <Switch 
              checked={theme === 'dark'} 
              onCheckedChange={handleThemeToggle}
              data-testid="theme-toggle"
            />
          </div>
          
          <Separator />

          {/* Storage */}
          <div>
            <h4 className="text-sm font-medium mb-3">Storage</h4>
            <div className="space-y-2">
              <div className="text-xs text-muted-foreground">
                <p>Markdown files are written to:</p>
                <p className="break-all" data-testid="storage-path">
                  {storagePath || 'Not set yet'}
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleChooseStorage}
                disabled={selectingStorage}
                data-testid="storage-change-btn"
              >
                {selectingStorage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4 mr-2" />
                )}
                Choose Folder
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleResyncStorage}
                disabled={!storagePath || syncingStorage}
                data-testid="storage-resync-btn"
              >
                {syncingStorage ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Resync All Projects
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* Project Actions */}
          <div>
            <h4 className="text-sm font-medium mb-3">Project Actions</h4>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleRecreateSample}
                disabled={recreating}
                data-testid="recreate-sample-btn"
              >
                {recreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <FolderPlus className="h-4 w-4 mr-2" />
                )}
                Recreate Sample Project
              </Button>
            </div>
          </div>
          
          <Separator />
          
          {/* About */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">murmur</p>
            <p>Local-first writing studio for fiction</p>
            <p>All data stored locally (IndexedDB + folder mirror)</p>
            <p>No cloud, no analytics, no network calls</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
