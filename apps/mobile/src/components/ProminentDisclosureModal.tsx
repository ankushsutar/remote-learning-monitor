import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet
} from 'react-native';

interface ProminentDisclosureModalProps {
  visible: boolean;
  onAccept: () => void;
  onCancel: () => void;
}

export const ProminentDisclosureModal: React.FC<ProminentDisclosureModalProps> = ({
  visible,
  onAccept,
  onCancel
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>🛡️</Text>
          </View>

          <Text style={styles.title}>Data & Privacy Disclosure</Text>
          <Text style={styles.subtitle}>
            Student Telemetry & Focus Monitoring
          </Text>

          <View style={styles.body}>
            <Text style={styles.description}>
              To measure study focus and detect digital distractions during remote-learning sessions, this app requires <Text style={styles.bold}>Usage Access</Text>.
            </Text>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletCheck}>✓</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>What we collect:</Text> Time spent in educational, productive, and social apps, plus network bandwidth deltas.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletCross}>✕</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>What we NEVER collect:</Text> Personal messages, keystrokes, camera, photos, or browsing search terms.
              </Text>
            </View>

            <View style={styles.bulletItem}>
              <Text style={styles.bulletCheck}>✓</Text>
              <Text style={styles.bulletText}>
                <Text style={styles.bold}>Security:</Text> Encrypted local SQLite buffer with rotating cryptographic device authorization tokens.
              </Text>
            </View>
          </View>

          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.acceptButton}
              onPress={onAccept}
              activeOpacity={0.8}
            >
              <Text style={styles.acceptText}>I Consent & Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  dialog: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center'
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12
  },
  iconText: {
    fontSize: 24
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
    textAlign: 'center'
  },
  body: {
    width: '100%',
    marginBottom: 20
  },
  description: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 12
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4
  },
  bulletCheck: {
    color: '#10B981',
    fontWeight: '700',
    marginRight: 8,
    fontSize: 14
  },
  bulletCross: {
    color: '#EF4444',
    fontWeight: '700',
    marginRight: 8,
    fontSize: 14
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 17
  },
  bold: {
    color: '#F1F5F9',
    fontWeight: '600'
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center'
  },
  cancelText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600'
  },
  acceptButton: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center'
  },
  acceptText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  }
});
