import { fetchLedger } from '../api/adminService';
import { useAsyncData } from '../hooks/useAsyncData';
import { Card, Text, Table, THead, TBody, TRow, TH, TD } from '../components';
import { formatCurrency } from '../utils/formatters';

export function LedgerPage() {
  const { data } = useAsyncData(fetchLedger, []);

  return (
    <div>
      <Text variant="title">Ledger</Text>
      <Text variant="bodySmall" color="text-ink-secondary" className="mt-1 mb-4">
        Append-only, double-entry. Each transaction posts balanced debits and credits — every row pair
        sums to zero.
      </Text>

      <Card padded={false}>
        <Table>
          <THead>
            <TRow className="hover:bg-transparent">
              <TH>Tx ID</TH>
              <TH>Type</TH>
              <TH>Account</TH>
              <TH>Amount</TH>
              <TH>Balance</TH>
            </TRow>
          </THead>
          <TBody>
            {data.map((tx) =>
              tx.rows.map((row, idx) => (
                <TRow key={`${tx.txId}-${idx}`} className="hover:bg-transparent">
                  <TD className="font-mono text-ink-secondary">{idx === 0 ? tx.txId : ''}</TD>
                  <TD className="text-ink-muted">{idx === 0 ? tx.type : ''}</TD>
                  <TD className="font-mono">{row.account}</TD>
                  <TD className={row.amount >= 0 ? 'text-success font-medium' : ''}>
                    {formatCurrency(row.amount)}
                  </TD>
                  <TD className="text-ink-muted">
                    {row.balance != null ? formatCurrency(row.balance) : '—'}
                  </TD>
                </TRow>
              ))
            )}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}
