import { useState } from 'react';
import { Lock, Monitor, Moon, Sun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme, type ThemePreference } from '../context/ThemeContext';
import { Card, Text, Avatar, Divider, Switch, Button, Dialog, TextField } from '../components';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
];

const NOTIFICATION_PREFS = [
  { key: 'withdrawals', label: 'Withdrawal requests', description: 'New withdrawal needing approval' },
  { key: 'kyc', label: 'KYC submissions', description: 'A user submits verification documents' },
  { key: 'disputes', label: 'Disputes', description: 'A chargeback or dispute is opened' },
  { key: 'deposits', label: 'Large deposits', description: 'Deposits over $1,000' },
] as const;

export function SettingsPage() {
  const { admin } = useAuth();
  const { preference, setPreference } = useTheme();

  const [require2fa, setRequire2fa] = useState(true);
  const [notifPrefs, setNotifPrefs] = useState<Record<string, boolean>>({
    withdrawals: true,
    kyc: true,
    disputes: true,
    deposits: false,
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSaved, setPasswordSaved] = useState(false);

  return (
    <div className="space-y-5">
      <Text variant="title">Settings</Text>

      <Card>
        <Text variant="sectionTitle" className="mb-4">
          Profile
        </Text>
        <div className="flex items-center gap-3">
          <Avatar name={admin?.name ?? '?'} size="xl" />
          <div>
            <Text variant="bodyMedium">{admin?.name}</Text>
            <Text variant="bodySmall" color="text-ink-secondary">
              {admin?.email}
            </Text>
            <Text variant="caption" color="text-ink-muted" className="mt-0.5">
              {admin?.role} · staff account
            </Text>
          </div>
        </div>
      </Card>

      <Card>
        <Text variant="sectionTitle" className="mb-4">
          Security
        </Text>
        <Switch
          checked={require2fa}
          onChange={setRequire2fa}
          label="Require 2FA on sign-in"
          description="Ask for a verification code every time this account signs in"
        />
        <Divider className="my-4" />
        <div className="flex items-center justify-between">
          <div>
            <Text variant="bodyMedium">Password</Text>
            <Text variant="caption" color="text-ink-muted" className="mt-0.5">
              Last changed 3 months ago
            </Text>
          </div>
          <Button
            label="Change password"
            variant="secondary"
            size="sm"
            icon={Lock}
            onClick={() => {
              setChangingPassword(true);
              setPasswordSaved(false);
            }}
          />
        </div>
      </Card>

      <Card>
        <Text variant="sectionTitle" className="mb-1">
          Notifications
        </Text>
        <Text variant="bodySmall" color="text-ink-secondary" className="mb-4">
          Choose what shows up in the notification bell.
        </Text>
        <div className="space-y-4">
          {NOTIFICATION_PREFS.map((pref, idx) => (
            <div key={pref.key}>
              {idx > 0 ? <Divider className="mb-4" /> : null}
              <Switch
                checked={notifPrefs[pref.key]}
                onChange={(v) => setNotifPrefs((prev) => ({ ...prev, [pref.key]: v }))}
                label={pref.label}
                description={pref.description}
              />
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <Text variant="sectionTitle" className="mb-4">
          Appearance
        </Text>
        <div className="flex gap-2">
          {THEME_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setPreference(opt.value)}
              className={`flex flex-1 flex-col items-center gap-2 rounded-lg border px-4 py-3 cursor-pointer ${
                preference === opt.value
                  ? 'border-accent bg-accent-soft text-accent'
                  : 'border-border text-ink-secondary hover:bg-surface-alt'
              }`}
            >
              <opt.icon className="h-5 w-5" />
              <Text variant="bodySmall" color={preference === opt.value ? 'text-accent' : undefined}>
                {opt.label}
              </Text>
            </button>
          ))}
        </div>
      </Card>

      <Dialog
        open={changingPassword}
        onClose={() => setChangingPassword(false)}
        title="Change password"
        description={passwordSaved ? undefined : 'Choose a new password for your staff account.'}
        footer={
          passwordSaved ? (
            <Button label="Done" size="sm" onClick={() => setChangingPassword(false)} />
          ) : (
            <>
              <Button label="Cancel" variant="secondary" size="sm" onClick={() => setChangingPassword(false)} />
              <Button label="Save" size="sm" onClick={() => setPasswordSaved(true)} />
            </>
          )
        }
      >
        {passwordSaved ? (
          <Text variant="bodySmall" color="text-success">
            Password updated.
          </Text>
        ) : (
          <div className="space-y-3">
            <TextField label="Current password" secure placeholder="••••••••••••" />
            <TextField label="New password" secure placeholder="••••••••••••" />
          </div>
        )}
      </Dialog>
    </div>
  );
}
