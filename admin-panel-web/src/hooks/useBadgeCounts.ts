import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchDisputes, fetchPendingReviewCounts, fetchWithdrawals } from '../api/adminService';

export interface BadgeCounts {
  withdrawals: number;
  disputes: number;
  kyc: number;
  deletions: number;
}

/** Pending-count badges shown next to sidebar nav items; refreshed on every page change. */
export function useBadgeCounts(): BadgeCounts {
  const [counts, setCounts] = useState<BadgeCounts>({ withdrawals: 0, disputes: 0, kyc: 0, deletions: 0 });
  const { pathname } = useLocation();

  useEffect(() => {
    let active = true;
    Promise.all([fetchWithdrawals(), fetchDisputes(), fetchPendingReviewCounts().catch(() => ({ kyc: 0, deletions: 0 }))]).then(
      ([withdrawals, disputes, review]) => {
        if (!active) return;
        setCounts({
          withdrawals: withdrawals.length,
          disputes: disputes.filter((d) => d.status !== 'resolved').length,
          kyc: review.kyc,
          deletions: review.deletions,
        });
      }
    );
    return () => {
      active = false;
    };
  }, [pathname]);

  return counts;
}
