import { Vibration, Platform } from 'react-native';

export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error';

export function triggerHaptic(type: HapticType = 'light'): void {
  if (Platform.OS === 'android') {
    switch (type) {
      case 'light':
        Vibration.vibrate(20);
        break;
      case 'medium':
        Vibration.vibrate(40);
        break;
      case 'heavy':
        Vibration.vibrate(80);
        break;
      case 'success':
        Vibration.vibrate([0, 30, 60, 40]);
        break;
      case 'error':
        Vibration.vibrate([0, 60, 80, 60]);
        break;
      default:
        Vibration.vibrate(30);
    }
  }
}
