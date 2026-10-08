import React, { useState } from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { IdDocumentType, KycFile, KycFileType } from '../../api/backend';
import { Button } from '../../components/Button';
import { PickerField } from '../../components/PickerField';
import { Row } from '../../components/Row';
import { useKycStore } from '../../store/kyc';
import { useStyles, useTheme, withAlpha } from '../../theme';

const DOC_TYPES: Record<string, IdDocumentType> = {
  Passport: 'passport',
  'National ID card': 'national_id',
  "Driver's license": 'driver_license',
};

interface Slot {
  type: KycFileType;
  label: string;
}

function slotsFor(doc: IdDocumentType): Slot[] {
  const id: Slot[] =
    doc === 'passport'
      ? [{ type: 'passport', label: 'Passport photo page' }]
      : [
          { type: 'id_front', label: 'Front side' },
          { type: 'id_back', label: 'Back side' },
        ];
  return [...id, { type: 'proof_of_address', label: 'Proof of address' }];
}

interface Props {
  userId: string;
  /** Personal data must be filled (and is saved) before documents can be sent. */
  requiredFilled: boolean;
  saveProfile: () => Promise<string | null>;
}

/** Identity verification: pick an ID type, attach photos, send them to staff for review. */
export function KycSection({ userId, requiredFilled, saveProfile }: Props) {
  const { colors } = useTheme();
  const status = useKycStore((s) => s.status);
  const rejectionReason = useKycStore((s) => s.rejectionReason);
  const submit = useKycStore((s) => s.submit);
  const [docLabel, setDocLabel] = useState<string | null>(null);
  const [files, setFiles] = useState<Partial<Record<KycFileType, ImagePicker.ImagePickerAsset>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const styles = useStyles((t) => ({
    divider: { height: 1, backgroundColor: t.colors.border },
    banner: {
      flexDirection: 'row',
      gap: t.spacing.md,
      padding: t.spacing.md,
      borderRadius: t.radius.md,
      backgroundColor: withAlpha(t.colors.down, 0.12),
      borderWidth: 1,
      borderColor: t.colors.down,
    },
    bannerText: { ...t.typography.label, color: t.colors.text, flex: 1, lineHeight: 18 },
    slots: { flexDirection: 'row', flexWrap: 'wrap', gap: t.spacing.sm },
    slot: {
      flexGrow: 1,
      flexBasis: '30%',
      minWidth: 96,
      height: 110,
      borderWidth: 1.5,
      borderStyle: 'dashed',
      borderColor: t.colors.border,
      borderRadius: t.radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      overflow: 'hidden',
      padding: 6,
    },
    slotDone: { borderStyle: 'solid', borderColor: t.colors.up },
    thumb: { ...({ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const), opacity: 0.55 },
    slotText: { ...t.typography.caption, color: t.colors.text, textAlign: 'center', fontWeight: '700' },
    note: { ...t.typography.caption, color: t.colors.muted, lineHeight: 15 },
    error: { ...t.typography.label, color: t.colors.down },
    statusText: { fontWeight: '700', fontSize: 12 },
  }));

  const emailRow = (
    <Row
      left={<Ionicons name="checkmark-circle" size={24} color={colors.up} />}
      title="Email address"
      subtitle="Confirmed with your sign-up code"
      right={<Text style={[styles.statusText, { color: colors.up }]}>Verified</Text>}
    />
  );

  if (status === 'verified' || status === 'pending') {
    const done = status === 'verified';
    return (
      <>
        {emailRow}
        <View style={styles.divider} />
        <Row
          left={<Ionicons name={done ? 'checkmark-circle' : 'time'} size={24} color={done ? colors.up : colors.warn} />}
          title="Identity documents"
          subtitle={done ? 'Your identity has been verified' : "Our team is reviewing your documents. We'll notify you."}
          right={<Text style={[styles.statusText, { color: done ? colors.up : colors.warn }]}>{done ? 'Verified' : 'In review'}</Text>}
        />
      </>
    );
  }

  if (!requiredFilled) {
    return (
      <View style={styles.banner}>
        <Ionicons name="alert-circle" size={20} color={colors.down} />
        <Text style={styles.bannerText}>You need to fill your personal data before verifying your account.</Text>
      </View>
    );
  }

  const docType = docLabel ? DOC_TYPES[docLabel] : null;
  const slots = docType ? slotsFor(docType) : [];
  const complete = slots.length > 0 && slots.every((s) => files[s.type]);

  const attach = (slot: Slot, asset: ImagePicker.ImagePickerAsset) => setFiles((f) => ({ ...f, [slot.type]: asset }));

  const fromCamera = async (slot: Slot) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert('Camera access needed', 'Allow camera access in your phone settings, or choose a photo instead.');
    const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) attach(slot, res.assets[0]);
  };

  const fromLibrary = async (slot: Slot) => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
    if (!res.canceled && res.assets?.[0]) attach(slot, res.assets[0]);
  };

  const pick = (slot: Slot) =>
    Alert.alert(slot.label, 'Make sure the whole document is visible and readable.', [
      { text: 'Take photo', onPress: () => void fromCamera(slot) },
      { text: 'Choose from gallery', onPress: () => void fromLibrary(slot) },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const send = async () => {
    if (!docType || !complete || submitting) return;
    setSubmitting(true);
    setError(null);
    const saveErr = await saveProfile();
    const err =
      saveErr ??
      (await submit(
        userId,
        docType,
        slots.map<KycFile>((s) => ({
          type: s.type,
          label: s.type === 'proof_of_address' ? 'Proof of address' : `${docLabel} — ${s.label.toLowerCase()}`,
          uri: files[s.type]!.uri,
          mimeType: files[s.type]!.mimeType,
        }))
      ));
    setSubmitting(false);
    if (err) return setError(err);
    setFiles({});
    Alert.alert('Documents sent', "Our team will review your documents. You'll get a notification when it's done.");
  };

  return (
    <View style={{ gap: 12 }}>
      {emailRow}
      {status === 'rejected' && (
        <View style={styles.banner}>
          <Ionicons name="close-circle" size={20} color={colors.down} />
          <Text style={styles.bannerText}>
            Your last submission was rejected{rejectionReason ? `: ${rejectionReason}` : '.'} Please upload new documents.
          </Text>
        </View>
      )}
      <PickerField
        label="Identity document"
        icon="card-outline"
        value={docLabel}
        placeholder="Choose document type"
        options={Object.keys(DOC_TYPES)}
        onChange={(v) => {
          setDocLabel(v);
          setFiles({});
        }}
      />
      {slots.length > 0 && (
        <>
          <View style={styles.slots}>
            {slots.map((slot) => {
              const file = files[slot.type];
              return (
                <Pressable
                  key={slot.type}
                  style={[styles.slot, file && styles.slotDone]}
                  onPress={() => pick(slot)}
                  accessibilityRole="button"
                  accessibilityLabel={`Upload ${slot.label}`}
                >
                  {file && <Image source={{ uri: file.uri }} style={styles.thumb} />}
                  <Ionicons name={file ? 'checkmark-circle' : 'cloud-upload-outline'} size={24} color={file ? colors.up : colors.accent} />
                  <Text style={styles.slotText}>{slot.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.note}>
            Proof of address: a utility bill or bank statement from the last 3 months showing your name and address. Files are stored privately
            and only seen by our verification team.
          </Text>
        </>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
      <Button title="Submit for review" onPress={send} loading={submitting} disabled={!complete || submitting} />
    </View>
  );
}
