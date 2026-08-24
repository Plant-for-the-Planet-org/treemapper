'use client';

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { LoginForm } from '@/app/login/components/LoginForm';

/**
 * The product page keeps the sign-in choices behind a dialog so the existing
 * Auth0 flow (email plus the three social providers) survives the move away
 * from the split-screen login page.
 */
export function SignInDialog({
  open,
  onOpenChange,
  loading,
  onLogin,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: string | false;
  onLogin: (connection?: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-0 bg-transparent p-0 shadow-none ring-0" showCloseButton={false}>
        <DialogTitle className="sr-only">Sign in to TreeMapper</DialogTitle>
        <DialogDescription className="sr-only">
          Continue with email, Google, Facebook or Apple.
        </DialogDescription>
        <LoginForm loading={loading} onLogin={onLogin} />
      </DialogContent>
    </Dialog>
  );
}
