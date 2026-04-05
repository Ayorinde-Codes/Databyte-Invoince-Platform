import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api';
import { toast } from 'sonner';
import { extractErrorMessage } from '@/utils/error';

export const useTFAStatus = () => {
  return useQuery({
    queryKey: ['tfa', 'status'],
    queryFn: () => apiService.getTFAStatus(),
    staleTime: 30 * 1000,
  });
};

export const useSetupTFA = () => {
  return useMutation({
    mutationFn: (method: number) => apiService.setupTFA(method),
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to set up TFA'));
    },
  });
};

export const useEnableTFA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ method, code }: { method: number; code: string }) =>
      apiService.enableTFA(method, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tfa', 'status'] });
      toast.success('Two-factor authentication enabled successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to enable TFA'));
    },
  });
};

export const useSendDisableCode = () => {
  return useMutation({
    mutationFn: () => apiService.sendDisableCode(),
    onSuccess: () => {
      toast.success('Verification code sent to your email');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to send code'));
    },
  });
};

export const useDisableTFA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => apiService.disableTFA(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tfa', 'status'] });
      toast.success('Two-factor authentication disabled');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to disable TFA'));
    },
  });
};

export const useSwitchSetupTFA = () => {
  return useMutation({
    mutationFn: (method: number) => apiService.switchSetupTFA(method),
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to set up switch'));
    },
  });
};

export const useSwitchTFA = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ method, code }: { method: number; code: string }) =>
      apiService.switchTFA(method, code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tfa', 'status'] });
      toast.success('TFA method switched successfully');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to switch TFA method'));
    },
  });
};

export const useVerifyTFALogin = () => {
  return useMutation({
    mutationFn: ({
      email,
      tfaToken,
      code,
    }: {
      email: string;
      tfaToken: string;
      code: string;
    }) => apiService.verifyTFALogin(email, tfaToken, code),
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Invalid verification code'));
    },
  });
};

export const useResendTFALoginCode = () => {
  return useMutation({
    mutationFn: ({ email, tfaToken }: { email: string; tfaToken: string }) =>
      apiService.resendTFALoginCode(email, tfaToken),
    onSuccess: () => {
      toast.success('Verification code resent to your email');
    },
    onError: (error: unknown) => {
      toast.error(extractErrorMessage(error, 'Failed to resend code'));
    },
  });
};
