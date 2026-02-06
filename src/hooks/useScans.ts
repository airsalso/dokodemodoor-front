import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export type ScanRecord = {
  id: string;
  targetUrl?: string | null;
  target?: string | null;
  status: string;
  startTime: string | number;
  endTime?: string | null;
  duration?: string | null;
  vulnerabilities?: number | null;
  sourcePath?: string | null;
  config?: string | null;
  projectName?: string | null;
  type?: string;
};

export type ScanStats = {
  total: number;
  running: number;
  translating?: number;
  completed: number;
  failed: number;
};

export interface ScansResponse {
  history: ScanRecord[];
  active: ScanRecord | null;
  stats: ScanStats;
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
  };
}

export function useScans(params: { page: number; limit: number; query: string; status: string; type?: string }) {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
    query: params.query,
    status: params.status,
    type: params.type || "PENTEST"
  });

  const { data, error, mutate, isValidating } = useSWR<ScansResponse>(
    `/api/scan/start?${queryParams.toString()}`,
    fetcher,
    {
      refreshInterval: 5000, // Background refresh every 5s
      revalidateOnFocus: true,
      keepPreviousData: true,
    }
  );

  return {
    data,
    isLoading: !error && !data,
    isError: error,
    mutate,
    isValidating,
  };
}
