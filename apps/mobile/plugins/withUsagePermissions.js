const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to inject required Android permissions and manifest properties
 * for UsageStatsManager, NetworkStatsManager, battery optimization overrides,
 * and WorkManager background execution.
 */
module.exports = function withUsagePermissions(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // 1. Ensure tools namespace is declared on <manifest>
    if (!androidManifest.$) {
      androidManifest.$ = {};
    }
    androidManifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    // 2. Prepare uses-permission array
    if (!Array.isArray(androidManifest['uses-permission'])) {
      androidManifest['uses-permission'] = [];
    }

    const permissions = androidManifest['uses-permission'];

    const targetPermissions = [
      {
        name: 'android.permission.PACKAGE_USAGE_STATS',
        attributes: {
          'android:name': 'android.permission.PACKAGE_USAGE_STATS',
          'tools:ignore': 'ProtectedPermissions',
        },
      },
      {
        name: 'android.permission.READ_PHONE_STATE',
        attributes: {
          'android:name': 'android.permission.READ_PHONE_STATE',
        },
      },
      {
        name: 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
        attributes: {
          'android:name': 'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
        },
      },
      {
        name: 'android.permission.FOREGROUND_SERVICE',
        attributes: {
          'android:name': 'android.permission.FOREGROUND_SERVICE',
        },
      },
      {
        name: 'android.permission.RECEIVE_BOOT_COMPLETED',
        attributes: {
          'android:name': 'android.permission.RECEIVE_BOOT_COMPLETED',
        },
      },
      {
        name: 'android.permission.INTERNET',
        attributes: {
          'android:name': 'android.permission.INTERNET',
        },
      },
      {
        name: 'android.permission.ACCESS_NETWORK_STATE',
        attributes: {
          'android:name': 'android.permission.ACCESS_NETWORK_STATE',
        },
      },
    ];

    targetPermissions.forEach(({ name, attributes }) => {
      const existingIdx = permissions.findIndex(
        (perm) => perm.$ && perm.$['android:name'] === name
      );

      if (existingIdx >= 0) {
        // Merge attributes (especially tools:ignore="ProtectedPermissions")
        permissions[existingIdx].$ = {
          ...permissions[existingIdx].$,
          ...attributes,
        };
      } else {
        permissions.push({ $: attributes });
      }
    });

    // 3. Ensure Application element has proper WorkManager service & receiver declarations
    if (Array.isArray(androidManifest.application) && androidManifest.application.length > 0) {
      const application = androidManifest.application[0];
      if (!application.receiver) {
        application.receiver = [];
      }

      // Add boot receiver for persistent WorkManager restart
      const bootReceiverName = 'androidx.work.impl.diagnostics.DiagnosticsReceiver';
      const hasReceiver = application.receiver.some(
        (r) => r.$ && r.$['android:name'] === bootReceiverName
      );
      if (!hasReceiver) {
        application.receiver.push({
          $: {
            'android:name': bootReceiverName,
            'android:permission': 'android.permission.DUMP',
            'android:exported': 'false',
          },
        });
      }
    }

    return config;
  });
};
