import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal
} from 'react-native';
import { PermissionToggle } from './PermissionToggle';
import { triggerHaptic } from '../utils/haptics';

interface SettingsTabProps {
  backendUrl: string;
  setBackendUrl: (url: string) => void;
  studentCode: string;
  setStudentCode: (code: string) => void;
  isPairing: boolean;
  onPair: () => void;
  pairedInfo: { studentName: string; deviceId: string } | null;
  hasUsagePermission: boolean;
  isBatteryOptimizationIgnored: boolean;
  onRequestUsage: () => void;
  onRequestBattery: () => void;
  onOpenAppSettings: () => void;
  pendingCount: number;
  isSyncing: boolean;
  onSync: () => void;
  onOpenWizard: () => void;
  onOpenPrivacyLedger: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  backendUrl,
  setBackendUrl,
  studentCode,
  setStudentCode,
  isPairing,
  onPair,
  pairedInfo,
  hasUsagePermission,
  isBatteryOptimizationIgnored,
  onRequestUsage,
  onRequestBattery,
  onOpenAppSettings,
  pendingCount,
  isSyncing,
  onSync,
  onOpenWizard,
  onOpenPrivacyLedger
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [qrInputText, setQrInputText] = useState('');

  // Handle scanned or pasted QR payload
  const handleQrPayload = (payload: string) => {
    try {
      if (payload.startsWith('aegis://enroll') || payload.startsWith('http')) {
        const urlObj = new URL(payload.startsWith('aegis') ? payload.replace('aegis://enroll', 'http://placeholder') : payload);
        const server = urlObj.searchParams.get('server');
        const code = urlObj.searchParams.get('code');
        if (server) setBackendUrl(server);
        if (code) setStudentCode(code);
      } else {
        const parsed = JSON.parse(payload);
        if (parsed.server) setBackendUrl(parsed.server);
        if (parsed.code) setStudentCode(parsed.code);
      }
      setShowQrModal(false);
      triggerHaptic('success');
      // Automatically trigger pair
      setTimeout(() => onPair(), 400);
    } catch {
      // Direct raw text enrollment code
      if (payload.trim().length > 3) {
        setStudentCode(payload.trim());
        setShowQrModal(false);
        triggerHaptic('success');
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Title */}
      <Text style={styles.sectionTitle}>Device & Security Settings</Text>
      <Text style={styles.sectionSubtitle}>School pairing, system reliability & privacy controls</Text>

      {/* Student Enrollment Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeader}>School Enrollment</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pairedInfo ? 'CONNECTED' : 'UNPAIRED'}</Text>
          </View>
        </View>

        {pairedInfo ? (
          <View style={styles.enrolledBox}>
            <View style={styles.avatarRow}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {pairedInfo.studentName.charAt(0)}
                </Text>
              </View>
              <View style={styles.enrolledDetails}>
                <Text style={styles.enrolledName}>{pairedInfo.studentName}</Text>
                <Text style={styles.enrolledCode}>Device ID: {pairedInfo.deviceId.slice(0, 16)}...</Text>
                <Text style={styles.enrolledEndpoint}>Server: {backendUrl}</Text>
              </View>
            </View>

            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>Native Outbox & WorkManager Active (15m Sync)</Text>
            </View>
          </View>
        ) : (
          <View>
            {/* Quick QR Scanner Action */}
            <TouchableOpacity
              style={styles.qrScanButton}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('medium');
                setShowQrModal(true);
              }}
            >
              <Text style={styles.qrScanIcon}>📷</Text>
              <View style={styles.qrScanTextCol}>
                <Text style={styles.qrScanTitle}>Scan School Enrollment QR Code</Text>
                <Text style={styles.qrScanSub}>Instant pairing via teacher or parent portal</Text>
              </View>
              <Text style={styles.qrScanArrow}>➔</Text>
            </TouchableOpacity>

            {/* Expandable Developer / Manual Server Settings Accordion */}
            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => setShowDevSettings(!showDevSettings)}
              activeOpacity={0.7}
            >
              <Text style={styles.accordionTitle}>
                {showDevSettings ? '▼ Advanced / Manual Configuration' : '▶ Advanced / Manual Configuration'}
              </Text>
            </TouchableOpacity>

            {showDevSettings && (
              <View style={styles.devSettingsBody}>
                <Text style={styles.inputLabel}>Backend Server URL</Text>
                <TextInput
                  style={styles.input}
                  value={backendUrl}
                  onChangeText={setBackendUrl}
                  placeholder="http://10.0.0.209:4000"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                />

                <Text style={styles.inputLabel}>Student Enrollment Code</Text>
                <TextInput
                  style={styles.input}
                  value={studentCode}
                  onChangeText={setStudentCode}
                  placeholder="STU-94021"
                  placeholderTextColor="#64748B"
                  autoCapitalize="characters"
                />

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => {
                    triggerHaptic('heavy');
                    onPair();
                  }}
                  disabled={isPairing}
                  activeOpacity={0.8}
                >
                  {isPairing ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Pair & Authorize Device</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* System Permissions & Guided Wizard Card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardHeader}>System Permissions</Text>
          <TouchableOpacity onPress={onOpenWizard} style={styles.wizardLink}>
            <Text style={styles.wizardLinkText}>Open Guided Wizard ➔</Text>
          </TouchableOpacity>
        </View>

        <PermissionToggle
          title="Usage Access (UsageStatsManager)"
          description="Measures application foreground intervals for academic focus scoring."
          isGranted={hasUsagePermission}
          onRequest={onRequestUsage}
        />

        <PermissionToggle
          title="Battery Saver Exemption"
          description="Prevents Android Doze mode from sleeping background sync workers."
          isGranted={isBatteryOptimizationIgnored}
          onRequest={onRequestBattery}
          requiredText="Exempt Needed"
        />

        {!hasUsagePermission && (
          <TouchableOpacity
            style={styles.restrictedAlert}
            onPress={onOpenAppSettings}
            activeOpacity={0.7}
          >
            <Text style={styles.restrictedText}>
              ⚠️ On Android 13/14: If greyed out, tap here ➔ Top-right (⋮) ➔ "Allow restricted settings".
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Offline Storage Diagnostics */}
      <View style={styles.card}>
        <Text style={styles.cardHeader}>Unified Native Storage Outbox</Text>
        <View style={styles.bufferRow}>
          <View>
            <Text style={styles.bufferTitle}>{pendingCount} Records Buffered</Text>
            <Text style={styles.bufferSub}>Encrypted hardware SQLite store (Max 10k)</Text>
          </View>

          <TouchableOpacity
            style={[styles.syncButton, pendingCount === 0 && styles.disabledButton]}
            onPress={() => {
              triggerHaptic('light');
              onSync();
            }}
            disabled={isSyncing || pendingCount === 0}
            activeOpacity={0.8}
          >
            {isSyncing ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.syncButtonText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Privacy Guarantee Transparency Card */}
      <TouchableOpacity style={styles.privacyCard} onPress={onOpenPrivacyLedger} activeOpacity={0.8}>
        <View style={styles.privacyHeaderRow}>
          <Text style={styles.privacyHeader}>🛡️ Student Privacy Ledger</Text>
          <Text style={styles.privacyBadge}>ZERO-CONTENT</Text>
        </View>
        <Text style={styles.privacyText}>
          Aegis operates under strict educational data compliance. Keystrokes, personal chats, microphone, and photos are never monitored. Tap to review the full privacy audit.
        </Text>
      </TouchableOpacity>

      {/* QR Code Scanner / Emulator Simulator Modal */}
      <Modal visible={showQrModal} animationType="slide" transparent>
        <View style={styles.qrModalOverlay}>
          <View style={styles.qrModalContent}>
            <View style={styles.qrModalHeader}>
              <Text style={styles.qrModalTitle}>Scan Enrollment QR</Text>
              <TouchableOpacity onPress={() => setShowQrModal(false)}>
                <Text style={styles.qrModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Visual Scanner Reticle */}
            <View style={styles.scannerReticleContainer}>
              <View style={styles.scannerReticle}>
                <View style={[styles.corner, styles.cornerTL]} />
                <View style={[styles.corner, styles.cornerTR]} />
                <View style={[styles.corner, styles.cornerBL]} />
                <View style={[styles.corner, styles.cornerBR]} />
                <View style={styles.scanLaser} />
                <Text style={styles.scannerHint}>Align school QR code within frame</Text>
              </View>
            </View>

            {/* Quick Test / Paste Fallback */}
            <View style={styles.qrPasteSection}>
              <Text style={styles.qrPasteLabel}>Or paste QR payload / code:</Text>
              <TextInput
                style={styles.qrInput}
                placeholder='{"server":"http://...","code":"STU-94021"}'
                placeholderTextColor="#64748B"
                value={qrInputText}
                onChangeText={setQrInputText}
              />
              <View style={styles.qrButtonRow}>
                <TouchableOpacity
                  style={styles.qrSubmitButton}
                  onPress={() => handleQrPayload(qrInputText || '{"server":"http://10.0.0.209:4000","code":"STU-94021"}')}
                >
                  <Text style={styles.qrSubmitText}>Submit Payload</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.qrSimulateButton}
                  onPress={() => handleQrPayload('{"server":"http://10.0.0.209:4000","code":"STU-94021"}')}
                >
                  <Text style={styles.qrSimulateText}>Use Sample QR</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 90
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 16
  },
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14
  },
  cardHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6
  },
  badgeText: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '800'
  },
  enrolledBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)'
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800'
  },
  enrolledDetails: {
    flex: 1
  },
  enrolledName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  enrolledCode: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 1
  },
  enrolledEndpoint: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8
  },
  activeText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '600'
  },
  qrScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderWidth: 1,
    borderColor: '#6366F1',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  },
  qrScanIcon: {
    fontSize: 24,
    marginRight: 12
  },
  qrScanTextCol: {
    flex: 1
  },
  qrScanTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  qrScanSub: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 2
  },
  qrScanArrow: {
    color: '#818CF8',
    fontSize: 16,
    fontWeight: '700'
  },
  accordionHeader: {
    paddingVertical: 8
  },
  accordionTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600'
  },
  devSettingsBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B'
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 6,
    marginTop: 10
  },
  input: {
    backgroundColor: '#020617',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#F8FAFC',
    fontSize: 14
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 16
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14
  },
  wizardLink: {
    paddingVertical: 4
  },
  wizardLinkText: {
    color: '#818CF8',
    fontSize: 12,
    fontWeight: '700'
  },
  restrictedAlert: {
    marginTop: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12
  },
  restrictedText: {
    color: '#F59E0B',
    fontSize: 11,
    lineHeight: 16
  },
  bufferRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  bufferTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F8FAFC'
  },
  bufferSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2
  },
  syncButton: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  disabledButton: {
    opacity: 0.5
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600'
  },
  privacyCard: {
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderColor: '#1E293B',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14
  },
  privacyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  privacyHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0'
  },
  privacyBadge: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800'
  },
  privacyText: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  qrModalContent: {
    width: '100%',
    backgroundColor: '#0E131F',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E2538'
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  qrModalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700'
  },
  qrModalClose: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '700'
  },
  scannerReticleContainer: {
    alignItems: 'center',
    marginVertical: 12
  },
  scannerReticle: {
    width: 200,
    height: 200,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center'
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#6366F1'
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  scanLaser: {
    width: '80%',
    height: 2,
    backgroundColor: '#818CF8',
    marginBottom: 16
  },
  scannerHint: {
    color: '#9CA3AF',
    fontSize: 11
  },
  qrPasteSection: {
    marginTop: 12
  },
  qrPasteLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 6
  },
  qrInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1E2538',
    borderRadius: 8,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 10
  },
  qrButtonRow: {
    flexDirection: 'row',
    gap: 8
  },
  qrSubmitButton: {
    flex: 1,
    backgroundColor: '#4F46E5',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  qrSubmitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700'
  },
  qrSimulateButton: {
    backgroundColor: '#1E2538',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center'
  },
  qrSimulateText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600'
  }
});
