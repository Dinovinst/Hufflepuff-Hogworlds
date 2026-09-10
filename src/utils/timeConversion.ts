/**
 * IC (In-Character) and OC (Out-of-Character / Real Time) Time Conversion Utility
 * 
 * Rules:
 * - 24 hours OC = 6 days IC (4 hours OC = 1 day IC)
 * - Within each 4-hour cycle:
 *   - 3 hours OC = Daytime (เช้า) in IC: 06:00 - 18:00 น.
 *     [06:00 - 09:00], [10:00 - 13:00], [14:00 - 17:00], [18:00 - 21:00], [22:00 - 01:00], [02:00 - 05:00]
 *   - 1 hour OC = Nighttime (กลางคืน) in IC: 18:00 - 06:00 น.
 *     [09:00 - 10:00], [13:00 - 14:00], [17:00 - 18:00], [21:00 - 22:00], [01:00 - 02:00], [05:00 - 06:00]
 */

export interface IcTimeConversionResult {
  icTimeStr: string;           // e.g. "14:30 น."
  icHours: number;
  icMinutes: number;
  isDaytime: boolean;
  periodLabel: 'กลางวัน (เช้า)' | 'กลางคืน';
  periodEmoji: '☀️' | '🌙';
  cycleNumber: number;        // 1 to 6
  summaryText: string;        // "14:30 น. IC (กลางวัน ☀️)"
}

/**
 * Convert a given OC time string ("HH:mm") into corresponding IC time.
 */
export function convertOcToIc(ocTimeStr: string): IcTimeConversionResult {
  if (!ocTimeStr) {
    return {
      icTimeStr: '06:00 น.',
      icHours: 6,
      icMinutes: 0,
      isDaytime: true,
      periodLabel: 'กลางวัน (เช้า)',
      periodEmoji: '☀️',
      cycleNumber: 1,
      summaryText: '06:00 น. IC (กลางวัน ☀️)',
    };
  }

  // Extract hours and minutes
  const cleanStr = ocTimeStr.replace(/[^\d:]/g, '');
  const parts = cleanStr.split(':');
  let ocHours = parseInt(parts[0] || '0', 10);
  let ocMinutes = parseInt(parts[1] || '0', 10);

  if (isNaN(ocHours)) ocHours = 0;
  if (isNaN(ocMinutes)) ocMinutes = 0;

  ocHours = Math.max(0, Math.min(23, ocHours));
  ocMinutes = Math.max(0, Math.min(59, ocMinutes));

  // Minutes from baseline 06:00 OC
  const totalMinutesFrom6am = ((ocHours * 60 + ocMinutes) - (6 * 60) + 1440) % 1440;
  const cycleIndex = Math.floor(totalMinutesFrom6am / 240); // 0 to 5
  const minuteInCycle = totalMinutesFrom6am % 240; // 0 to 239

  let icHours = 6;
  let icMinutes = 0;
  let isDaytime = true;

  if (minuteInCycle < 180) {
    // 3 hours OC (180 mins) -> 06:00 - 18:00 IC (720 mins)
    isDaytime = true;
    const fraction = minuteInCycle / 180;
    const totalIcMinutes = Math.round(6 * 60 + fraction * 720);
    icHours = Math.floor(totalIcMinutes / 60) % 24;
    icMinutes = totalIcMinutes % 60;
  } else {
    // 1 hour OC (60 mins) -> 18:00 - 06:00 IC (720 mins across midnight)
    isDaytime = false;
    const fraction = (minuteInCycle - 180) / 60;
    const totalIcMinutes = Math.round((18 * 60 + fraction * 720) % 1440);
    icHours = Math.floor(totalIcMinutes / 60) % 24;
    icMinutes = totalIcMinutes % 60;
  }

  const formattedH = String(icHours).padStart(2, '0');
  const formattedM = String(icMinutes).padStart(2, '0');
  const icTimeStr = `${formattedH}:${formattedM} น.`;
  const periodLabel = isDaytime ? 'กลางวัน (เช้า)' : 'กลางคืน';
  const periodEmoji = isDaytime ? '☀️' : '🌙';

  return {
    icTimeStr,
    icHours,
    icMinutes,
    isDaytime,
    periodLabel,
    periodEmoji,
    cycleNumber: cycleIndex + 1,
    summaryText: `${icTimeStr} (IC ${periodLabel} ${periodEmoji})`,
  };
}

/**
 * Get current real-time IC status from the live system clock.
 */
export function getCurrentLiveIcTime(): IcTimeConversionResult & { ocTimeStr: string } {
  const now = new Date();
  const ocHours = now.getHours();
  const ocMinutes = now.getMinutes();
  const ocStr = `${String(ocHours).padStart(2, '0')}:${String(ocMinutes).padStart(2, '0')}`;
  const result = convertOcToIc(ocStr);
  return {
    ...result,
    ocTimeStr: `${ocStr} น.`,
  };
}
