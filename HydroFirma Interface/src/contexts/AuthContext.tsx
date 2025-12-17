// Authentication Context
// This manages user authentication state across your entire app
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
    User,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    updateEmail,
    updatePassword,
    sendPasswordResetEmail,
    sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Define what data the context will provide
interface AuthContextType {
    currentUser: User | null;
    loading: boolean;
    signup: (email: string, password: string, name: string) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
    verifyEmail: () => Promise<void>;
    updateUserProfile: (displayName: string) => Promise<void>;
    updateUserEmail: (email: string) => Promise<void>;
    updateUserPassword: (password: string) => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Provider component that wraps your app
export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Sign up function - creates user and saves to Firestore
    async function signup(email: string, password: string, name: string) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Update user profile with display name
        await updateProfile(userCredential.user, {
            displayName: name
        });

        // Save user data to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: email,
            displayName: name,
            createdAt: serverTimestamp(),
            emailVerified: false,
            role: 'user', // Default role
            lastLogin: serverTimestamp()
        });

        // Send verification email
        await sendEmailVerification(userCredential.user);
    }

    // Login function - updates last login time
    async function login(email: string, password: string) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);

        // Update last login in Firestore
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
            lastLogin: serverTimestamp()
        }, { merge: true });
    }

    // Logout function
    function logout() {
        return signOut(auth);
    }

    // Password reset function
    function resetPassword(email: string) {
        return sendPasswordResetEmail(auth, email);
    }

    // Email verification function
    async function verifyEmail() {
        if (currentUser) {
            await sendEmailVerification(currentUser);
        }
    }

    // Update user profile
    async function updateUserProfile(displayName: string) {
        if (currentUser) {
            await updateProfile(currentUser, { displayName });

            // Update in Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                displayName: displayName,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
    }

    // Update user email
    async function updateUserEmail(email: string) {
        if (currentUser) {
            await updateEmail(currentUser, email);

            // Update in Firestore
            const userRef = doc(db, 'users', currentUser.uid);
            await setDoc(userRef, {
                email: email,
                emailVerified: false,
                updatedAt: serverTimestamp()
            }, { merge: true });
        }
    }

    // Update user password
    function updateUserPassword(password: string) {
        if (currentUser) {
            return updatePassword(currentUser, password);
        }
        return Promise.reject('No user logged in');
    }

    // Listen for auth state changes (when user logs in/out)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoading(false);
        });

        // Cleanup subscription on unmount
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        loading,
        signup,
        login,
        logout,
        resetPassword,
        verifyEmail,
        updateUserProfile,
        updateUserEmail,
        updateUserPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
