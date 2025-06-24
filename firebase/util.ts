import { auth } from './clientApp';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signInWithPopup, 
    updateProfile,
    GoogleAuthProvider, 
    GithubAuthProvider 
} from 'firebase/auth';

export const registerUsingEmail  = async (username: string, email: string, password: string) => {
    try{
        const creds = await createUserWithEmailAndPassword(auth, email, password);
        const user = creds.user;
        await updateProfile(user, {
            displayName: username,
        });
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
        return result.user;
    } catch (error) {
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
        return result.user;
    } catch (error) {
        console.error("Error registering with GitHub:", error);
        throw error;
    }
}