import { useEffect, useMemo, useState } from 'react';
import { Search, TrendingUp, TrendingDown, Shuffle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { bulkSetDemoTradeOutcome, fetchUsers } from '../api/adminService';
import type { DemoTradeOutcome, PlatformUser, UserSegment } from '../types/models';
import {
  Card,
  Text,
  StatusPill,
  TextField,
  EmptyState,
  Table,
  THead,
  TBody,
  TRow,
  TH,
  TD,
  Avatar,
  Tabs,
  Checkbox,
  Button,
  type TabOption,
} from '../components';
import { formatCurrency } from '../utils/formatters';
import { toneForStatus } from '../utils/status';
import { formatJoinedAt, segmentForUser, SEGMENT_LABEL } from '../utils/segment';

const BULK_OUTCOME_ACTIONS: { value: DemoTradeOutcome; label: string; icon: typeof TrendingUp; variant: 'success' | 'warning' | 'danger' }[] = [
  { value: 'profit', label: 'Apply profit', icon: TrendingUp, variant: 'success' },
  { value: 'moderate', label: 'Apply profit/loss', icon: Shuffle, variant: 'warning' },
  { value: 'loss', label: 'Apply loss', icon: TrendingDown, variant: 'danger' },
];

export function UsersPage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [segment, setSegment] = useState<UserSegment | 'all'>('all');
  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState<DemoTradeOutcome | null>(null);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      fetchUsers(query).then((res) => {
        setUsers(res);
        setLoading(false);
        setSelected(new Set());
      });
    }, 150);
    return () => clearTimeout(handle);
  }, [query]);

  const segmentCounts = useMemo(() => {
    const counts: Record<UserSegment, number> = { new: 0, existing: 0, veteran: 0 };
    users.forEach((u) => counts[segmentForUser(u.joinedAt)]++);
    return counts;
  }, [users]);

  const visibleUsers = useMemo(
    () => (segment === 'all' ? users : users.filter((u) => segmentForUser(u.joinedAt) === segment)),
    [users, segment]
  );

  const tabOptions: TabOption<UserSegment | 'all'>[] = [
    { value: 'all', label: 'All', count: users.length },
    { value: 'new', label: SEGMENT_LABEL.new, count: segmentCounts.new },
    { value: 'existing', label: SEGMENT_LABEL.existing, count: segmentCounts.existing },
    { value: 'veteran', label: SEGMENT_LABEL.veteran, count: segmentCounts.veteran },
  ];

  const allVisibleSelected = visibleUsers.length > 0 && visibleUsers.every((u) => selected.has(u.id));

  const toggleAll = () => {
    setSelected((prev) => {
      if (allVisibleSelected) return new Set();
      const next = new Set(prev);
      visibleUsers.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const applyBulkOutcome = async (mode: DemoTradeOutcome) => {
    if (selected.size === 0) return;
    setBulkBusy(mode);
    try {
      const ids = Array.from(selected);
      await bulkSetDemoTradeOutcome(ids, mode);
      setUsers((prev) => prev.map((u) => (selected.has(u.id) ? { ...u, demoTradeOutcome: mode } : u)));
      setSelected(new Set());
    } finally {
      setBulkBusy(null);
    }
  };

  return (
    <div>
      <Text variant="title" className="mb-4">
        Users
      </Text>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="max-w-sm flex-1">
          <TextField
            placeholder="Search users..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            leftIcon={Search}
          />
        </div>
        <Tabs options={tabOptions} value={segment} onChange={setSegment} />
      </div>

      {selected.size > 0 ? (
        <Card className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Text variant="bodySmall" color="text-ink-secondary">
              {selected.size} user{selected.size === 1 ? '' : 's'} selected · demo trade outcome only
            </Text>
            <div className="flex items-center gap-2">
              {BULK_OUTCOME_ACTIONS.map((action) => (
                <Button
                  key={action.value}
                  label={action.label}
                  variant={action.variant}
                  size="sm"
                  icon={action.icon}
                  loading={bulkBusy === action.value}
                  disabled={bulkBusy !== null}
                  onClick={() => applyBulkOutcome(action.value)}
                />
              ))}
              <Button
                label="Clear"
                variant="ghost"
                size="sm"
                disabled={bulkBusy !== null}
                onClick={() => setSelected(new Set())}
              />
            </div>
          </div>
        </Card>
      ) : null}

      <Card padded={false}>
        {!loading && visibleUsers.length === 0 ? (
          <EmptyState icon={Search} title="No users found" description="Try a different search term or segment." />
        ) : (
          <Table>
            <THead>
              <TRow className="hover:bg-transparent">
                <TH className="w-10">
                  <Checkbox checked={allVisibleSelected} onChange={toggleAll} />
                </TH>
                <TH>User</TH>
                <TH>Segment</TH>
                <TH>Joined</TH>
                <TH>Balance</TH>
                <TH>KYC</TH>
                <TH>Status</TH>
                <TH>Demo outcome</TH>
              </TRow>
            </THead>
            <TBody>
              {visibleUsers.map((user) => (
                <TRow
                  key={user.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/users/${user.id}`)}
                >
                  <TD onClick={(e) => e.stopPropagation()}>
                    <Checkbox checked={selected.has(user.id)} onChange={() => toggleOne(user.id)} />
                  </TD>
                  <TD>
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} size="md" />
                      <div>
                        <Text variant="bodyMedium">{user.name}</Text>
                        <Text variant="caption" color="text-ink-muted">
                          {user.id} · {user.email}
                        </Text>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <Text variant="bodySmall" color="text-ink-secondary">
                      {SEGMENT_LABEL[segmentForUser(user.joinedAt)]}
                    </Text>
                  </TD>
                  <TD>
                    <Text variant="bodySmall" color="text-ink-secondary">
                      {formatJoinedAt(user.joinedAt)}
                    </Text>
                  </TD>
                  <TD>
                    <Text variant="bodyMedium">{formatCurrency(user.balance)}</Text>
                  </TD>
                  <TD>
                    <StatusPill label={user.kycStatus} tone={toneForStatus(user.kycStatus)} />
                  </TD>
                  <TD>
                    <StatusPill label={user.status} tone={toneForStatus(user.status)} />
                  </TD>
                  <TD>
                    <StatusPill label={user.demoTradeOutcome} tone={toneForStatus(user.demoTradeOutcome)} />
                  </TD>
                </TRow>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
