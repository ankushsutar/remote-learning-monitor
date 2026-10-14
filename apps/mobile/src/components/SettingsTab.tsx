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
import { ThemeColors } from '../theme/theme';

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
  theme: ThemeColors;
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
  onOpenPrivacyLedger,
  theme
}) => {
  const [showQrModal, setShowQrModal] = useState(false);
  const [showDevSettings, setShowDevSettings] = useState(false);
  const [qrInputText, setQrInputText] = useState('');

  const isLight = theme.mode === 'light';

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
      setTimeout(() => onPair(), 400);
    } catch {
      if (payload.trim().length > 3) {
        setStudentCode(payload.trim());
        setShowQrModal(false);
        triggerHaptic('success');
      }
    }
  };

  const maxCapacity = 10000;
  const capacityPct = Math.min(100, Math.round((pendingCount / maxCapacity) * 100));

  return (
    <View style={styles.container}>
      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Guardian & Settings</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.textMuted }]}>
          School enrollment, Android reliability & compliance
        </Text>
      </View>

      {/* Student Enrollment Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            shadowColor: theme.shadowColor
          }
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeader, { color: theme.textPrimary }]}>School Profile</Text>
          <View
            style={[
              styles.badge,
              pairedInfo
                ? {
                    backgroundColor: isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.15)',
                    borderColor: isLight ? '#10B981' : 'rgba(16, 185, 129, 0.4)'
                  }
                : {
                    backgroundColor: isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.15)',
                    borderColor: isLight ? '#F59E0B' : 'rgba(245, 158, 11, 0.4)'
                  }
            ]}
          >
            <View
              style={[
                styles.badgeDot,
                { backgroundColor: pairedInfo ? '#10B981' : '#F59E0B' }
              ]}
            />
            <Text
              style={[
                styles.badgeText,
                { color: pairedInfo ? (isLight ? '#047857' : '#10B981') : (isLight ? '#B45309' : '#F59E0B') }
              ]}
            >
              {pairedInfo ? 'CONNECTED' : 'UNPAIRED'}
            </Text>
          </View>
        </View>

        {pairedInfo ? (
          <View
            style={[
              styles.enrolledBox,
              {
                backgroundColor: isLight ? '#F8FAFC' : 'rgba(30, 41, 59, 0.55)',
                borderColor: isLight ? '#E2E8F0' : 'rgba(99, 102, 241, 0.25)'
              }
            ]}
          >
            <View style={styles.avatarRow}>
              <View style={[styles.avatarCircle, { backgroundColor: isLight ? '#0D9488' : '#6366F1' }]}>
                <Text style={styles.avatarText}>
                  {pairedInfo.studentName.charAt(0)}
                </Text>
              </View>
              <View style={styles.enrolledDetails}>
                <View style={styles.nameBadgeRow}>
                  <Text style={[styles.enrolledName, { color: theme.textPrimary }]}>{pairedInfo.studentName}</Text>
                  <View style={[styles.verifiedTag, { backgroundColor: isLight ? '#CCFBF1' : 'rgba(16, 185, 129, 0.2)' }]}>
                    <Text style={[styles.verifiedTagText, { color: isLight ? '#0F766E' : '#10B981' }]}>✓ VERIFIED</Text>
                  </View>
                </View>
                <Text style={[styles.enrolledCode, { color: theme.textSecondary }]}>
                  Device: {pairedInfo.deviceId.slice(0, 18)}...
                </Text>
                <Text style={[styles.enrolledEndpoint, { color: theme.textMuted }]} numberOfLines={1}>
                  Server: {backendUrl}
                </Text>
              </View>
            </View>

            <View style={[styles.activePill, { backgroundColor: isLight ? '#ECFDF5' : 'rgba(16, 185, 129, 0.1)', borderColor: isLight ? '#A7F3D0' : 'rgba(16, 185, 129, 0.3)' }]}>
              <View style={styles.activeDot} />
              <Text style={[styles.activeText, { color: isLight ? '#047857' : '#CBD5E1' }]}>
                WorkManager 15m Sync Active
              </Text>
            </View>
          </View>
        ) : (
          <View>
            <TouchableOpacity
              style={[
                styles.qrScanButton,
                {
                  backgroundColor: isLight ? '#F0FDFA' : 'rgba(99, 102, 241, 0.14)',
                  borderColor: isLight ? '#99F6E4' : 'rgba(99, 102, 241, 0.4)'
                }
              ]}
              activeOpacity={0.8}
              onPress={() => {
                triggerHaptic('medium');
                setShowQrModal(true);
              }}
            >
              <View style={[styles.qrIconContainer, { backgroundColor: isLight ? '#CCFBF1' : 'rgba(99, 102, 241, 0.2)' }]}>
                <Text style={styles.qrScanIcon}>📷</Text>
              </View>
              <View style={styles.qrScanTextCol}>
                <Text style={[styles.qrScanTitle, { color: theme.textPrimary }]}>Scan School Enrollment QR</Text>
                <Text style={[styles.qrScanSub, { color: theme.textSecondary }]}>Instant setup via teacher or parent portal</Text>
              </View>
              <Text style={[styles.qrScanArrow, { color: isLight ? '#0D9488' : '#818CF8' }]}>➔</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accordionHeader}
              onPress={() => {
                triggerHaptic('light');
                setShowDevSettings(!showDevSettings);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.accordionTitle, { color: isLight ? '#0D9488' : '#818CF8' }]}>
                {showDevSettings ? '▼ Manual Server Configuration' : '▶ Manual Server Configuration'}
              </Text>
            </TouchableOpacity>

            {showDevSettings && (
              <View style={[styles.devSettingsBody, { borderTopColor: theme.divider }]}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Backend Server URL</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : '#1E293B',
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary
                    }
                  ]}
                  value={backendUrl}
                  onChangeText={setBackendUrl}
                  placeholder="http://10.0.0.209:4000"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="none"
                />

                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Student Enrollment Code</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isLight ? '#F8FAFC' : '#1E293B',
                      borderColor: theme.cardBorder,
                      color: theme.textPrimary
                    }
                  ]}
                  value={studentCode}
                  onChangeText={setStudentCode}
                  placeholder="STU-94021"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="characters"
                />

                <TouchableOpacity
                  style={[styles.primaryButton, { backgroundColor: isLight ? '#0D9488' : '#4F46E5' }]}
                  onPress={() => {
                    triggerHaptic('heavy');
                    onPair();
                  }}
                  disabled={isPairing}
                  activeOpacity={0.8}
                >
                  {isPairing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.buttonText}>Pair & Authorize Device</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>

      {/* System Permissions Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            shadowColor: theme.shadowColor
          }
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeader, { color: theme.textPrimary }]}>System Permissions</Text>
          <TouchableOpacity
            onPress={() => {
              triggerHaptic('light');
              onOpenWizard();
            }}
            style={styles.wizardLink}
            activeOpacity={0.7}
          >
            <Text style={[styles.wizardLinkText, { color: isLight ? '#0D9488' : '#818CF8' }]}>
              Guided Setup ➔
            </Text>
          </TouchableOpacity>
        </View>

        <PermissionToggle
          title="Usage Access (UsageStatsManager)"
          description="Measures app foreground durations for academic focus scoring."
          isGranted={hasUsagePermission}
          onRequest={onRequestUsage}
          theme={theme}
        />

        <PermissionToggle
          title="Battery Saver Exemption"
          description="Prevents Android Doze mode from stopping background sync workers."
          isGranted={isBatteryOptimizationIgnored}
          onRequest={onRequestBattery}
          requiredText="Exempt Needed"
          theme={theme}
        />

        {!hasUsagePermission && (
          <TouchableOpacity
            style={[
              styles.restrictedAlert,
              {
                backgroundColor: isLight ? '#FFFBEB' : 'rgba(245, 158, 11, 0.12)',
                borderColor: isLight ? '#FCD34D' : 'rgba(245, 158, 11, 0.35)'
              }
            ]}
            onPress={() => {
              triggerHaptic('light');
              onOpenAppSettings();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.restrictedText, { color: isLight ? '#92400E' : '#FCD34D' }]}>
              ⚠️ <Text style={{ fontWeight: '800' }}>Moto / Android 14:</Text> If permission is greyed out, tap here ➔ Top-right menu (⋮) ➔ "Allow restricted settings".
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Offline Storage Buffer Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            shadowColor: theme.shadowColor
          }
        ]}
      >
        <View style={styles.cardHeaderRow}>
          <Text style={[styles.cardHeader, { color: theme.textPrimary }]}>Hardware Storage Outbox</Text>
          <Text style={[styles.bufferCountBadge, { color: isLight ? '#0D9488' : '#818CF8' }]}>
            {pendingCount} QUEUED
          </Text>
        </View>

        <View style={[styles.capacityTrack, { backgroundColor: isLight ? '#F1F5F9' : '#1E293B' }]}>
          <View
            style={[
              styles.capacityFill,
              {
                width: `${Math.max(2, capacityPct)}%`,
                backgroundColor: isLight ? '#0D9488' : '#6366F1'
              }
            ]}
          />
        </View>
        <Text style={[styles.capacityLabel, { color: theme.textMuted }]}>
          Hardware SQLite storage: {pendingCount} of {maxCapacity.toLocaleString()} records
        </Text>

        <View style={styles.bufferRow}>
          <View style={styles.bufferInfoCol}>
            <Text style={[styles.bufferSub, { color: theme.textSecondary }]}>
              {pendingCount === 0
                ? 'All telemetry safely synced with server'
                : 'Records buffered offline awaiting next network cycle'}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.syncButton,
              { backgroundColor: isLight ? '#0D9488' : '#4F46E5' },
              pendingCount === 0 && styles.disabledButton
            ]}
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

      {/* Student Privacy Ledger Card */}
      <TouchableOpacity
        style={[
          styles.privacyCard,
          {
            backgroundColor: isLight ? '#F8FAFC' : 'rgba(15, 23, 42, 0.78)',
            borderColor: isLight ? '#E2E8F0' : 'rgba(99, 102, 241, 0.28)'
          }
        ]}
        onPress={() => {
          triggerHaptic('light');
          onOpenPrivacyLedger();
        }}
        activeOpacity={0.8}
      >
        <View style={styles.privacyHeaderRow}>
          <View style={styles.privacyTitleGroup}>
            <Text style={styles.privacyShieldIcon}>🛡️</Text>
            <Text style={[styles.privacyHeader, { color: theme.textPrimary }]}>Student Privacy Ledger</Text>
          </View>
          <View style={styles.privacyBadge}>
            <Text style={styles.privacyBadgeText}>ZERO-CONTENT</Text>
          </View>
        </View>
        <Text style={[styles.privacyText, { color: theme.textSecondary }]}>
          Aegis operates under strict academic privacy protocols. Keystrokes, personal chats, microphone, and photos are never collected.
        </Text>
      </TouchableOpacity>

      {/* QR Scanner Modal */}
      <Modal visible={showQrModal} animationType="slide" transparent>
        <View style={styles.qrModalOverlay}>
          <View
            style={[
              styles.qrModalContent,
              {
                backgroundColor: isLight ? '#FFFFFF' : '#0F172A',
                borderColor: theme.cardBorder
              }
            ]}
          >
            <View style={styles.qrModalHeader}>
              <Text style={[styles.qrModalTitle, { color: theme.textPrimary }]}>Scan Enrollment QR</Text>
              <TouchableOpacity
                onPress={() => setShowQrModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.qrModalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.scannerReticleContainer}>
              <View
                style={[
                  styles.scannerReticle,
                  {
                    backgroundColor: isLight ? '#F8FAFC' : 'rgba(15, 23, 42, 0.8)',
                    borderColor: isLight ? '#0D9488' : 'rgba(99, 102, 241, 0.3)'
                  }
                ]}
              >
                <View style={[styles.corner, styles.cornerTL, { borderColor: isLight ? '#0D9488' : '#6366F1' }]} />
                <View style={[styles.corner, styles.cornerTR, { borderColor: isLight ? '#0D9488' : '#6366F1' }]} />
                <View style={[styles.corner, styles.cornerBL, { borderColor: isLight ? '#0D9488' : '#6366F1' }]} />
                <View style={[styles.corner, styles.cornerBR, { borderColor: isLight ? '#0D9488' : '#6366F1' }]} />
                <View style={[styles.scanLaser, { backgroundColor: isLight ? '#0D9488' : '#10B981' }]} />
                <Text style={[styles.scannerHint, { color: theme.textMuted }]}>Align school QR code inside frame</Text>
              </View>
            </View>

            <View style={styles.qrPasteSection}>
              <Text style={[styles.qrPasteLabel, { color: theme.textSecondary }]}>Or paste student enrollment token:</Text>
              <TextInput
                style={[
                  styles.qrInput,
                  {
                    backgroundColor: isLight ? '#F1F5F9' : '#1E293B',
                    borderColor: theme.cardBorder,
                    color: theme.textPrimary
                  }
                ]}
                placeholder='{"server":"http://...","code":"STU-94021"}'
                placeholderTextColor="#94A3B8"
                value={qrInputText}
                onChangeText={setQrInputText}
              />
              <View style={styles.qrButtonRow}>
                <TouchableOpacity
                  style={[styles.qrSubmitButton, { backgroundColor: isLight ? '#0D9488' : '#4F46E5' }]}
                  onPress={() => handleQrPayload(qrInputText || '{"server":"http://10.0.0.209:4000","code":"STU-94021"}')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.qrSubmitText}>Authorize Code</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.qrSimulateButton, { backgroundColor: isLight ? '#F1F5F9' : 'rgba(30, 41, 59, 0.8)' }]}
                  onPress={() => handleQrPayload('{"server":"http://10.0.0.209:4000","code":"STU-94021"}')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.qrSimulateText, { color: theme.textSecondary }]}>Use Sample QR</Text>
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
    paddingBottom: 96
  },
  titleSection: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.6
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  cardHeader: {
    fontSize: 15,
    fontWeight: '800'
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  enrolledBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900'
  },
  enrolledDetails: {
    flex: 1
  },
  nameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  enrolledName: {
    fontSize: 15,
    fontWeight: '800'
  },
  verifiedTag: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4
  },
  verifiedTagText: {
    fontSize: 8,
    fontWeight: '800'
  },
  enrolledCode: {
    fontSize: 11,
    marginTop: 2
  },
  enrolledEndpoint: {
    fontSize: 10,
    marginTop: 1
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 8
  },
  activeText: {
    fontSize: 11,
    fontWeight: '700'
  },
  qrScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12
  },
  qrIconContainer: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  qrScanIcon: {
    fontSize: 20
  },
  qrScanTextCol: {
    flex: 1
  },
  qrScanTitle: {
    fontSize: 14,
    fontWeight: '800'
  },
  qrScanSub: {
    fontSize: 11,
    marginTop: 2
  },
  qrScanArrow: {
    fontSize: 16,
    fontWeight: '800'
  },
  accordionHeader: {
    paddingVertical: 8
  },
  accordionTitle: {
    fontSize: 12,
    fontWeight: '700'
  },
  devSettingsBody: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
    marginTop: 8
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13
  },
  primaryButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800'
  },
  wizardLink: {
    paddingVertical: 2
  },
  wizardLinkText: {
    fontSize: 12,
    fontWeight: '800'
  },
  restrictedAlert: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 10
  },
  restrictedText: {
    fontSize: 12,
    lineHeight: 17
  },
  bufferCountBadge: {
    fontSize: 10,
    fontWeight: '800'
  },
  capacityTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 6
  },
  capacityFill: {
    height: '100%',
    borderRadius: 2
  },
  capacityLabel: {
    fontSize: 10,
    marginBottom: 12
  },
  bufferRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  bufferInfoCol: {
    flex: 1,
    marginRight: 12
  },
  bufferSub: {
    fontSize: 12
  },
  syncButton: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10
  },
  disabledButton: {
    opacity: 0.5
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12
  },
  privacyCard: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14
  },
  privacyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  privacyTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  privacyShieldIcon: {
    fontSize: 16
  },
  privacyHeader: {
    fontSize: 14,
    fontWeight: '800'
  },
  privacyBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  privacyBadgeText: {
    color: '#10B981',
    fontSize: 9,
    fontWeight: '800'
  },
  privacyText: {
    fontSize: 12,
    lineHeight: 18
  },
  qrModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20
  },
  qrModalContent: {
    borderWidth: 1,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10
  },
  qrModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  qrModalTitle: {
    fontSize: 18,
    fontWeight: '800'
  },
  qrModalClose: {
    fontSize: 18,
    color: '#94A3B8',
    padding: 4
  },
  scannerReticleContainer: {
    alignItems: 'center',
    marginVertical: 14
  },
  scannerReticle: {
    width: 200,
    height: 200,
    borderWidth: 1,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative'
  },
  corner: {
    position: 'absolute',
    width: 20,
    height: 20
  },
  cornerTL: {
    top: -1,
    left: -1,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8
  },
  cornerTR: {
    top: -1,
    right: -1,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8
  },
  cornerBL: {
    bottom: -1,
    left: -1,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8
  },
  cornerBR: {
    bottom: -1,
    right: -1,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8
  },
  scanLaser: {
    position: 'absolute',
    width: '90%',
    height: 2
  },
  scannerHint: {
    fontSize: 11,
    marginTop: 60,
    fontWeight: '600'
  },
  qrPasteSection: {
    marginTop: 8
  },
  qrPasteLabel: {
    fontSize: 11,
    marginBottom: 6,
    fontWeight: '600'
  },
  qrInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 12
  },
  qrButtonRow: {
    flexDirection: 'row',
    gap: 8
  },
  qrSubmitButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  qrSubmitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800'
  },
  qrSimulateButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center'
  },
  qrSimulateText: {
    fontSize: 12,
    fontWeight: '700'
  }
});
