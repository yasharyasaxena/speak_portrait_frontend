import { useRouter } from "next/navigation";
import { signInUsingGithub, signInUsingGoogle, loginUsingEmail, registerUsingEmail } from "../../firebase/util";

export function handleLoginUsingGithub(router: ReturnType<typeof useRouter>) {
  signInUsingGithub()
    .then(() => {
      router.push("/user/dashboard?login=success");
    })
    .catch((error) => {
      console.error("Error logging in with GitHub:", error);
    });
}

export function handleLoginUsingGoogle(router: ReturnType<typeof useRouter>) {
  signInUsingGoogle()
    .then(() => {
      router.push("/user/dashboard?login=success");
    })
    .catch((error) => {
      console.error("Error logging in with Google:", error);
    });
}

export async function handleSubmit(
  values: { username:string; email: string; password: string; confirmPassword?: string },
  { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void },
  login: boolean,
  router: ReturnType<typeof useRouter>
) {
    try {
        if (login) {
            await loginUsingEmail(values.email, values.password);
            router.push("/dashboard?login=success");
        } else {
            await registerUsingEmail(
            values.username,
            values.email,
            values.password
        );
        router.push("/user/dashboard?login=success");
    }
    } catch (error) {
    console.error(error);
    } finally {
    setSubmitting(false);
    }
}