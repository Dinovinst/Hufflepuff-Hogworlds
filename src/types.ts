export type HouseRole =
  | 'เจ้าของเว็บ'
  | 'แอดมิน'
  | 'นักเรียนทั่วไป'
  | 'Prefect'
  | 'Badger แข่งขัน'
  | 'Badger กิจกรรม'
  | 'Badger วิชาการ'
  | 'ศาสตราจารย์ประจำบ้าน'
  | 'Helper'
  | 'หัวหน้าบ้าน'
  | 'Badger Leader'
  | 'นักกีฬาเชียร์ลีดเดอร์'
  | 'นักกีฬาประลองเวทย์'
  | 'นักกีฬาไม้กวาด'
  | 'นักกีฬา SAS';

export interface StudentProfile {
  discordId?: string;
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
  isOwner?: boolean; // Whether the user is the website owner
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

export type AnnouncementCategory = 'ข่าวสารสำคัญ' | 'กิจกรรม' | 'การเรียน' | 'ฝึกซ้อม' | 'อื่นๆ';

export interface HouseAnnouncement {
  id: string;
  title: string;
  content: string;
  author: string;
  role: string;
  date: string;
  category: AnnouncementCategory;
  pinned?: boolean;
}

export type EventCategory = 'ประชุม' | 'กีฬา' | 'การเรียน' | 'คาบพิเศษ' | 'กิจกรรม' | 'อื่นๆ';

export interface HouseEvent {
  id: string;
  date?: string; // Format: YYYY-MM-DD
  timeIrl: string;
  timeRp: string;
  title: string;
  location: string;
  category: EventCategory;
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
  tiers?: number; // จำนวนขั้น (1 - 5)
  minYear?: number; // ชั้นปีที่เรียนได้
  slashCommand?: string;
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
