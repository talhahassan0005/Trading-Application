import { fetchActivity, fetchOverviewStats } from '../api/adminService';
import { useAsyncData } from '../hooks/useAsyncData';
import { Card, Text, StatCard, Divider } from '../components';
import { formatCompactNumber, formatCurrency } from '../utils/formatters';
import { dotColorForActivity } from '../utils/activity';

export function OverviewPage() {
  const { data: stats } = useAsyncData(fetchOverviewStats, null);
  const { data: activity } = useAsyncData(fetchActivity, []);

  return (
    <div>
      <Text variant="title" className="mb-5">
        Overview
      </Text>

      {stats ? (
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Pending withdrawals"
            value={String(stats.pendingWithdrawals)}
            hint={`${formatCurrency(stats.pendingWithdrawalsHeld)} held`}
            hintTone="warning"
          />
          <StatCard
            label="Deposits today"
            value={formatCurrency(stats.depositsToday)}
            hint={`+${stats.depositsChangePct}% vs yesterday`}
            hintTone="success"
          />
          <StatCard label="Active users (24h)" value={formatCompactNumber(stats.activeUsers24h)} />
          <StatCard
            label="Open disputes"
            value={String(stats.openDisputes)}
            hint="needs review"
            hintTone="danger"
          />
        </div>
      ) : null}

      <Card padded={false}>
        <Text variant="sectionTitle" className="p-5 pb-3">
          Activity feed
        </Text>
        {activity.map((item, idx) => (
          <div key={item.id}>
            {idx > 0 ? <Divider className="ml-5" /> : null}
            <div className="flex items-start gap-3 px-5 py-3">
              <span className={`mt-1.5 h-2 w-2 rounded-full ${dotColorForActivity(item.type)}`} />
              <div className="flex-1">
                <Text variant="bodyMedium">{item.title}</Text>
                <Text variant="caption" color="text-ink-muted" className="mt-0.5">
                  {item.subtitle}
                </Text>
              </div>
              <Text variant="caption" color="text-ink-muted">
                {item.timeAgo}
              </Text>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
