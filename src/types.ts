export type HouseRole =
  | 'นักเรียนทั่วไป'
  | 'Prefect'
  | 'Badger แข่งขัน'
  | 'Badger กิจกรรม'
  | 'Badger วิชาการ'
  | 'ศาสตราจารย์ประจำบ้าน'
  | 'Helper'
  | 'หัวหน้าบ้าน'
  | 'Badger Leader'
  | 'แอดมิน'
  | 'นักกีฬาเชียร์ลีดเดอร์'
  | 'นักกีฬาประลองเวทย์'
  | 'นักกีฬาไม้กวาด'
  | 'นักกีฬา SAS';

export interface StudentProfile {
  name: string;
  studentId: string;
  year: number; // 1 - 7
  houseRole: HouseRole; // Primary role
  houseRoles?: HouseRole[]; // Multiple roles
  characterPhoto: string;
  discordUsername: string;
  discordAvatar: string;
  joinedDate: string;
  bio?: string;
  pointsContributed?: number;
  possessedSpells?: string[]; // IDs of spells possessed
}

export type AppView =
  | 'landing'
  | 'register'
  | 'dashboard'
  | 'schedule'
  | 'spells'
  | 'members';

export type UserStatus = 'guest' | 'pending' | 'approved';

export interface HousePoints {
  hufflepuff: number;
  gryffindor: number;
  slytherin: number;
  ravenclaw: number;
}

export interface HouseAnnouncement {
  id: string;
  title: string;
  content: string;
  author: string;
  role: string;
  date: string;
  category: 'ข่าวสารสำคัญ' | 'กิจกรรม Roleplay' | 'กฎระเบียบบ้าน' | 'ประกาศฝึกซ้อม';
  pinned?: boolean;
}

export interface HouseEvent {
  id: string;
  timeIrl: string;
  timeRp: string;
  title: string;
  location: string;
  category: 'meeting' | 'quidditch' | 'class' | 'duel';
  dateLabel: string;
}

export interface ClassScheduleItem {
  id: string;
  year: number;
  day: 'จันทร์' | 'อังคาร' | 'พุธ' | 'พฤหัสบดี' | 'ศุกร์' | 'เสาร์' | 'อาทิตย์';
  date?: string; // Format: YYYY-MM-DD (e.g. 2026-09-10)
  timeIrl: string;
  timeRp: string;
  subject: string;
  professor: string;
  classroom: string;
  requiredEquip: string;
}

export type SpellCategory = 'Basic' | 'Curse' | 'Protect' | 'Treat';

export interface SpellItem {
  id: string;
  name: string;
  category: SpellCategory;
  tiers: number; // จำนวนขั้น (1 - 5)
  minYear: number; // ชั้นปีที่เรียนได้
  slashCommand: string;
  description: string;
  effect: string;
  cooldown?: string;
}

export interface DirectoryMember {
  id: string;
  name: string;
  studentId: string;
  year: number;
  role: HouseRole;
  roles?: HouseRole[];
  avatar: string;
  status: 'online' | 'in-game' | 'offline';
  specialty: string;
  possessedSpells?: string[];
}
