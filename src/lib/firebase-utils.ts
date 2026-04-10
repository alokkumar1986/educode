import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Course, Lesson, UserProfile, UserProgress } from '../types';

// Error handling helper as per instructions
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// User Progress
export const getUserProgress = async (userId: string, courseId: string): Promise<UserProgress | null> => {
  const progressId = `${userId}_${courseId}`;
  const path = `progress/${progressId}`;
  try {
    const docRef = doc(db, 'progress', progressId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProgress;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const updateLessonProgress = async (userId: string, courseId: string, lessonId: string) => {
  const progressId = `${userId}_${courseId}`;
  const path = `progress/${progressId}`;
  try {
    const docRef = doc(db, 'progress', progressId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      await updateDoc(docRef, {
        completedLessons: arrayUnion(lessonId),
        lastAccessedAt: serverTimestamp()
      });
    } else {
      const newProgress: UserProgress = {
        userId,
        courseId,
        completedLessons: [lessonId],
        lastAccessedAt: serverTimestamp()
      };
      await setDoc(docRef, newProgress);
      
      // Also update user's enrolled courses
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        enrolledCourses: arrayUnion(courseId)
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

// User Profile
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const path = `users/${uid}`;
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return null;
  }
};

export const createUserProfile = async (user: any): Promise<UserProfile> => {
  const path = `users/${user.uid}`;
  try {
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || 'Anonymous',
      photoURL: user.photoURL || '',
      role: 'student',
      createdAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'users', user.uid), profile);
    return profile;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
    throw error;
  }
};

// Courses
export const getCourses = (callback: (courses: Course[]) => void) => {
  const path = 'courses';
  const q = query(collection(db, 'courses'), where('published', '==', true), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    callback(courses);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const getMyCourses = (uid: string, callback: (courses: Course[]) => void) => {
  const path = 'courses';
  const q = query(collection(db, 'courses'), where('instructorId', '==', uid), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    callback(courses);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const createCourse = async (courseData: Partial<Course>): Promise<string> => {
  const path = 'courses';
  try {
    // Safeguard: Remove any undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(courseData).filter(([_, v]) => v !== undefined)
    );

    const docRef = await addDoc(collection(db, 'courses'), {
      ...cleanedData,
      published: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      lessonCount: 0,
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const updateCourse = async (courseId: string, courseData: Partial<Course>) => {
  const path = `courses/${courseId}`;
  try {
    const docRef = doc(db, 'courses', courseId);
    
    // Safeguard: Remove any undefined values
    const cleanedData = Object.fromEntries(
      Object.entries(courseData).filter(([_, v]) => v !== undefined)
    );

    await updateDoc(docRef, {
      ...cleanedData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const getAllCourses = (callback: (courses: Course[]) => void) => {
  const path = 'courses';
  const q = query(collection(db, 'courses'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const courses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course));
    callback(courses);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const getAllUsers = (callback: (users: UserProfile[]) => void) => {
  const path = 'users';
  const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
  
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ ...doc.data() } as UserProfile));
    callback(users);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const deleteCourse = async (courseId: string) => {
  const path = `courses/${courseId}`;
  try {
    // Note: In a real app, you'd also delete lessons and progress
    await deleteDoc(doc(db, 'courses', courseId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const updateUserRole = async (uid: string, role: 'student' | 'instructor' | 'admin') => {
  const path = `users/${uid}`;
  try {
    await updateDoc(doc(db, 'users', uid), { role });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// Lessons
export const getLessons = (courseId: string, callback: (lessons: Lesson[]) => void) => {
  const path = `courses/${courseId}/lessons`;
  const q = query(collection(db, 'courses', courseId, 'lessons'), orderBy('order', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const lessons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lesson));
    callback(lessons);
  }, (error) => {
    handleFirestoreError(error, OperationType.LIST, path);
  });
};

export const addLesson = async (courseId: string, lessonData: Partial<Lesson>) => {
  const path = `courses/${courseId}/lessons`;
  try {
    const lessonsRef = collection(db, 'courses', courseId, 'lessons');
    
    // Safeguard: Remove any undefined values that Firestore doesn't support
    const cleanedData = Object.fromEntries(
      Object.entries(lessonData).filter(([_, v]) => v !== undefined)
    );

    await addDoc(lessonsRef, {
      ...cleanedData,
      courseId,
      createdAt: serverTimestamp(),
    });
    
    // Update lesson count and updatedAt in course
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
      const currentCount = courseSnap.data().lessonCount || 0;
      await updateDoc(courseRef, { 
        lessonCount: currentCount + 1,
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
};

export const updateLesson = async (courseId: string, lessonId: string, lessonData: Partial<Lesson>) => {
  const path = `courses/${courseId}/lessons/${lessonId}`;
  try {
    const lessonRef = doc(db, 'courses', courseId, 'lessons', lessonId);
    
    const cleanedData = Object.fromEntries(
      Object.entries(lessonData).filter(([_, v]) => v !== undefined)
    );

    await updateDoc(lessonRef, {
      ...cleanedData,
      updatedAt: serverTimestamp(),
    });

    const courseRef = doc(db, 'courses', courseId);
    await updateDoc(courseRef, { updatedAt: serverTimestamp() });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
};

export const deleteLesson = async (courseId: string, lessonId: string) => {
  const path = `courses/${courseId}/lessons/${lessonId}`;
  try {
    await deleteDoc(doc(db, 'courses', courseId, 'lessons', lessonId));
    
    const courseRef = doc(db, 'courses', courseId);
    const courseSnap = await getDoc(courseRef);
    if (courseSnap.exists()) {
      const currentCount = courseSnap.data().lessonCount || 0;
      await updateDoc(courseRef, { 
        lessonCount: Math.max(0, currentCount - 1),
        updatedAt: serverTimestamp()
      });
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
};
