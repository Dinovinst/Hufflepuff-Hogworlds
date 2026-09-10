import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { 
  StudentProfile, 
  DirectoryMember, 
  HouseAnnouncement, 
  ClassScheduleItem,
  HouseRole
} from '../types';
import { 
  INITIAL_ANNOUNCEMENTS, 
  INITIAL_SCHEDULE, 
  INITIAL_MEMBERS 
} from '../data/hufflepuffData';

const USERS_COLLECTION = 'users';
const ANNOUNCEMENTS_COLLECTION = 'announcements';
const SCHEDULES_COLLECTION = 'schedules';

/**
 * Fetch a single user profile from Firestore by Discord ID
 */
export async function getUserProfileFromFirestore(discordId: string): Promise<StudentProfile | null> {
  const path = `${USERS_COLLECTION}/${discordId}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, discordId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as StudentProfile;
    }
    return null;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
    return null;
  }
}

/**
 * Save or update student profile in Firestore
 */
export async function saveUserProfileToFirestore(profile: StudentProfile): Promise<void> {
  if (!profile.discordId) {
    throw new Error('discordId is required to save profile');
  }
  const path = `${USERS_COLLECTION}/${profile.discordId}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, profile.discordId);
    await setDoc(docRef, profile, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Update member roles in Firestore (Owner authorized action)
 */
export async function updateMemberRolesInFirestore(
  discordId: string,
  houseRoles: HouseRole[],
  primaryRole?: HouseRole
): Promise<void> {
  const path = `${USERS_COLLECTION}/${discordId}`;
  try {
    const docRef = doc(db, USERS_COLLECTION, discordId);
    const resolvedPrimary = primaryRole || houseRoles[0] || 'นักเรียนทั่วไป';
    await setDoc(
      docRef,
      {
        houseRoles,
        houseRole: resolvedPrimary,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Real-time subscription to all registered members in Firestore
 */
export function subscribeToMembers(callback: (members: DirectoryMember[]) => void): () => void {
  const path = USERS_COLLECTION;
  const colRef = collection(db, USERS_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const registeredMembers: DirectoryMember[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as StudentProfile;
        registeredMembers.push({
          id: d.id,
          name: data.name || 'Hufflepuff Student',
          studentId: data.studentId || '000000',
          year: data.year || 1,
          role: data.houseRole || 'นักเรียนทั่วไป',
          roles: data.houseRoles || [data.houseRole || 'นักเรียนทั่วไป'],
          avatar: data.characterPhoto || data.discordAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
          status: 'online',
          specialty: data.bio || 'สมาชิกบ้านฮัฟเฟิลพัฟ Hogworlds Wizardry Project',
          possessedSpells: data.possessedSpells || [],
        });
      });

      // Combine with mock template members if registered list is small, prioritizing registered ones
      const registeredIds = new Set(registeredMembers.map(m => m.id));
      const registeredNames = new Set(registeredMembers.map(m => m.name.toLowerCase()));
      
      const filteredInitial = INITIAL_MEMBERS.filter(
        im => !registeredIds.has(im.id) && !registeredNames.has(im.name.toLowerCase())
      );

      callback([...registeredMembers, ...filteredInitial]);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Real-time subscription to House Announcements in Firestore
 */
export function subscribeToAnnouncements(callback: (announcements: HouseAnnouncement[]) => void): () => void {
  const path = ANNOUNCEMENTS_COLLECTION;
  const colRef = collection(db, ANNOUNCEMENTS_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // If Firestore is empty, seed initial announcements
        seedInitialAnnouncements();
        callback(INITIAL_ANNOUNCEMENTS);
        return;
      }
      const list: HouseAnnouncement[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as HouseAnnouncement);
      });
      // Sort pinned first, then by date descending
      list.sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Save announcement to Firestore
 */
export async function saveAnnouncementToFirestore(announcement: HouseAnnouncement): Promise<void> {
  const path = `${ANNOUNCEMENTS_COLLECTION}/${announcement.id}`;
  try {
    const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, announcement.id);
    await setDoc(docRef, announcement, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete announcement from Firestore
 */
export async function deleteAnnouncementFromFirestore(id: string): Promise<void> {
  const path = `${ANNOUNCEMENTS_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, ANNOUNCEMENTS_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Real-time subscription to Class & Event Schedules in Firestore
 */
export function subscribeToSchedules(callback: (schedules: ClassScheduleItem[]) => void): () => void {
  const path = SCHEDULES_COLLECTION;
  const colRef = collection(db, SCHEDULES_COLLECTION);

  return onSnapshot(
    colRef,
    (snapshot) => {
      if (snapshot.empty) {
        // Seed initial schedules if empty
        seedInitialSchedules();
        callback(INITIAL_SCHEDULE);
        return;
      }
      const list: ClassScheduleItem[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as ClassScheduleItem);
      });
      callback(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  );
}

/**
 * Save schedule item to Firestore
 */
export async function saveScheduleToFirestore(schedule: ClassScheduleItem): Promise<void> {
  const path = `${SCHEDULES_COLLECTION}/${schedule.id}`;
  try {
    const docRef = doc(db, SCHEDULES_COLLECTION, schedule.id);
    await setDoc(docRef, schedule, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Delete schedule item from Firestore
 */
export async function deleteScheduleFromFirestore(id: string): Promise<void> {
  const path = `${SCHEDULES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, SCHEDULES_COLLECTION, id);
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, path);
  }
}

/**
 * Seed initial data if Firestore is currently blank
 */
async function seedInitialAnnouncements() {
  try {
    for (const ann of INITIAL_ANNOUNCEMENTS) {
      await setDoc(doc(db, ANNOUNCEMENTS_COLLECTION, ann.id), ann);
    }
  } catch (e) {
    console.warn('Initial announcements seed skipped or already present:', e);
  }
}

async function seedInitialSchedules() {
  try {
    for (const sch of INITIAL_SCHEDULE) {
      await setDoc(doc(db, SCHEDULES_COLLECTION, sch.id), sch);
    }
  } catch (e) {
    console.warn('Initial schedules seed skipped or already present:', e);
  }
}
