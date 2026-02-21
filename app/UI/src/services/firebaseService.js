/**
 * Firebase Service
 *
 * Abstraction layer for Firebase Firestore operations.
 * Can be mocked/replaced for testing purposes.
 */

let firebaseServiceInstance = null;

/**
 * Initialize Firebase service
 */
export const initFirebaseService = () => {
  if (firebaseServiceInstance) {
    return firebaseServiceInstance;
  }

  firebaseServiceInstance = createFirebaseService();
  return firebaseServiceInstance;
};

/**
 * Create Firebase service with all methods
 */
const createFirebaseService = () => {
  return {
    /**
     * Subscribe to pages for a specific site
     */
    subscribeToPagesForSite: async (siteId, namespace, onSuccess, onError) => {
      try {
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');
        const { getApp } = await import('firebase/app');

        const db = getApp().firestore;
        const pagesCollection = collection(db, `${namespace}.page`);
        const pagesQuery = query(pagesCollection, where('site_id', '==', siteId));

        const unsubscribe = onSnapshot(
          pagesQuery,
          (snapshot) => {
            const pages = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            onSuccess(pages);
          },
          onError
        );

        return unsubscribe;
      } catch (err) {
        onError(err);
        return () => {};
      }
    },

    /**
     * Save a new page
     */
    savePage: async (pageData, namespace) => {
      const { collection, addDoc } = await import('firebase/firestore');
      const { getApp } = await import('firebase/app');

      const db = getApp().firestore;
      const pagesCollection = collection(db, `${namespace}.page`);
      const docRef = await addDoc(pagesCollection, pageData);

      return { id: docRef.id };
    },

    /**
     * Update an existing page
     */
    updatePage: async (pageId, pageData, namespace) => {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { getApp } = await import('firebase/app');

      const db = getApp().firestore;
      await updateDoc(doc(db, `${namespace}.page`, pageId), pageData);
    },

    /**
     * Delete a page
     */
    deletePage: async (pageId, namespace) => {
      const { doc, deleteDoc } = await import('firebase/firestore');
      const { getApp } = await import('firebase/app');

      const db = getApp().firestore;
      await deleteDoc(doc(db, `${namespace}.page`, pageId));
    },

    /**
     * Reorder two pages
     */
    reorderPages: async (draggedId, targetId, draggedPage, targetPage, namespace) => {
      const { doc, writeBatch } = await import('firebase/firestore');
      const { getApp } = await import('firebase/app');

      const db = getApp().firestore;
      const batch = writeBatch(db);

      const oldOrder = draggedPage.order || 0;
      const newOrder = targetPage.order || 0;

      batch.update(doc(db, `${namespace}.page`, draggedId), {
        order: newOrder,
        updated_at: new Date()
      });

      batch.update(doc(db, `${namespace}.page`, targetId), {
        order: oldOrder,
        updated_at: new Date()
      });

      await batch.commit();
    },

    /**
     * Update a page's parent
     */
    updatePageParent: async (pageId, newParentId, newOrder, namespace) => {
      const { doc, updateDoc } = await import('firebase/firestore');
      const { getApp } = await import('firebase/app');

      const db = getApp().firestore;
      await updateDoc(doc(db, `${namespace}.page`, pageId), {
        parent_id: newParentId,
        order: newOrder,
        updated_at: new Date()
      });
    }
  };
};

export default firebaseServiceInstance || initFirebaseService();
