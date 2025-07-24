import * as Yup from "yup";
  
export const LoginSchema = Yup.object().shape({
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().min(6, "Min 6 characters").required("Required"),
});

export const SignUpSchema = Yup.object().shape({
    username: Yup.string().min(3, "Min 3 characters").required("Required"),
    email: Yup.string().email("Invalid email").required("Required"),
    password: Yup.string().min(6, "Min 6 characters").required("Required"),
    confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Required"),
});