import { useState } from 'react';
import { Shield, Smartphone, Mail, Loader2, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import {
  useTFAStatus,
  useSetupTFA,
  useEnableTFA,
  useSendDisableCode,
  useDisableTFA,
  useSwitchSetupTFA,
  useSwitchTFA,
} from '@/hooks/useTFA';

type FlowState =
  | { step: 'idle' }
  | { step: 'choose-method' }
  | { step: 'setup-email' }
  | { step: 'setup-authenticator'; qrCode: string; secret: string }
  | { step: 'verify'; method: number; purpose: 'enable' | 'disable' | 'switch' }
  | { step: 'disable-confirm' }
  | { step: 'switch-choose' }
  | { step: 'switch-setup-authenticator'; qrCode: string; secret: string };

const TFA_EMAIL = 1;
const TFA_AUTHENTICATOR = 2;

export function TwoFactorSection() {
  const { data: statusResponse, isLoading: statusLoading } = useTFAStatus();
  const setupTFA = useSetupTFA();
  const enableTFA = useEnableTFA();
  const sendDisableCode = useSendDisableCode();
  const disableTFA = useDisableTFA();
  const switchSetupTFA = useSwitchSetupTFA();
  const switchTFA = useSwitchTFA();

  const [flow, setFlow] = useState<FlowState>({ step: 'idle' });
  const [code, setCode] = useState('');
  const [pendingMethod, setPendingMethod] = useState<number>(TFA_EMAIL);
  const [copied, setCopied] = useState(false);

  const status = (statusResponse as { data?: { has_tfa: boolean; tfa_method: string | null; tfa_method_value: number | null } })?.data;
  const hasTfa = status?.has_tfa ?? false;
  const tfaMethodName = status?.tfa_method ?? null;
  const tfaMethodValue = status?.tfa_method_value ?? null;

  const dialogOpen = flow.step !== 'idle';
  const isAnyPending =
    setupTFA.isPending ||
    enableTFA.isPending ||
    sendDisableCode.isPending ||
    disableTFA.isPending ||
    switchSetupTFA.isPending ||
    switchTFA.isPending;

  const closeDialog = () => {
    setFlow({ step: 'idle' });
    setCode('');
    setCopied(false);
  };

  const handleCopySecret = async (secret: string) => {
    await navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Enable flow ──────────────────────────────
  const startSetup = (method: number) => {
    setPendingMethod(method);
    setupTFA.mutate(method, {
      onSuccess: (response) => {
        const data = (response as { data?: { qr_code?: string; secret?: string } }).data;
        if (method === TFA_AUTHENTICATOR && data?.qr_code) {
          setFlow({ step: 'setup-authenticator', qrCode: data.qr_code, secret: data.secret ?? '' });
        } else {
          setFlow({ step: 'setup-email' });
        }
      },
    });
  };

  const confirmEnable = () => {
    enableTFA.mutate(
      { method: pendingMethod, code },
      {
        onSuccess: () => {
          closeDialog();
        },
      }
    );
  };

  // ── Disable flow ─────────────────────────────
  const startDisable = () => {
    if (tfaMethodValue === TFA_EMAIL) {
      sendDisableCode.mutate(undefined, {
        onSuccess: () => setFlow({ step: 'verify', method: TFA_EMAIL, purpose: 'disable' }),
      });
    } else {
      setFlow({ step: 'verify', method: TFA_AUTHENTICATOR, purpose: 'disable' });
    }
  };

  const confirmDisable = () => {
    disableTFA.mutate(code, {
      onSuccess: () => closeDialog(),
    });
  };

  // ── Switch flow ──────────────────────────────
  const startSwitch = (newMethod: number) => {
    setPendingMethod(newMethod);
    switchSetupTFA.mutate(newMethod, {
      onSuccess: (response) => {
        const data = (response as { data?: { qr_code?: string; secret?: string } }).data;
        if (newMethod === TFA_AUTHENTICATOR && data?.qr_code) {
          setFlow({ step: 'switch-setup-authenticator', qrCode: data.qr_code, secret: data.secret ?? '' });
        } else {
          setFlow({ step: 'verify', method: TFA_EMAIL, purpose: 'switch' });
        }
      },
    });
  };

  const confirmSwitch = () => {
    switchTFA.mutate(
      { method: pendingMethod, code },
      {
        onSuccess: () => closeDialog(),
      }
    );
  };

  // ── Render ───────────────────────────────────
  if (statusLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading...
        </div>
      </div>
    );
  }

  const dialogContent = () => {
    switch (flow.step) {
      case 'choose-method':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
              <DialogDescription>
                Choose how you want to verify your identity when signing in.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <button
                type="button"
                className="flex flex-col items-center gap-3 p-6 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => startSetup(TFA_AUTHENTICATOR)}
                disabled={isAnyPending}
              >
                <Smartphone className="w-8 h-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium">Authenticator App</p>
                  <p className="text-xs text-muted-foreground">
                    Google Authenticator, Authy, etc.
                  </p>
                </div>
              </button>
              <button
                type="button"
                className="flex flex-col items-center gap-3 p-6 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors"
                onClick={() => startSetup(TFA_EMAIL)}
                disabled={isAnyPending}
              >
                <Mail className="w-8 h-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium">Email Verification</p>
                  <p className="text-xs text-muted-foreground">
                    Receive a code via email
                  </p>
                </div>
              </button>
            </div>
            {isAnyPending && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </div>
            )}
          </>
        );

      case 'setup-email':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Verify Email Code</DialogTitle>
              <DialogDescription>
                We sent a 6-digit code to your email. Enter it below to enable email-based TFA.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} disabled={isAnyPending}>
                Cancel
              </Button>
              <Button onClick={confirmEnable} disabled={code.length !== 6 || isAnyPending}>
                {enableTFA.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
                ) : (
                  'Enable TFA'
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case 'setup-authenticator':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Set Up Authenticator App</DialogTitle>
              <DialogDescription>
                Scan this QR code with your authenticator app, then enter the 6-digit code.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-3 rounded-lg border">
                <img src={flow.qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                  {flow.secret}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySecret(flow.secret)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Can't scan? Enter the secret key manually in your authenticator app.
              </p>
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} disabled={isAnyPending}>
                Cancel
              </Button>
              <Button onClick={confirmEnable} disabled={code.length !== 6 || isAnyPending}>
                {enableTFA.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
                ) : (
                  'Enable TFA'
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case 'verify':
        return (
          <>
            <DialogHeader>
              <DialogTitle>
                {flow.purpose === 'disable' ? 'Disable TFA' : 'Switch TFA Method'}
              </DialogTitle>
              <DialogDescription>
                {flow.method === TFA_EMAIL
                  ? 'Enter the 6-digit code sent to your email.'
                  : 'Enter the 6-digit code from your authenticator app.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center py-4">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} disabled={isAnyPending}>
                Cancel
              </Button>
              <Button
                variant={flow.purpose === 'disable' ? 'destructive' : 'default'}
                onClick={flow.purpose === 'disable' ? confirmDisable : confirmSwitch}
                disabled={code.length !== 6 || isAnyPending}
              >
                {isAnyPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
                ) : flow.purpose === 'disable' ? (
                  'Disable TFA'
                ) : (
                  'Switch Method'
                )}
              </Button>
            </DialogFooter>
          </>
        );

      case 'switch-choose':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Switch TFA Method</DialogTitle>
              <DialogDescription>
                Select a new method for two-factor authentication.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <button
                type="button"
                className={`flex flex-col items-center gap-3 p-6 border rounded-lg transition-colors ${
                  tfaMethodValue === TFA_AUTHENTICATOR
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'hover:border-primary hover:bg-primary/5'
                }`}
                onClick={() => startSwitch(TFA_AUTHENTICATOR)}
                disabled={tfaMethodValue === TFA_AUTHENTICATOR || isAnyPending}
              >
                <Smartphone className="w-8 h-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium">Authenticator App</p>
                  {tfaMethodValue === TFA_AUTHENTICATOR && (
                    <p className="text-xs text-primary font-medium">Current Method</p>
                  )}
                </div>
              </button>
              <button
                type="button"
                className={`flex flex-col items-center gap-3 p-6 border rounded-lg transition-colors ${
                  tfaMethodValue === TFA_EMAIL
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'hover:border-primary hover:bg-primary/5'
                }`}
                onClick={() => startSwitch(TFA_EMAIL)}
                disabled={tfaMethodValue === TFA_EMAIL || isAnyPending}
              >
                <Mail className="w-8 h-8 text-primary" />
                <div className="text-center">
                  <p className="font-medium">Email Verification</p>
                  {tfaMethodValue === TFA_EMAIL && (
                    <p className="text-xs text-primary font-medium">Current Method</p>
                  )}
                </div>
              </button>
            </div>
            {isAnyPending && (
              <div className="flex items-center justify-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Setting up...
              </div>
            )}
          </>
        );

      case 'switch-setup-authenticator':
        return (
          <>
            <DialogHeader>
              <DialogTitle>Switch to Authenticator App</DialogTitle>
              <DialogDescription>
                Scan this QR code with your authenticator app, then enter the 6-digit code.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-3 rounded-lg border">
                <img src={flow.qrCode} alt="QR Code" className="w-48 h-48" />
              </div>
              <div className="flex items-center gap-2 text-sm">
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                  {flow.secret}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleCopySecret(flow.secret)}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={closeDialog} disabled={isAnyPending}>
                Cancel
              </Button>
              <Button onClick={confirmSwitch} disabled={code.length !== 6 || isAnyPending}>
                {switchTFA.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying...</>
                ) : (
                  'Switch Method'
                )}
              </Button>
            </DialogFooter>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Two-Factor Authentication</h3>

      {hasTfa ? (
        <>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Two-factor authentication is enabled</p>
              <p className="text-sm text-muted-foreground">
                Current Method: {tfaMethodName}
              </p>
            </div>
            <Button variant="destructive" onClick={() => { setCode(''); startDisable(); }}>
              Disable TFA
            </Button>
          </div>

          <Separator />

          <div className="space-y-3">
            <p className="text-sm font-medium">Switch Method</p>
            <p className="text-sm text-muted-foreground">
              Select a new method to switch your two-factor authentication:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                  tfaMethodValue === TFA_AUTHENTICATOR
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'hover:border-primary hover:bg-primary/5'
                }`}
                onClick={() => { setCode(''); startSwitch(TFA_AUTHENTICATOR); }}
                disabled={tfaMethodValue === TFA_AUTHENTICATOR || isAnyPending}
              >
                <Smartphone className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-sm">Authenticator App</p>
                  {tfaMethodValue === TFA_AUTHENTICATOR && (
                    <p className="text-xs text-primary">Current Method</p>
                  )}
                </div>
              </button>
              <button
                type="button"
                className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                  tfaMethodValue === TFA_EMAIL
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'hover:border-primary hover:bg-primary/5'
                }`}
                onClick={() => { setCode(''); startSwitch(TFA_EMAIL); }}
                disabled={tfaMethodValue === TFA_EMAIL || isAnyPending}
              >
                <Mail className="w-6 h-6 text-primary" />
                <div className="text-left">
                  <p className="font-medium text-sm">Email Verification</p>
                  {tfaMethodValue === TFA_EMAIL && (
                    <p className="text-xs text-primary">Current Method</p>
                  )}
                </div>
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Enable 2FA</Label>
            <p className="text-sm text-muted-foreground">
              Add an extra layer of security to your account
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setFlow({ step: 'choose-method' })}
          >
            <Shield className="w-4 h-4 mr-2" />
            Setup 2FA
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="sm:max-w-md">
          {dialogContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
