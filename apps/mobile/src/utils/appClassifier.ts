import { QueuedTelemetryRecord } from '../storage/db';

export type AppCategory =
  | 'EDUCATIONAL'
  | 'PRODUCTIVE'
  | 'SOCIAL_MEDIA'
  | 'GAMING'
  | 'ENTERTAINMENT'
  | 'SYSTEM'
  | 'UNCLASSIFIED';

export interface AppMetadata {
  name: string;
  category: AppCategory;
  isFocus: boolean;
  icon: string;
  color: string;
}

export const APP_CATALOG: Record<string, { name: string; category: AppCategory; icon: string; color: string }> = {
  // Educational (Focus)
  'com.google.android.apps.classroom': { name: 'Google Classroom', category: 'EDUCATIONAL', icon: '📘', color: '#0D9488' },
  'com.duolingo': { name: 'Duolingo', category: 'EDUCATIONAL', icon: '🦉', color: '#10B981' },
  'org.khanacademy.android': { name: 'Khan Academy', category: 'EDUCATIONAL', icon: '🎓', color: '#0D9488' },
  'org.coursera.android': { name: 'Coursera', category: 'EDUCATIONAL', icon: '🎓', color: '#2563EB' },
  'com.quizlet.quizletandroid': { name: 'Quizlet', category: 'EDUCATIONAL', icon: '📑', color: '#4F46E5' },
  'com.photomath.photomath': { name: 'Photomath', category: 'EDUCATIONAL', icon: '🔢', color: '#EF4444' },
  'no.mobitroll.kahoot.android': { name: 'Kahoot!', category: 'EDUCATIONAL', icon: '🎯', color: '#7C3AED' },
  'org.edx.mobile': { name: 'edX', category: 'EDUCATIONAL', icon: '🎓', color: '#B91C1C' },
  'com.udemy.android': { name: 'Udemy', category: 'EDUCATIONAL', icon: '📚', color: '#A21CAF' },
  'co.brainly': { name: 'Brainly', category: 'EDUCATIONAL', icon: '💡', color: '#2563EB' },
  'org.brilliant.android': { name: 'Brilliant', category: 'EDUCATIONAL', icon: '✨', color: '#111827' },
  'com.ichi2.anki': { name: 'AnkiDroid', category: 'EDUCATIONAL', icon: '🗂️', color: '#0284C7' },
  'com.sololearn': { name: 'Sololearn', category: 'EDUCATIONAL', icon: '💻', color: '#0D9488' },
  'com.instructure.candroid': { name: 'Canvas Student', category: 'EDUCATIONAL', icon: '🎒', color: '#E11D48' },
  'com.blackboard.android.bbmat': { name: 'Blackboard', category: 'EDUCATIONAL', icon: '📋', color: '#1E293B' },
  'com.moodle.moodlemobile': { name: 'Moodle', category: 'EDUCATIONAL', icon: '🎓', color: '#EA580C' },
  'org.geogebra.android': { name: 'GeoGebra', category: 'EDUCATIONAL', icon: '📐', color: '#4F46E5' },
  'org.wikipedia': { name: 'Wikipedia', category: 'EDUCATIONAL', icon: '📖', color: '#334155' },
  'com.telemetry.studentmonitor': { name: 'Aegis Focus', category: 'EDUCATIONAL', icon: '🛡️', color: '#0D9488' },

  // Productive (Focus)
  'com.google.android.apps.docs.editors.docs': { name: 'Google Docs', category: 'PRODUCTIVE', icon: '📄', color: '#2563EB' },
  'com.google.android.apps.docs.editors.sheets': { name: 'Google Sheets', category: 'PRODUCTIVE', icon: '📊', color: '#16A34A' },
  'com.google.android.apps.docs.editors.slides': { name: 'Google Slides', category: 'PRODUCTIVE', icon: '📽️', color: '#D97706' },
  'com.google.android.apps.docs': { name: 'Google Drive', category: 'PRODUCTIVE', icon: '📁', color: '#2563EB' },
  'com.google.android.apps.meetings': { name: 'Google Meet', category: 'PRODUCTIVE', icon: '📹', color: '#059669' },
  'com.microsoft.office.word': { name: 'MS Word', category: 'PRODUCTIVE', icon: '📝', color: '#1D4ED8' },
  'com.microsoft.office.excel': { name: 'MS Excel', category: 'PRODUCTIVE', icon: '📈', color: '#15803D' },
  'com.microsoft.teams': { name: 'MS Teams', category: 'PRODUCTIVE', icon: '👥', color: '#4338CA' },
  'us.zoom.videomeetings': { name: 'Zoom', category: 'PRODUCTIVE', icon: '💻', color: '#2563EB' },
  'com.Slack': { name: 'Slack', category: 'PRODUCTIVE', icon: '💬', color: '#6D28D9' },
  'notion.id': { name: 'Notion', category: 'PRODUCTIVE', icon: '📓', color: '#111827' },
  'com.todoist': { name: 'Todoist', category: 'PRODUCTIVE', icon: '✅', color: '#DC2626' },
  'md.obsidian': { name: 'Obsidian', category: 'PRODUCTIVE', icon: '💎', color: '#7C3AED' },

  // Social Media (Distraction)
  'com.instagram.android': { name: 'Instagram', category: 'SOCIAL_MEDIA', icon: '📸', color: '#E11D48' },
  'com.zhiliaoapp.musically': { name: 'TikTok', category: 'SOCIAL_MEDIA', icon: '🎵', color: '#000000' },
  'com.snapchat.android': { name: 'Snapchat', category: 'SOCIAL_MEDIA', icon: '👻', color: '#CA8A04' },
  'com.facebook.katana': { name: 'Facebook', category: 'SOCIAL_MEDIA', icon: '👥', color: '#1D4ED8' },
  'com.twitter.android': { name: 'X / Twitter', category: 'SOCIAL_MEDIA', icon: '🐦', color: '#000000' },
  'com.reddit.frontpage': { name: 'Reddit', category: 'SOCIAL_MEDIA', icon: '🤖', color: '#EA580C' },
  'com.whatsapp': { name: 'WhatsApp', category: 'SOCIAL_MEDIA', icon: '💬', color: '#16A34A' },
  'org.telegram.messenger': { name: 'Telegram', category: 'SOCIAL_MEDIA', icon: '✈️', color: '#0284C7' },
  'com.discord': { name: 'Discord', category: 'SOCIAL_MEDIA', icon: '🎧', color: '#5865F2' },
  'com.pinterest': { name: 'Pinterest', category: 'SOCIAL_MEDIA', icon: '📌', color: '#BE123C' },

  // Gaming (Distraction)
  'com.roblox.client': { name: 'Roblox', category: 'GAMING', icon: '🎮', color: '#E11D48' },
  'com.mojang.minecraftpe': { name: 'Minecraft', category: 'GAMING', icon: '⛏️', color: '#15803D' },
  'com.kiloo.subwaysurf': { name: 'Subway Surfers', category: 'GAMING', icon: '🏄', color: '#D97706' },
  'com.supercell.brawlstars': { name: 'Brawl Stars', category: 'GAMING', icon: '⭐', color: '#CA8A04' },
  'com.supercell.clashofclans': { name: 'Clash of Clans', category: 'GAMING', icon: '⚔️', color: '#B45309' },
  'com.tencent.ig': { name: 'PUBG Mobile', category: 'GAMING', icon: '🎯', color: '#D97706' },
  'com.king.candycrushsaga': { name: 'Candy Crush', category: 'GAMING', icon: '🍬', color: '#E11D48' },
  'com.innersloth.spacemafia': { name: 'Among Us', category: 'GAMING', icon: '🚀', color: '#DC2626' },

  // Entertainment (Distraction)
  'com.google.android.youtube': { name: 'YouTube', category: 'ENTERTAINMENT', icon: '📺', color: '#DC2626' },
  'com.netflix.mediaclient': { name: 'Netflix', category: 'ENTERTAINMENT', icon: '🍿', color: '#E50914' },
  'com.spotify.music': { name: 'Spotify', category: 'ENTERTAINMENT', icon: '🎧', color: '#16A34A' },
  'tv.twitch.android.app': { name: 'Twitch', category: 'ENTERTAINMENT', icon: '🎮', color: '#9146FF' },
  'com.disney.disneyplus': { name: 'Disney+', category: 'ENTERTAINMENT', icon: '✨', color: '#1D4ED8' },
  'com.amazon.avod.thirdpartyclient': { name: 'Prime Video', category: 'ENTERTAINMENT', icon: '🎬', color: '#0284C7' },

  // System (Excluded from Focus Ratio)
  'com.sec.android.app.launcher': { name: 'Home Screen', category: 'SYSTEM', icon: '📱', color: '#64748B' },
  'com.google.android.apps.nexuslauncher': { name: 'Launcher', category: 'SYSTEM', icon: '📱', color: '#64748B' },
  'com.android.settings': { name: 'Settings', category: 'SYSTEM', icon: '⚙️', color: '#64748B' },
  'com.android.systemui': { name: 'System UI', category: 'SYSTEM', icon: '⚙️', color: '#64748B' },
  'com.google.android.calculator': { name: 'Calculator', category: 'SYSTEM', icon: '🧮', color: '#64748B' },
  'com.google.android.deskclock': { name: 'Clock', category: 'SYSTEM', icon: '⏰', color: '#64748B' }
};

export function classifyApp(pkg: string): AppMetadata {
  if (APP_CATALOG[pkg]) {
    const item = APP_CATALOG[pkg];
    const isFocus = item.category === 'EDUCATIONAL' || item.category === 'PRODUCTIVE';
    return {
      name: item.name,
      category: item.category,
      isFocus,
      icon: item.icon,
      color: item.color
    };
  }

  // Fallback heuristics for uncatalogued packages
  const lower = pkg.toLowerCase();
  const cleanName = pkg.split('.').pop() || pkg;
  const formattedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

  if (lower.includes('edu') || lower.includes('school') || lower.includes('learn') || lower.includes('study')) {
    return { name: formattedName, category: 'EDUCATIONAL', isFocus: true, icon: '🎓', color: '#0D9488' };
  }
  if (lower.includes('game') || lower.includes('play')) {
    return { name: formattedName, category: 'GAMING', isFocus: false, icon: '🎮', color: '#F59E0B' };
  }
  if (lower.includes('video') || lower.includes('tube') || lower.includes('media')) {
    return { name: formattedName, category: 'ENTERTAINMENT', isFocus: false, icon: '📺', color: '#EF4444' };
  }

  return {
    name: formattedName,
    category: 'UNCLASSIFIED',
    isFocus: false,
    icon: '📱',
    color: '#64748B'
  };
}

export interface FocusMetricsSummary {
  studySec: number;
  distractionSec: number;
  utilitySec: number;
  totalActiveSec: number;
  score: number; // 0 to 100
  scoreLabel: string;
  totalRxBytes: number;
  totalTxBytes: number;
  timelineHourlyFocus: number[];
}

export function computeFocusMetrics(records: QueuedTelemetryRecord[]): FocusMetricsSummary {
  let studySec = 0;
  let distractionSec = 0;
  let utilitySec = 0;
  let totalRx = 0;
  let totalTx = 0;

  // Bins for 6 periods (12am, 4am, 8am, 12pm, 4pm, 8pm)
  const hourBinsStudy = [0, 0, 0, 0, 0, 0];
  const hourBinsTotal = [0, 0, 0, 0, 0, 0];

  for (const r of records) {
    totalRx += r.bytesRx || 0;
    totalTx += r.bytesTx || 0;
    const dur = r.foregroundDurationSec || 0;
    const meta = classifyApp(r.packageName);

    if (meta.category === 'SYSTEM') {
      utilitySec += dur;
      continue;
    }

    if (meta.isFocus) {
      studySec += dur;
    } else {
      distractionSec += dur;
    }

    // Assign to a time bin based on startTime
    if (r.startTime > 0) {
      const date = new Date(r.startTime);
      const hour = date.getHours();
      const binIdx = Math.min(5, Math.floor(hour / 4));
      if (meta.isFocus) {
        hourBinsStudy[binIdx] += dur;
      }
      hourBinsTotal[binIdx] += dur;
    }
  }

  const totalScreenTime = studySec + distractionSec;
  const score = totalScreenTime > 0
    ? Math.round((studySec / totalScreenTime) * 100)
    : 100; // If brand new / no screen time yet, clean baseline 100

  let scoreLabel = 'Optimal Focus';
  if (score < 40) scoreLabel = 'Distraction Alert';
  else if (score < 60) scoreLabel = 'Balanced';
  else if (score < 80) scoreLabel = 'Productive';

  // Compute timeline sparkline points from real time bins
  const timelineHourlyFocus = hourBinsTotal.map((tot, idx) => {
    if (tot === 0) return 80; // Baseline neutral if no activity in that block
    return Math.round((hourBinsStudy[idx] / tot) * 100);
  });

  return {
    studySec,
    distractionSec,
    utilitySec,
    totalActiveSec: studySec + distractionSec + utilitySec,
    score,
    scoreLabel,
    totalRxBytes: totalRx,
    totalTxBytes: totalTx,
    timelineHourlyFocus
  };
}
