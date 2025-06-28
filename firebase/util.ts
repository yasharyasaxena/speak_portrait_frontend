import { auth } from './clientApp';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    updateProfile,
    GoogleAuthProvider, 
    GithubAuthProvider 
} from 'firebase/auth';

const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

const handleAuthError = (error: any) => {
  if (error.code === 'auth/account-exists-with-different-credential') {
    const email = error.customData?.email;
    alert(`An account with email ${email} already exists. Please sign in with your original method first, then link your accounts in settings.`);
  }
};

export const registerUsingEmail  = async (username: string, email: string, password: string) => {
    try{
        const creds = await createUserWithEmailAndPassword(auth, email, password);
        const user = creds.user;
        await updateProfile(user, {
            displayName: username,
        });
        const token = await user.getIdToken();
        await syncWithBackend(user.uid, token);
        return user;
    } catch (error) {
        console.error("Error registering user:", error);
        throw error;
    }
}

export const loginUsingEmail = async (email: string, password: string) => {
    try {
        const creds =  await signInWithEmailAndPassword(auth, email, password);
        if (!creds.user) {
            throw new Error("User not found");
        }
        const token = await creds.user.getIdToken();
        await syncWithBackend(creds.user.uid, token);
        return creds.user;
    } catch (error) {
        console.error("Error logging in user:", error);
        throw error;
    }
}

export const logout = async () => {
    try {
        await auth.signOut();
    } catch (error) {
        console.error("Error logging out:", error);
        throw error;
    }
}

export const signInUsingGoogle = async () => {
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        if (!result.user) {
            throw new Error("User not found after Google sign-in");
        }
        const token = await result.user.getIdToken();
        await syncWithBackend(result.user.uid, token);
        return result.user;
    } catch (error) {
        handleAuthError(error);
        console.error("Error registering with Google:", error);
        throw error;
    }
}


export const signInUsingGithub = async () => {
    try {
        const provider = new GithubAuthProvider();
        const result = await signInWithPopup(auth, provider);
        if (!result.user) {
            throw new Error("User not found after GitHub sign-in");
        }
        const token = await result.user.getIdToken();
        await syncWithBackend(result.user.uid, token);
        return result.user;
    } catch (error) {
        handleAuthError(error);
        console.error("Error registering with GitHub:", error);
        throw error;
    }
}

export const syncWithBackend = async (uid:string, token:string) => {
    try {
        const response = await fetch(`${backendUrl}/api/auth/sync`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ uid })
        });

        if (!response.ok) {
            throw new Error("Failed to sync with backend");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error syncing with backend:", error);
        throw error;
    }
}
