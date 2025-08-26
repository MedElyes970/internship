import { db } from './firebase';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';

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


