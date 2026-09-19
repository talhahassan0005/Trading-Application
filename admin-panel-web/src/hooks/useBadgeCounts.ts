import { useEffect, useState } from 'react';
import { fetchDisputes, fetchWithdrawals } from '../api/adminService';

export interface BadgeCounts {
  withdrawals: number;
  disputes: number;
}

/** Pending-count badges shown next to sidebar nav items. */
export function useBadgeCounts(): BadgeCounts {
  const [counts, setCounts] = useState<BadgeCounts>({ withdrawals: 0, disputes: 0 });

  useEffect(() => {
    let active = true;
    Promise.all([fetchWithdrawals(), fetchDisputes()]).then(([withdrawals, disputes]) => {
      if (!active) return;
      setCounts({
        withdrawals: withdrawals.length,
        disputes: disputes.filter((d) => d.status !== 'resolved').length,
      });
    });
    return () => {
      active = false;
    };
  }, []);

  return counts;
}
