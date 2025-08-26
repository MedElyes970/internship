import { db } from './firebase';
import { collection, getDocs, orderBy, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';

export interface AdminUserListItem {
  id: string;
  avatar?: string;
  fullName?: string;
  email?: string;
  status?: 'active' | 'inactive';
}

const COLLECTION = 'users';

export const getAllUsers = async (): Promise<AdminUserListItem[]> => {
  const q = query(collection(db, COLLECTION));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    const status: 'active' | 'inactive' = data.status === 'inactive' ? 'inactive' : 'active';
    return {
      id: doc.id,
      avatar: data.photoURL || data.avatar || '/users/1.png',
      fullName: data.displayName || data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email || '',
      status,
    } as AdminUserListItem;
  });
};

export const promoteUserToAdminByEmail = async (email: string): Promise<{ id: string } | null> => {
  const q = query(collection(db, COLLECTION), where('email', '==', email));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const userDoc = snapshot.docs[0];
  const ref = doc(db, COLLECTION, userDoc.id);
  await updateDoc(ref, { role: 'admin', updatedAt: serverTimestamp() });
  return { id: userDoc.id };
};

export const getAdmins = async (): Promise<AdminUserListItem[]> => {
  const q = query(collection(db, COLLECTION), where('role', '==', 'admin'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      avatar: data.photoURL || data.avatar || '/users/1.png',
      fullName: data.displayName || data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim(),
      email: data.email || '',
      status: 'active',
    } as AdminUserListItem;
  });
};

export const downgradeAdminById = async (id: string): Promise<void> => {
  const ref = doc(db, COLLECTION, id);
  await updateDoc(ref, { role: 'user', updatedAt: serverTimestamp() });
};


