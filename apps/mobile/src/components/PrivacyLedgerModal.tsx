import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal
} from 'react-native';

interface PrivacyLedgerModalProps {
  visible: boolean;
  onClose: () => void;
  studentName?: string;
}

export const PrivacyLedgerModal: React.FC<PrivacyLedgerModalProps> = ({
  visible,
  onClose,
  studentName = 'Alex'
}) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>DATA GOVERNANCE & PRIVACY</Text>
              </View>
              <Text style={styles.title}>Student Privacy Ledger</Text>
              <Text style={styles.subtitle}>Protected profile for {studentName}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Mission Statement */}
            <View style={styles.calloutBox}>
              <Text style={styles.calloutText}>
                Aegis is engineered on the principle of <Text style={styles.calloutHighlight}>Zero-Content Telemetry</Text>. We monitor focus duration and educational app engagement without capturing any personal student content.
              </Text>
            </View>

            {/* What is NEVER collected */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🛡️ What Aegis NEVER Collects</Text>
              <View style={styles.itemRow}>
                <Text style={styles.negativeIcon}>✕</Text>
                <Text style={styles.itemText}>Keystrokes, passwords, or keyboard inputs</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.negativeIcon}>✕</Text>
                <Text style={styles.itemText}>Screen captures, video recordings, or screenshots</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.negativeIcon}>✕</Text>
                <Text style={styles.itemText}>Private chats, emails, or personal text messages</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.negativeIcon}>✕</Text>
                <Text style={styles.itemText}>Camera, microphone, or audio recordings</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.negativeIcon}>✕</Text>
                <Text style={styles.itemText}>Personal photos, local files, or media storage</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.negativeIcon}>✕</Text>
                <Text style={styles.itemText}>GPS geographic location or Wi-Fi SSID tracking</Text>
              </View>
            </View>

            {/* What IS collected */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>✓ What Aegis DOES Record</Text>
              <View style={styles.itemRow}>
                <Text style={styles.positiveIcon}>✓</Text>
                <Text style={styles.itemText}>Package identifier (e.g., com.google.android.apps.classroom)</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.positiveIcon}>✓</Text>
                <Text style={styles.itemText}>Foreground session duration (seconds spent with app active)</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.positiveIcon}>✓</Text>
                <Text style={styles.itemText}>Application network byte transfer volume (UID Rx/Tx bytes)</Text>
              </View>
              <View style={styles.itemRow}>
                <Text style={styles.positiveIcon}>✓</Text>
                <Text style={styles.itemText}>Focus Score calculation (ratio of productive study to leisure)</Text>
              </View>
            </View>

            {/* Transparent Data Payload Sample */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🔍 Sample JSON Outbox Payload</Text>
              <Text style={styles.codeSubtitle}>Exact format dispatched to school backend API:</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>
{`{
  "packageName": "com.google.android.apps.classroom",
  "startTime": 1728813600000,
  "endTime": 1728814500000,
  "foregroundDurationSec": 890,
  "bytesRx": 1420500,
  "bytesTx": 340100
}`}
                </Text>
              </View>
            </View>

            {/* Compliance Badge */}
            <View style={styles.complianceCard}>
              <Text style={styles.complianceTitle}>FERPA & COPPA Compliant</Text>
              <Text style={styles.complianceDescription}>
                All telemetry records are signed with rotating JWT keys, encrypted in transit via TLS, stored in hardware Keystore, and purged according to institutional retention rules.
              </Text>
            </View>
          </ScrollView>

          {/* Dismiss */}
          <TouchableOpacity style={styles.doneButton} onPress={onClose} activeOpacity={0.8}>
            <Text style={styles.doneButtonText}>Close Privacy Ledger</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end'
  },
  modalContainer: {
    backgroundColor: '#0E131F',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#1E2538'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16
  },
  badge: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6
  },
  badgeText: {
    color: '#818CF8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800'
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1E2538',
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '700'
  },
  scrollArea: {
    marginBottom: 16
  },
  calloutBox: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
    marginBottom: 16
  },
  calloutText: {
    color: '#D1D5DB',
    fontSize: 12,
    lineHeight: 18
  },
  calloutHighlight: {
    color: '#818CF8',
    fontWeight: '700'
  },
  section: {
    marginBottom: 18
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  negativeIcon: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '800',
    width: 22
  },
  positiveIcon: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '800',
    width: 22
  },
  itemText: {
    color: '#D1D5DB',
    fontSize: 12,
    flex: 1
  },
  codeSubtitle: {
    color: '#6B7280',
    fontSize: 11,
    marginBottom: 6
  },
  codeBox: {
    backgroundColor: '#080B12',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E2538'
  },
  codeText: {
    color: '#34D399',
    fontSize: 11,
    fontFamily: 'monospace',
    lineHeight: 16
  },
  complianceCard: {
    backgroundColor: '#131A2B',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E2538',
    marginBottom: 12
  },
  complianceTitle: {
    color: '#818CF8',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4
  },
  complianceDescription: {
    color: '#9CA3AF',
    fontSize: 11,
    lineHeight: 16
  },
  doneButton: {
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center'
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  }
});
