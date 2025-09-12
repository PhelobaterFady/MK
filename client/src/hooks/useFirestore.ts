import { useState, useEffect } from 'react';
import { ref, onValue, off, get, set, update, push, remove } from 'firebase/database';
import { database } from '../lib/firebase';

export interface FirestoreHookOptions {
  listen?: boolean;
}

export function useFirestoreDocument<T>(path: string, options: FirestoreHookOptions = {}) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    const dbRef = ref(database, path);

    if (options.listen) {
      const unsubscribe = onValue(
        dbRef,
        (snapshot) => {
          try {
            if (snapshot.exists()) {
              const value = snapshot.val();
              setData(value);
            } else {
              setData(null);
            }
            setError(null);
          } catch (err) {
            setError(err as Error);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      get(dbRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setData(snapshot.val());
          } else {
            setData(null);
          }
          setError(null);
        })
        .catch((err) => {
          setError(err as Error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [path, options.listen]);

  return { data, loading, error };
}

export function useFirestoreCollection<T>(path: string, options: FirestoreHookOptions = {}) {
  const [data, setData] = useState<Record<string, T>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!path) {
      setLoading(false);
      return;
    }

    const dbRef = ref(database, path);

    if (options.listen) {
      const unsubscribe = onValue(
        dbRef,
        (snapshot) => {
          try {
            if (snapshot.exists()) {
              const value = snapshot.val();
              setData(value || {});
            } else {
              setData({});
            }
            setError(null);
          } catch (err) {
            setError(err as Error);
          } finally {
            setLoading(false);
          }
        },
        (err) => {
          setError(err as Error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } else {
      get(dbRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setData(snapshot.val() || {});
          } else {
            setData({});
          }
          setError(null);
        })
        .catch((err) => {
          setError(err as Error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [path, options.listen]);

  // Convert to array format
  const dataArray = Object.entries(data).map(([id, value]) => ({
    id,
    ...value
  })) as (T & { id: string })[];

  return { data: dataArray, dataObject: data, loading, error };
}

export const useFirestoreActions = () => {
  const createDocument = async (path: string, data: any) => {
    const dbRef = ref(database, path);
    return set(dbRef, data);
  };

  const updateDocument = async (path: string, data: any) => {
    const dbRef = ref(database, path);
    return update(dbRef, data);
  };

  const deleteDocument = async (path: string) => {
    const dbRef = ref(database, path);
    return remove(dbRef);
  };

  const pushDocument = async (path: string, data: any) => {
    const dbRef = ref(database, path);
    return push(dbRef, data);
  };

  return {
    createDocument,
    updateDocument,
    deleteDocument,
    pushDocument
  };
};
