import React, { useState } from 'react';
import { registerRootComponent } from 'expo';
import {
  SafeAreaView,
  ScrollView,
  View,
  StatusBar,
  StyleSheet,
  Alert
} from 'react-native';
import { useTelemetry } from './hooks/useTelemetry';
import { TodayTab } from './components/TodayTab';
import { InsightsTab } from './components/InsightsTab';
import { SettingsTab } from './components/SettingsTab';
import { BottomTabBar, TabKey } from './components/BottomTabBar';
import { ProminentDisclosureModal } from './components/ProminentDisclosureModal';
import { telemetryClient } from './api/telemetryClient';

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

  const {
    hasUsagePermission,
    isBatteryOptimizationIgnored,
    isCollecting,
    isSyncing,
    queueStats,
    queuedRecords,
    requestUsagePermission,
    openAppSettings,
    requestBatteryOpt,
    collectAndEnqueue,
    triggerSync,
    enableBackgroundWorker
  } = useTelemetry(backendUrl);

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
      Alert.alert('Device Paired', `Successfully linked to student profile: ${res.studentName}`);
    } catch (err: any) {
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
