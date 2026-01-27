import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

export interface Vulnerability {
    id: string;
    scanId: string;
    title: string;
    severity: string;
    type: string;
    description: string;
    evidence?: string;
    details?: string;
    createdAt: string;
    scan?: {
        targetUrl: string;
        startTime: number;
        projectName?: string;
    };
}

export interface VulnsResponse {
    vulnerabilities: Vulnerability[];
    summary: Record<string, number>;
}

export function useVulns(scanId: string | null, severity: string) {
    const params = new URLSearchParams();
    if (scanId) params.append("scanId", scanId);
    if (severity && severity !== "ALL") params.append("severity", severity);

    const { data, error, mutate, isValidating } = useSWR<VulnsResponse>(
        `/api/vulns?${params.toString()}`,
        fetcher,
        {
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
