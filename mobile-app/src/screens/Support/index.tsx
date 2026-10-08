import React from 'react';
import { Alert, Text } from 'react-native';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { ScreenHeader } from '../../components/ScreenHeader';
import { useStyles } from '../../theme';

/** Support tab: a "contact" placeholder — there's no real support desk here. */
export default function SupportScreen() {
  const styles = useStyles((t) => ({
    section: { ...t.typography.subheading, color: t.colors.text, marginBottom: t.spacing.xs },
    note: { ...t.typography.label, color: t.colors.muted, lineHeight: 19 },
  }));

  return (
    <Screen>
      <ScreenHeader title="Support" />

      <Card style={{ gap: 12 }}>
        <Text style={styles.section}>Contact support</Text>
        <Text style={styles.note}>
          This is a demo app with no live support desk or backend. In a real deployment, this is where live chat or a
          ticket form would go.
        </Text>
        <Button
          title="Message support"
          variant="outline"
          onPress={() => Alert.alert('Demo app', 'There is no support desk in this demo.')}
        />
      </Card>
    </Screen>
  );
}
