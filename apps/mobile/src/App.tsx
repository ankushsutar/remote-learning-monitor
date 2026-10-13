import React, { useState, useEffect } from 'react';
import { registerRootComponent } from 'expo';
import {
  SafeAreaView,
  ScrollView,
  View,
  StatusBar,
  StyleSheet,
  Alert,
  Linking
} from 'react-native';
import { useTelemetry } from './hooks/useTelemetry';
import { TodayTab } from './components/TodayTab';
import { InsightsTab } from './components/InsightsTab';
import { SettingsTab } from './components/SettingsTab';
import { BottomTabBar, TabKey } from './components/BottomTabBar';
import { ProminentDisclosureModal } from './components/ProminentDisclosureModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { PrivacyLedgerModal } from './components/PrivacyLedgerModal';
import { telemetryClient } from './api/telemetryClient';
import { triggerHaptic } from './utils/haptics';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabKey>('today');
  const [backendUrl, setBackendUrl] = useState(
    process.env.EXPO_PUBLIC_BACKEND_URL || 'http://10.0.0.209:4000'
  );
  const [studentCode, setStudentCode] = useState(
    process.env.EXPO_PUBLIC_DEFAULT_STUDENT_CODE || 'STU-94021'
  );
  const [isPairing, setIsPairing] = useState(false);
  const [pairedInfo, setPairedInfo] = useState<{
    studentName: string;
    deviceId: string;
  } | null>({
    studentName: 'Alex Rivera',
    deviceId: 'dev-device-active'
  });
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showPrivacyLedger, setShowPrivacyLedger] = useState(false);

  const {
    hasUsagePermission,
    isBatteryOptimizationIgnored,
    isCollecting,
    isSyncing,
    queueStats,
    queuedRecords,
    refreshStatus,
    requestUsagePermission,
    openAppSettings,
    requestBatteryOpt,
    collectAndEnqueue,
    triggerSync,
    enableBackgroundWorker
  } = useTelemetry(backendUrl);

  // Universal Deep Link Handler (aegis://enroll?server=...&code=...)
  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      try {
        const urlStr = event.url;
        if (urlStr.includes('enroll') || urlStr.includes('pair')) {
          const formatted = urlStr.startsWith('aegis') ? urlStr.replace('aegis://', 'http://placeholder/') : urlStr;
          const urlObj = new URL(formatted);
          const serverParam = urlObj.searchParams.get('server');
          const codeParam = urlObj.searchParams.get('code');
          if (serverParam) setBackendUrl(serverParam);
          if (codeParam) setStudentCode(codeParam);
          Alert.alert('School Pairing Link Detected', `Configured endpoint for: ${codeParam || 'Student'}`);
        }
      } catch (e) {
        console.warn('Failed parsing deep link:', e);
      }
    };

    if (Linking && typeof Linking.getInitialURL === 'function') {
      Linking.getInitialURL()
        .then((url: string | null) => {
          if (url) handleDeepLink({ url });
        })
        .catch((e: any) => console.warn('getInitialURL error:', e));
    }

    let sub: any = null;
    if (Linking && typeof Linking.addEventListener === 'function') {
      sub = Linking.addEventListener('url', handleDeepLink);
    }
    return () => {
      if (sub && typeof sub.remove === 'function') {
        sub.remove();
      }
    };
  }, []);

  const handlePair = async () => {
    setIsPairing(true);
    try {
      telemetryClient.setBaseUrl(backendUrl);
      const res = await telemetryClient.pairDevice(
        studentCode,
        `android-client-${Date.now().toString(36)}`,
        'Android 14 (API 34)'
      );
      setPairedInfo({
        studentName: res.studentName,
        deviceId: res.deviceId
      });
      // Enable background WorkManager sync
      enableBackgroundWorker(res.token, res.deviceId);
      triggerHaptic('success');
      Alert.alert('Device Paired', `Successfully linked to student profile: ${res.studentName}`);
    } catch (err: any) {
      triggerHaptic('error');
      Alert.alert('Pairing Error', err.message || 'Unable to authorize device with backend.');
    } finally {
      setIsPairing(false);
    }
  };

  const totalForeground = queuedRecords.reduce((acc, r) => acc + r.foregroundDurationSec, 0);
  const totalRx = queuedRecords.reduce((acc, r) => acc + r.bytesRx, 0);
  const totalTx = queuedRecords.reduce((acc, r) => acc + r.bytesTx, 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#090D16" />
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {activeTab === 'today' && (
          <TodayTab
            studentName={pairedInfo ? pairedInfo.studentName : 'Student'}
            totalForegroundSec={totalForeground}
            totalRxBytes={totalRx}
            totalTxBytes={totalTx}
            isSyncing={isSyncing}
            onSync={triggerSync}
            pendingCount={queueStats.pendingCount}
            onOpenPrivacyLedger={() => setShowPrivacyLedger(true)}
          />
        )}

        {activeTab === 'insights' && (
          <InsightsTab
            records={queuedRecords}
            isCollecting={isCollecting}
            onCollect={() => collectAndEnqueue(15)}
            totalRxBytes={totalRx}
            totalTxBytes={totalTx}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            backendUrl={backendUrl}
            setBackendUrl={setBackendUrl}
            studentCode={studentCode}
            setStudentCode={setStudentCode}
            isPairing={isPairing}
            onPair={handlePair}
            pairedInfo={pairedInfo}
            hasUsagePermission={hasUsagePermission}
            isBatteryOptimizationIgnored={isBatteryOptimizationIgnored}
            onRequestUsage={() => setShowDisclosure(true)}
            onRequestBattery={requestBatteryOpt}
            onOpenAppSettings={openAppSettings}
            pendingCount={queueStats.pendingCount}
            isSyncing={isSyncing}
            onSync={triggerSync}
            onOpenWizard={() => setShowWizard(true)}
            onOpenPrivacyLedger={() => setShowPrivacyLedger(true)}
          />
        )}
      </ScrollView>

      {/* Modern Floating Bottom Tab Bar */}
      <BottomTabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendingRecordsCount={queueStats.pendingCount}
      />

      {/* Prominent Privacy & Data Disclosure Modal */}
      <ProminentDisclosureModal
        visible={showDisclosure}
        onAccept={() => {
          setShowDisclosure(false);
          requestUsagePermission();
        }}
        onCancel={() => setShowDisclosure(false)}
      />

      {/* 3-Step Guided Onboarding & Reliability Wizard */}
      <OnboardingWizard
        visible={showWizard}
        onClose={() => setShowWizard(false)}
        hasUsagePermission={hasUsagePermission}
        isBatteryOptimizationIgnored={isBatteryOptimizationIgnored}
        onRequestUsage={() => {
          setShowWizard(false);
          setShowDisclosure(true);
        }}
        onRequestBattery={requestBatteryOpt}
        onOpenAppSettings={openAppSettings}
        onRefresh={refreshStatus}
      />

      {/* Student Privacy & Governance Ledger Modal */}
      <PrivacyLedgerModal
        visible={showPrivacyLedger}
        onClose={() => setShowPrivacyLedger(false)}
        studentName={pairedInfo ? pairedInfo.studentName : 'Student'}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090D16'
  },
  container: {
    padding: 16,
    paddingTop: 12
  }
});

registerRootComponent(App);
