import { initializeApp, getApps } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyCvRG0b0Ry-SjIGephMTAq6_bQQbHEwoi8",
  authDomain: "customs-ai-a93a2.firebaseapp.com",
  projectId: "customs-ai-a93a2",
  storageBucket: "customs-ai-a93a2.firebasestorage.app",
  messagingSenderId: "945422656044",
  appId: "1:945422656044:web:afe5636ba8cdedab31e789",
  measurementId: "G-5C2ZPZP6L3",
};

// Initialize Firebase (prevent multiple initializations)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Initialize Analytics only on client side
let analytics: ReturnType<typeof getAnalytics> | null = null;

export const initAnalytics = async () => {
  if (typeof window !== "undefined" && (await isSupported())) {
    analytics = getAnalytics(app);
  }
  return analytics;
};

export { app, analytics };
