import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

export const InstagramBrowserModal: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const isInstagram = navigator.userAgent.includes('Instagram');
    const dismissed = sessionStorage.getItem('instagram_modal_dismissed');
    if (isInstagram && !dismissed) {
      setOpen(true);
    }
  }, []);

  const handleOpenChrome = () => {
    window.open('https://flency.online', '_blank');
  };

  const handleDismiss = () => {
    sessionStorage.setItem('instagram_modal_dismissed', 'true');
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">
            Ative seus lembretes diários 🔔
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            Para receber notificações diárias, abra o app no Chrome. É rápido!
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 mt-4">
          <Button onClick={handleOpenChrome} size="lg" className="w-full">
            <ExternalLink className="w-5 h-5 mr-2" />
            Abrir no Chrome
          </Button>
          <Button
            variant="ghost"
            onClick={handleDismiss}
            size="lg"
            className="w-full text-muted-foreground"
          >
            Agora não
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
