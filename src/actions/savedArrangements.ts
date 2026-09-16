import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import type { ArrangementState, SavedArrangement } from '../lib/types'

const arrangementsCollection = collection(db, 'arrangements')

export const listSavedArrangements = async (uid: string): Promise<SavedArrangement[]> => {
  const q = query(arrangementsCollection, where('uid', '==', uid), orderBy('updatedAt', 'desc'))
  const snapshot = await getDocs(q)

  return snapshot.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name,
      updatedAt: (data.updatedAt as Timestamp | null)?.toMillis() ?? 0,
      state: data.state as ArrangementState,
    }
  })
}

export const saveNewArrangement = async (uid: string, name: string, state: ArrangementState) => {
  await addDoc(arrangementsCollection, {
    uid,
    name,
    state,
    updatedAt: serverTimestamp(),
  })
}

export const overwriteArrangement = async (id: string, state: ArrangementState) => {
  await updateDoc(doc(db, 'arrangements', id), {
    state,
    updatedAt: serverTimestamp(),
  })
}

export const deleteArrangement = async (id: string) => {
  await deleteDoc(doc(db, 'arrangements', id))
}
