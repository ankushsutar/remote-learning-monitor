declare module 'react-native' {
  export const View: any;
  export const Text: any;
  export const TextInput: any;
  export const TouchableOpacity: any;
  export const StyleSheet: any;
  export const SafeAreaView: any;
  export const ScrollView: any;
  export const FlatList: any;
  export const ActivityIndicator: any;
  export const StatusBar: any;
  export const Platform: { OS: 'ios' | 'android' | 'web' };
}

declare module 'expo-modules-core' {
  export function requireNativeModule<T = any>(moduleName: string): T;
  export const Platform: { OS: 'ios' | 'android' | 'web' };
}

declare module 'expo-sqlite' {
  export function openDatabaseAsync(name: string): Promise<any>;
}
