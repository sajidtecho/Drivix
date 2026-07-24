// Mocked Firebase initialization to prevent crashes when environment variables are not set
export const auth = {
  currentUser: null,
  onAuthStateChanged: () => () => {},
  signOut: async () => {}
};

export const db = {};

export const googleProvider = {};

const app = {};
export default app;