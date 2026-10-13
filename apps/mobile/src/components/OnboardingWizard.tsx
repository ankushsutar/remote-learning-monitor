import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Platform,
  AppState,
  AppStateStatus
} from 'react-native';
import { triggerHaptic } from '../utils/haptics';

interface OnboardingWizardProps {
  visible: boolean;
  onClose: () => void;
  hasUsagePermission: boolean;
  isBatteryOptimizationIgnored: boolean;
  onRequestUsage: () => void;
  onRequestBattery: () => void;
  onOpenAppSettings: () => void;
  onRefresh: () => void;
}

type OEMType = 'samsung' | 'xiaomi' | 'oppo_vivo' | 'pixel_stock';

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  visible,
  onClose,
  hasUsagePermission,
  isBatteryOptimizationIgnored,
  onRequestUsage,
  onRequestBattery,
  onOpenAppSettings,
  onRefresh
}) => {
  const [selectedOem, setSelectedOem] = useState<OEMType>('samsung');
  const [notificationsAllowed, setNotificationsAllowed] = useState(true);

  // Re-check permissions automatically when returning from Android Settings
  useEffect(() => {
    if (!AppState || typeof AppState.addEventListener !== 'function') return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        onRefresh();
        if (hasUsagePermission && isBatteryOptimizationIgnored) {
          triggerHaptic('success');
        }
      }
    });

    return () => {
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
      }
    };
  }, [hasUsagePermission, isBatteryOptimizationIgnored, onRefresh]);

  const allPermissionsGranted = hasUsagePermission && isBatteryOptimizationIgnored;
  const grantedCount = (hasUsagePermission ? 1 : 0) + (isBatteryOptimizationIgnored ? 1 : 0) + (notificationsAllowed ? 1 : 0);

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>SETUP WIZARD</Text>
              </View>
              <Text style={styles.stepProgress}>{grantedCount}/3 Verified</Text>
            </View>
            <Text style={styles.title}>System Permissions & Reliability</Text>
            <Text style={styles.subtitle}>
              Aegis requires 3 Android system permissions to reliably track learning engagement in the background without being suspended by OEM battery managers.
            </Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(grantedCount / 3) * 100}%` }]} />
          </View>

          {/* Step 1: Usage Access */}
          <View style={[styles.stepCard, hasUsagePermission && styles.stepCardGranted]}>
            <View style={styles.stepCardHeader}>
              <View style={[styles.stepNumberBadge, hasUsagePermission && styles.stepNumberBadgeGranted]}>
                <Text style={styles.stepNumberText}>{hasUsagePermission ? '✓' : '1'}</Text>
              </View>
              <View style={styles.stepTitleContainer}>
                <Text style={styles.stepTitle}>App Usage Statistics</Text>
                <Text style={styles.stepRequirement}>MANDATORY • UsageStatsManager</Text>
              </View>
              <View style={[styles.statusPill, hasUsagePermission ? styles.pillGranted : styles.pillPending]}>
                <Text style={[styles.statusPillText, hasUsagePermission ? styles.pillTextGranted : styles.pillTextPending]}>
                  {hasUsagePermission ? 'ACTIVE' : 'ACTION REQUIRED'}
                </Text>
              </View>
            </View>
            <Text style={styles.stepDescription}>
              Allows Aegis to record when educational apps (Google Classroom, Khan Academy, Canvas) are in the foreground. Never reads text, messages, or screen pixels.
            </Text>
            {!hasUsagePermission ? (
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('light');
                  onRequestUsage();
                }}
              >
                <Text style={styles.actionButtonText}>Grant Usage Access ➔</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.verifiedRow}>
                <Text style={styles.verifiedText}>✓ Verified by Android AppOpsManager</Text>
              </View>
            )}
          </View>

          {/* Step 2: Battery Optimization Bypass */}
          <View style={[styles.stepCard, isBatteryOptimizationIgnored && styles.stepCardGranted]}>
            <View style={styles.stepCardHeader}>
              <View style={[styles.stepNumberBadge, isBatteryOptimizationIgnored && styles.stepNumberBadgeGranted]}>
                <Text style={styles.stepNumberText}>{isBatteryOptimizationIgnored ? '✓' : '2'}</Text>
              </View>
              <View style={styles.stepTitleContainer}>
                <Text style={styles.stepTitle}>Battery Saver Exemption</Text>
                <Text style={styles.stepRequirement}>MANDATORY • Android Doze Bypass</Text>
              </View>
              <View style={[styles.statusPill, isBatteryOptimizationIgnored ? styles.pillGranted : styles.pillPending]}>
                <Text style={[styles.statusPillText, isBatteryOptimizationIgnored ? styles.pillTextGranted : styles.pillTextPending]}>
                  {isBatteryOptimizationIgnored ? 'ACTIVE' : 'ACTION REQUIRED'}
                </Text>
              </View>
            </View>
            <Text style={styles.stepDescription}>
              Prevents Android 14 Doze Mode from killing the 15-minute periodic background telemetry sync when the device screen is off or idle.
            </Text>
            {!isBatteryOptimizationIgnored ? (
              <TouchableOpacity
                style={styles.actionButton}
                activeOpacity={0.8}
                onPress={() => {
                  triggerHaptic('light');
                  onRequestBattery();
                }}
              >
                <Text style={styles.actionButtonText}>Exempt From Battery Saver ➔</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.verifiedRow}>
                <Text style={styles.verifiedText}>✓ Whitelisted in PowerManager</Text>
              </View>
            )}
          </View>

          {/* Step 3: Notification & Exact Alarm */}
          <View style={[styles.stepCard, notificationsAllowed && styles.stepCardGranted]}>
            <View style={styles.stepCardHeader}>
              <View style={[styles.stepNumberBadge, notificationsAllowed && styles.stepNumberBadgeGranted]}>
                <Text style={styles.stepNumberText}>{notificationsAllowed ? '✓' : '3'}</Text>
              </View>
              <View style={styles.stepTitleContainer}>
                <Text style={styles.stepTitle}>Reliability Heartbeat</Text>
                <Text style={styles.stepRequirement}>RECOMMENDED • WorkManager & Tamper Alerts</Text>
              </View>
              <View style={[styles.statusPill, styles.pillGranted]}>
                <Text style={[styles.statusPillText, styles.pillTextGranted]}>ENABLED</Text>
              </View>
            </View>
            <Text style={styles.stepDescription}>
              Enables background sync heartbeat and warns the student immediately if telemetry sync fails for more than 2 hours.
            </Text>
            <View style={styles.verifiedRow}>
              <Text style={styles.verifiedText}>✓ Background WorkManager Sync Scheduled</Text>
            </View>
          </View>

          {/* OEM Background Killer Guide */}
          <View style={styles.oemContainer}>
            <View style={styles.oemHeader}>
              <Text style={styles.oemTitle}>📱 OEM Background Kill Prevention</Text>
              <Text style={styles.oemSubtitle}>Select your phone manufacturer to prevent background termination:</Text>
            </View>

            {/* Manufacturer Selector */}
            <View style={styles.oemTabs}>
              <TouchableOpacity
                style={[styles.oemTab, selectedOem === 'samsung' && styles.oemTabActive]}
                onPress={() => setSelectedOem('samsung')}
              >
                <Text style={[styles.oemTabText, selectedOem === 'samsung' && styles.oemTabTextActive]}>Samsung</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.oemTab, selectedOem === 'xiaomi' && styles.oemTabActive]}
                onPress={() => setSelectedOem('xiaomi')}
              >
                <Text style={[styles.oemTabText, selectedOem === 'xiaomi' && styles.oemTabTextActive]}>Xiaomi / Redmi</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.oemTab, selectedOem === 'oppo_vivo' && styles.oemTabActive]}
                onPress={() => setSelectedOem('oppo_vivo')}
              >
                <Text style={[styles.oemTabText, selectedOem === 'oppo_vivo' && styles.oemTabTextActive]}>Oppo / Vivo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.oemTab, selectedOem === 'pixel_stock' && styles.oemTabActive]}
                onPress={() => setSelectedOem('pixel_stock')}
              >
                <Text style={[styles.oemTabText, selectedOem === 'pixel_stock' && styles.oemTabTextActive]}>Pixel / Moto</Text>
              </TouchableOpacity>
            </View>

            {/* OEM Instruction Box */}
            <View style={styles.instructionBox}>
              {selectedOem === 'samsung' && (
                <Text style={styles.instructionText}>
                  1. Open <Text style={styles.boldText}>Settings ➔ Battery and device care ➔ Battery</Text>{'\n'}
                  2. Tap <Text style={styles.boldText}>Background usage limits ➔ Never sleeping apps</Text>{'\n'}
                  3. Tap <Text style={styles.boldText}>+ (Add)</Text> and add <Text style={styles.boldText}>Student Telemetry Client</Text>.
                </Text>
              )}
              {selectedOem === 'xiaomi' && (
                <Text style={styles.instructionText}>
                  1. Open <Text style={styles.boldText}>Security App ➔ Manage Apps ➔ Permissions</Text>{'\n'}
                  2. Enable <Text style={styles.boldText}>Autostart</Text> for Student Telemetry Client.{'\n'}
                  3. Set <Text style={styles.boldText}>Battery Saver</Text> to <Text style={styles.boldText}>No restrictions</Text>.
                </Text>
              )}
              {selectedOem === 'oppo_vivo' && (
                <Text style={styles.instructionText}>
                  1. Open <Text style={styles.boldText}>Settings ➔ Battery ➔ More battery settings</Text>{'\n'}
                  2. Tap <Text style={styles.boldText}>App battery management</Text>{'\n'}
                  3. Enable <Text style={styles.boldText}>Allow background activity</Text> and <Text style={styles.boldText}>Allow auto-launch</Text>.
                </Text>
              )}
              {selectedOem === 'pixel_stock' && (
                <Text style={styles.instructionText}>
                  1. Open <Text style={styles.boldText}>Settings ➔ Apps ➔ Special app access</Text>{'\n'}
                  2. Under <Text style={styles.boldText}>Usage access</Text>, verify permission is Allowed.{'\n'}
                  3. Under <Text style={styles.boldText}>Alarms & reminders</Text>, toggle Allowed.
                </Text>
              )}

              <TouchableOpacity style={styles.openSettingsButton} onPress={onOpenAppSettings}>
                <Text style={styles.openSettingsButtonText}>Open Android App Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action Footer */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueButton, allPermissionsGranted ? styles.continueButtonReady : styles.continueButtonPartial]}
            activeOpacity={0.8}
            onPress={() => {
              triggerHaptic('medium');
              onClose();
            }}
          >
            <Text style={styles.continueButtonText}>
              {allPermissionsGranted ? 'Launch Learning Companion ➔' : 'Proceed to Dashboard'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16'
  },
  scrollContent: {
    padding: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 56,
    paddingBottom: 40
  },
  header: {
    marginBottom: 16
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)'
  },
  badgeText: {
    color: '#818CF8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1
  },
  stepProgress: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600'
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 8
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 13,
    lineHeight: 19
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#1E2538',
    borderRadius: 2,
    marginBottom: 24,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 2
  },
  stepCard: {
    backgroundColor: '#111625',
    borderWidth: 1,
    borderColor: '#1E2538',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16
  },
  stepCardGranted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.03)'
  },
  stepCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1E2538',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  stepNumberBadgeGranted: {
    backgroundColor: '#10B981'
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  stepTitleContainer: {
    flex: 1
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  stepRequirement: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6
  },
  pillGranted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)'
  },
  pillPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)'
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800'
  },
  pillTextGranted: {
    color: '#10B981'
  },
  pillTextPending: {
    color: '#F59E0B'
  },
  stepDescription: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12
  },
  actionButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4
  },
  verifiedText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600'
  },
  oemContainer: {
    backgroundColor: '#111625',
    borderWidth: 1,
    borderColor: '#1E2538',
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
    marginBottom: 20
  },
  oemHeader: {
    marginBottom: 12
  },
  oemTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4
  },
  oemSubtitle: {
    color: '#9CA3AF',
    fontSize: 12
  },
  oemTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12
  },
  oemTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1A2133',
    borderWidth: 1,
    borderColor: '#2D3748'
  },
  oemTabActive: {
    backgroundColor: '#4F46E5',
    borderColor: '#6366F1'
  },
  oemTabText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600'
  },
  oemTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  instructionBox: {
    backgroundColor: '#0D111C',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1E2538'
  },
  instructionText: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 20
  },
  boldText: {
    color: '#818CF8',
    fontWeight: '700'
  },
  openSettingsButton: {
    marginTop: 10,
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center'
  },
  openSettingsButtonText: {
    color: '#E5E7EB',
    fontSize: 12,
    fontWeight: '600'
  },
  footer: {
    padding: 20,
    backgroundColor: '#090D16',
    borderTopWidth: 1,
    borderTopColor: '#1E2538'
  },
  continueButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  continueButtonReady: {
    backgroundColor: '#10B981'
  },
  continueButtonPartial: {
    backgroundColor: '#4F46E5'
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
