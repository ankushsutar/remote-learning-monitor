import { getDatabase } from '../connection';
import { AppCategory } from '../types';

export const APP_CATALOG: Array<{ packageName: string; appName: string; category: AppCategory }> = [
  // --- EDUCATIONAL (20 Apps) ---
  { packageName: 'com.google.android.apps.classroom', appName: 'Google Classroom', category: 'EDUCATIONAL' },
  { packageName: 'com.duolingo', appName: 'Duolingo', category: 'EDUCATIONAL' },
  { packageName: 'org.khanacademy.android', appName: 'Khan Academy', category: 'EDUCATIONAL' },
  { packageName: 'org.coursera.android', appName: 'Coursera', category: 'EDUCATIONAL' },
  { packageName: 'com.quizlet.quizletandroid', appName: 'Quizlet', category: 'EDUCATIONAL' },
  { packageName: 'com.photomath.photomath', appName: 'Photomath', category: 'EDUCATIONAL' },
  { packageName: 'no.mobitroll.kahoot.android', appName: 'Kahoot!', category: 'EDUCATIONAL' },
  { packageName: 'org.edx.mobile', appName: 'edX', category: 'EDUCATIONAL' },
  { packageName: 'com.udemy.android', appName: 'Udemy', category: 'EDUCATIONAL' },
  { packageName: 'co.brainly', appName: 'Brainly', category: 'EDUCATIONAL' },
  { packageName: 'org.brilliant.android', appName: 'Brilliant', category: 'EDUCATIONAL' },
  { packageName: 'com.ichi2.anki', appName: 'AnkiDroid Flashcards', category: 'EDUCATIONAL' },
  { packageName: 'com.ted.android', appName: 'TED Conferences', category: 'EDUCATIONAL' },
  { packageName: 'com.sololearn', appName: 'Sololearn: Learn to Code', category: 'EDUCATIONAL' },
  { packageName: 'com.instructure.candroid', appName: 'Canvas Student', category: 'EDUCATIONAL' },
  { packageName: 'com.blackboard.android.bbmat', appName: 'Blackboard Learn', category: 'EDUCATIONAL' },
  { packageName: 'com.moodle.moodlemobile', appName: 'Moodle', category: 'EDUCATIONAL' },
  { packageName: 'org.geogebra.android', appName: 'GeoGebra Graphing Calculator', category: 'EDUCATIONAL' },
  { packageName: 'org.scratchjr.android', appName: 'ScratchJr', category: 'EDUCATIONAL' },
  { packageName: 'com.wolfram.android.alpha', appName: 'WolframAlpha', category: 'EDUCATIONAL' },

  // --- PRODUCTIVE (18 Apps) ---
  { packageName: 'com.google.android.apps.docs.editors.docs', appName: 'Google Docs', category: 'PRODUCTIVE' },
  { packageName: 'com.google.android.apps.docs.editors.sheets', appName: 'Google Sheets', category: 'PRODUCTIVE' },
  { packageName: 'com.google.android.apps.docs.editors.slides', appName: 'Google Slides', category: 'PRODUCTIVE' },
  { packageName: 'com.google.android.apps.docs', appName: 'Google Drive', category: 'PRODUCTIVE' },
  { packageName: 'com.google.android.apps.meetings', appName: 'Google Meet', category: 'PRODUCTIVE' },
  { packageName: 'com.microsoft.office.word', appName: 'Microsoft Word', category: 'PRODUCTIVE' },
  { packageName: 'com.microsoft.office.excel', appName: 'Microsoft Excel', category: 'PRODUCTIVE' },
  { packageName: 'com.microsoft.office.onenote', appName: 'Microsoft OneNote', category: 'PRODUCTIVE' },
  { packageName: 'com.microsoft.teams', appName: 'Microsoft Teams', category: 'PRODUCTIVE' },
  { packageName: 'us.zoom.videomeetings', appName: 'Zoom Meetings', category: 'PRODUCTIVE' },
  { packageName: 'com.Slack', appName: 'Slack', category: 'PRODUCTIVE' },
  { packageName: 'notion.id', appName: 'Notion - Notes & Projects', category: 'PRODUCTIVE' },
  { packageName: 'com.google.android.gm', appName: 'Gmail', category: 'PRODUCTIVE' },
  { packageName: 'com.google.android.calendar', appName: 'Google Calendar', category: 'PRODUCTIVE' },
  { packageName: 'com.todoist', appName: 'Todoist: To-Do List & Planner', category: 'PRODUCTIVE' },
  { packageName: 'md.obsidian', appName: 'Obsidian', category: 'PRODUCTIVE' },
  { packageName: 'com.trello', appName: 'Trello: Manage Projects', category: 'PRODUCTIVE' },
  { packageName: 'com.evernote', appName: 'Evernote: Note Organizer', category: 'PRODUCTIVE' },

  // --- SOCIAL_MEDIA (14 Apps) ---
  { packageName: 'com.instagram.android', appName: 'Instagram', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.zhiliaoapp.musically', appName: 'TikTok', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.snapchat.android', appName: 'Snapchat', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.facebook.katana', appName: 'Facebook', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.twitter.android', appName: 'X (formerly Twitter)', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.reddit.frontpage', appName: 'Reddit', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.whatsapp', appName: 'WhatsApp Messenger', category: 'SOCIAL_MEDIA' },
  { packageName: 'org.telegram.messenger', appName: 'Telegram', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.discord', appName: 'Discord: Talk, Chat & Hang Out', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.pinterest', appName: 'Pinterest', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.instagram.barcelona', appName: 'Threads, an Instagram app', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.bereal.ft', appName: 'BeReal: Your friends for real', category: 'SOCIAL_MEDIA' },
  { packageName: 'org.thoughtcrime.securesms', appName: 'Signal Private Messenger', category: 'SOCIAL_MEDIA' },
  { packageName: 'com.tumblr', appName: 'Tumblr', category: 'SOCIAL_MEDIA' },

  // --- GAMING (16 Apps) ---
  { packageName: 'com.roblox.client', appName: 'Roblox', category: 'GAMING' },
  { packageName: 'com.mojang.minecraftpe', appName: 'Minecraft', category: 'GAMING' },
  { packageName: 'com.kiloo.subwaysurf', appName: 'Subway Surfers', category: 'GAMING' },
  { packageName: 'com.supercell.brawlstars', appName: 'Brawl Stars', category: 'GAMING' },
  { packageName: 'com.supercell.clashroyale', appName: 'Clash Royale', category: 'GAMING' },
  { packageName: 'com.supercell.clashofclans', appName: 'Clash of Clans', category: 'GAMING' },
  { packageName: 'com.miHoYo.GenshinImpact', appName: 'Genshin Impact', category: 'GAMING' },
  { packageName: 'com.tencent.ig', appName: 'PUBG MOBILE', category: 'GAMING' },
  { packageName: 'com.king.candycrushsaga', appName: 'Candy Crush Saga', category: 'GAMING' },
  { packageName: 'com.innersloth.spacemafia', appName: 'Among Us', category: 'GAMING' },
  { packageName: 'com.dts.freefireth', appName: 'Free Fire MAX', category: 'GAMING' },
  { packageName: 'com.activision.callofduty.shooter', appName: 'Call of Duty: Mobile', category: 'GAMING' },
  { packageName: 'com.riotgames.league.wildrift', appName: 'League of Legends: Wild Rift', category: 'GAMING' },
  { packageName: 'com.nianticlabs.pokemongo', appName: 'Pokémon GO', category: 'GAMING' },
  { packageName: 'com.gameloft.android.ANMP.GloftA9HM', appName: 'Asphalt 9: Legends', category: 'GAMING' },
  { packageName: 'com.robtopx.geometryjumplite', appName: 'Geometry Dash Lite', category: 'GAMING' },

  // --- ENTERTAINMENT (12 Apps) ---
  { packageName: 'com.google.android.youtube', appName: 'YouTube', category: 'ENTERTAINMENT' },
  { packageName: 'com.netflix.mediaclient', appName: 'Netflix', category: 'ENTERTAINMENT' },
  { packageName: 'com.spotify.music', appName: 'Spotify: Music and Podcasts', category: 'ENTERTAINMENT' },
  { packageName: 'com.disney.disneyplus', appName: 'Disney+', category: 'ENTERTAINMENT' },
  { packageName: 'tv.twitch.android.app', appName: 'Twitch: Live Game Streaming', category: 'ENTERTAINMENT' },
  { packageName: 'com.amazon.avod.thirdpartyclient', appName: 'Amazon Prime Video', category: 'ENTERTAINMENT' },
  { packageName: 'com.crunchyroll.crunchyroid', appName: 'Crunchyroll', category: 'ENTERTAINMENT' },
  { packageName: 'com.hulu.plus', appName: 'Hulu: Stream TV & Movies', category: 'ENTERTAINMENT' },
  { packageName: 'com.wbd.stream', appName: 'Max: Stream HBO, TV, & Movies', category: 'ENTERTAINMENT' },
  { packageName: 'com.soundcloud.android', appName: 'SoundCloud: Play Music & Songs', category: 'ENTERTAINMENT' },
  { packageName: 'com.google.android.apps.youtube.music', appName: 'YouTube Music', category: 'ENTERTAINMENT' },
  { packageName: 'tv.pluto.android', appName: 'Pluto TV - Live TV and Movies', category: 'ENTERTAINMENT' }
];

export async function seedDatabase(): Promise<void> {
  const db = await getDatabase();
  console.log(`[Seed] Beginning database seed with ${APP_CATALOG.length} categorized applications...`);

  const schoolId = 'a0000000-0000-0000-0000-000000000001';

  // 1. Seed App Catalog
  if (db.isPostgres()) {
    for (const app of APP_CATALOG) {
      await db.query(
        `INSERT INTO app_categories (package_name, app_name, category)
         VALUES ($1, $2, $3)
         ON CONFLICT (package_name) DO UPDATE SET app_name = $2, category = $3`,
        [app.packageName, app.appName, app.category]
      );
    }
  } else {
    // Memory DB seed
    const memDb = db as any;
    for (const app of APP_CATALOG) {
      memDb.appCategories.set(app.packageName, {
        package_name: app.packageName,
        app_name: app.appName,
        category: app.category,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }

  // 2. Seed Sample Students & Devices
  const sampleStudents = [
    {
      id: 's1111111-1111-1111-1111-111111111111',
      studentCode: 'STU-94021',
      firstName: 'Alex',
      lastName: 'Rivera',
      deviceId: 'd1111111-1111-1111-1111-111111111111',
      osVersion: 'Android 14 (API 34)',
      batteryOptDisabled: true,
      lastSyncMinutesAgo: 4 // Actively syncing
    },
    {
      id: 's2222222-2222-2222-2222-222222222222',
      studentCode: 'STU-88104',
      firstName: 'Maya',
      lastName: 'Patel',
      deviceId: 'd2222222-2222-2222-2222-222222222222',
      osVersion: 'Android 14 (API 34)',
      batteryOptDisabled: false, // TAMPER ALERT: Battery opt re-enabled!
      lastSyncMinutesAgo: 12
    },
    {
      id: 's3333333-3333-3333-3333-333333333333',
      studentCode: 'STU-77519',
      firstName: 'Noah',
      lastName: 'Davis',
      deviceId: 'd3333333-3333-3333-3333-333333333333',
      osVersion: 'Android 13 (API 33)',
      batteryOptDisabled: true,
      lastSyncMinutesAgo: 185 // TAMPER ALERT: Sync delayed > 2 hours!
    },
    {
      id: 's4444444-4444-4444-4444-444444444444',
      studentCode: 'STU-65230',
      firstName: 'Emma',
      lastName: 'Watson',
      deviceId: 'd4444444-4444-4444-4444-444444444444',
      osVersion: 'Android 14 (API 34)',
      batteryOptDisabled: true,
      lastSyncMinutesAgo: 8
    },
    {
      id: 's5555555-5555-5555-5555-555555555555',
      studentCode: 'STU-51092',
      firstName: 'Liam',
      lastName: 'Chen',
      deviceId: 'd5555555-5555-5555-5555-555555555555',
      osVersion: 'Android 14 (API 34)',
      batteryOptDisabled: false, // TAMPER ALERT: Battery opt re-enabled + long sync delay!
      lastSyncMinutesAgo: 240
    }
  ];

  const now = Date.now();

  for (const s of sampleStudents) {
    const lastSyncAt = new Date(now - s.lastSyncMinutesAgo * 60 * 1000);

    if (db.isPostgres()) {
      await db.query(
        `INSERT INTO students (id, student_code, school_id, first_name, last_name, is_active)
         VALUES ($1, $2, $3, $4, $5, true)
         ON CONFLICT (student_code) DO NOTHING`,
        [s.id, s.studentCode, schoolId, s.firstName, s.lastName]
      );

      await db.query(
        `INSERT INTO devices (id, student_id, device_fingerprint, os_version, battery_optimization_disabled, last_sync_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (device_fingerprint) DO UPDATE 
         SET battery_optimization_disabled = $5, last_sync_at = $6`,
        [s.deviceId, s.id, `fingerprint-${s.studentCode}`, s.osVersion, s.batteryOptDisabled, lastSyncAt]
      );
    } else {
      const memDb = db as any;
      memDb.students.set(s.id, {
        id: s.id,
        student_code: s.studentCode,
        school_id: schoolId,
        first_name: s.firstName,
        last_name: s.lastName,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date()
      });

      memDb.devices.set(s.deviceId, {
        id: s.deviceId,
        student_id: s.id,
        device_fingerprint: `fingerprint-${s.studentCode}`,
        os_version: s.osVersion,
        battery_optimization_disabled: s.batteryOptDisabled,
        last_sync_at: lastSyncAt,
        created_at: new Date(),
        updated_at: new Date()
      });
    }
  }

  // 3. Generate 24-hour Telemetry Data for Student 1 (Alex Rivera)
  const alexDeviceId = sampleStudents[0].deviceId;
  const telemetryRecords: Array<{
    deviceId: string;
    packageName: string;
    startTime: Date;
    endTime: Date;
    foregroundDurationSec: number;
    bytesRx: number;
    bytesTx: number;
  }> = [];

  // Generate hour-by-hour intervals starting from morning 8am to current
  const startOfDay = new Date();
  startOfDay.setHours(8, 0, 0, 0);

  const hourBlocks = [
    // 08:00 - Google Classroom & Khan Academy
    { hour: 8, app: 'com.google.android.apps.classroom', sec: 1800, rx: 12000000, tx: 2500000 },
    { hour: 8, app: 'org.khanacademy.android', sec: 1200, rx: 24000000, tx: 1800000 },

    // 09:00 - Google Docs & Meet (Productive)
    { hour: 9, app: 'com.google.android.apps.docs.editors.docs', sec: 2100, rx: 4500000, tx: 950000 },
    { hour: 9, app: 'com.google.android.apps.meetings', sec: 1200, rx: 48000000, tx: 12000000 },

    // 10:00 - Quizlet & Photomath (Educational)
    { hour: 10, app: 'com.quizlet.quizletandroid', sec: 1500, rx: 8000000, tx: 1100000 },
    { hour: 10, app: 'com.photomath.photomath', sec: 600, rx: 3200000, tx: 800000 },

    // 11:00 - Distraction spike: Instagram & Roblox during school hours
    { hour: 11, app: 'com.instagram.android', sec: 1200, rx: 35000000, tx: 4200000 },
    { hour: 11, app: 'com.roblox.client', sec: 900, rx: 55000000, tx: 6800000 },

    // 12:00 (Lunch) - YouTube & Spotify
    { hour: 12, app: 'com.google.android.youtube', sec: 1800, rx: 95000000, tx: 3200000 },
    { hour: 12, app: 'com.spotify.music', sec: 1200, rx: 22000000, tx: 900000 },

    // 13:00 - Duolingo & Google Classroom (Productive / Educational)
    { hour: 13, app: 'com.duolingo', sec: 1400, rx: 9000000, tx: 1400000 },
    { hour: 13, app: 'com.google.android.apps.classroom', sec: 1600, rx: 14000000, tx: 2800000 },

    // 14:00 - Notion & Slack (Productive)
    { hour: 14, app: 'notion.id', sec: 1900, rx: 6500000, tx: 1800000 },
    { hour: 14, app: 'com.Slack', sec: 1100, rx: 8900000, tx: 2100000 },

    // 15:00 - Discord & TikTok (After school)
    { hour: 15, app: 'com.discord', sec: 1500, rx: 28000000, tx: 4900000 },
    { hour: 15, app: 'com.zhiliaoapp.musically', sec: 1800, rx: 125000000, tx: 8200000 }
  ];

  for (const block of hourBlocks) {
    const bStart = new Date(startOfDay);
    bStart.setHours(block.hour, 0, 0, 0);
    const bEnd = new Date(startOfDay);
    bEnd.setHours(block.hour, 59, 59, 0);

    telemetryRecords.push({
      deviceId: alexDeviceId,
      packageName: block.app,
      startTime: bStart,
      endTime: bEnd,
      foregroundDurationSec: block.sec,
      bytesRx: block.rx,
      bytesTx: block.tx
    });
  }

  await db.batchInsertTelemetry(telemetryRecords);
  console.log(`[Seed] Seeded ${telemetryRecords.length} telemetry intervals for Alex Rivera.`);
  console.log('[Seed] Database seeding completed successfully.');
}

if (require.main === module) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error seeding database:', err);
      process.exit(1);
    });
}

