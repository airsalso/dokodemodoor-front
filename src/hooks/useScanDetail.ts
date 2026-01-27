import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export interface ScanDetail {
  status: string;
  logs: string[];
  target: string;
  vulnerabilities: number;
  targetUrl?: string;
  sourcePath?: string;
  config?: string;
  sessionId?: string;
  startTime?: number;
  endTime?: number | null;
  duration?: string;
}

export function useScanDetail(id: string) {
  const { data, error, mutate, isValidating } = useSWR<ScanDetail>(
    id ? `/api/scan/logs/${id}` : null,
    fetcher,
    {
      refreshInterval: (data) => {
        return (data?.status === 'running' || data?.status === 'translating') ? 2000 : 0;
      },
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
    isValidating
  };
}
