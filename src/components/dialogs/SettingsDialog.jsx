/**
 * Settings Dialog
 */
import { Sun, Moon, RefreshCw, Trash2, FolderPlus, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';
import { useState } from 'react';

export function SettingsDialog() {
  const [recreating, setRecreating] = useState(false);
  
  const open = useUIStore((state) => state.settingsOpen);
  const closeSettings = useUIStore((state) => state.closeSettings);
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);
  
  const currentProject = useProjectStore((state) => state.currentProject);
  const recreateSampleProject = useProjectStore((state) => state.recreateSampleProject);
  const reindexCurrentProject = useProjectStore((state) => state.reindexCurrentProject);
  
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
  
  const handleReindex = async () => {
    try {
      await reindexCurrentProject();
      toast.success('Project reindexed');
    } catch (e) {
      toast.error(`Reindex failed: ${e.message}`);
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
          
          {/* Project Actions */}
          <div>
            <h4 className="text-sm font-medium mb-3">Project Actions</h4>
            
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleReindex}
                disabled={!currentProject}
                data-testid="reindex-btn"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Reindex Project
              </Button>
              
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
            <p>All data stored in your browser (IndexedDB)</p>
            <p>No cloud, no analytics, no network calls</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default SettingsDialog;
