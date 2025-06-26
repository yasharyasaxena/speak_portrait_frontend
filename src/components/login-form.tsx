"use client";
import React, { useEffect } from "react";
import { HiEye, HiEyeOff, HiX } from "react-icons/hi";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { LoginSchema, SignUpSchema } from "@/lib/validationSchemas";
import {
  handleLoginUsingGithub,
  handleLoginUsingGoogle,
  handleSubmit,
} from "@/lib/loginUtils";

export function LoginForm({
  className,
  register = false,
  ...props
}: React.ComponentProps<"div"> & { register?: boolean }) {
  const router = useRouter();
  const [login, setLogin] = React.useState<boolean>(!register);
  const [showPassword, setShowPassword] = React.useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    React.useState<boolean>(false);

  useEffect(() => {
    setLogin(!register);
  }, [register]);

  return (
    <div className={cn("flex flex-col gap-4", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome {login && "back"}</CardTitle>
          <CardDescription>
            {login
              ? "Login with your Github or Google account"
              : "Sign up to get started"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Formik
            initialValues={
              login
                ? { username: "", email: "", password: "" }
                : { username: "", email: "", password: "", confirmPassword: "" }
            }
            validationSchema={login ? LoginSchema : SignUpSchema}
            onSubmit={(values, formikHelpers) =>
              handleSubmit(values, formikHelpers, login, router)
            }
            enableReinitialize
          >
            {({ isSubmitting, errors, touched }) => (
              <Form>
                <div className="grid gap-4">
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full hover:cursor-pointer"
                      onClick={() => handleLoginUsingGithub(router)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="20"
                        height="20"
                        className="mr-2"
                      >
                        <path
                          fill="currentColor"
                          d="M12 2C6.477 2 2 6.484 2 12.021c0 4.428 2.865 8.184 6.839 9.504.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.53 2.341 1.088 2.91.832.091-.647.35-1.088.636-1.339-2.221-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.295 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.7 1.028 1.595 1.028 2.688 0 3.847-2.337 4.695-4.566 4.944.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.744 0 .267.18.579.688.481C19.138 20.2 22 16.447 22 12.021 22 6.484 17.523 2 12 2z"
                        />
                      </svg>
                      {login ? "Login" : "SignUp"} with Github
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full hover:cursor-pointer"
                      onClick={() => handleLoginUsingGoogle(router)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      {login ? "Login" : "SignUp"} with Google
                    </Button>
                  </div>
                  <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                    <span className="bg-card text-muted-foreground relative z-10 px-2">
                      Or continue with
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {!login && (
                      <div className="grid gap-2">
                        <Label htmlFor="username">Username</Label>
                        <div className="relative">
                          <Field
                            as={Input}
                            id="username"
                            name="username"
                            type="text"
                            placeholder="Your username"
                            required
                            className={cn(
                              touched.username &&
                                errors.username &&
                                "border-red-500 focus-visible:ring-red-500"
                            )}
                          />
                          {touched.username && errors.username && (
                            <div className="absolute right-2 top-1/2 -translate-y-1/2">
                              <HiX className="h-4 w-4 text-red-500" />
                            </div>
                          )}
                        </div>
                        <ErrorMessage
                          name="username"
                          component="div"
                          className="text-xs text-red-500"
                        />
                      </div>
                    )}
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <div className="relative">
                        <Field
                          as={Input}
                          id="email"
                          name="email"
                          type="email"
                          placeholder="m@example.com"
                          required
                          className={cn(
                            touched.email &&
                              errors.email &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {touched.email && errors.email && (
                          <div className="absolute right-2 top-1/2 -translate-y-1/2">
                            <HiX className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                      </div>
                      <ErrorMessage
                        name="email"
                        component="div"
                        className="text-xs text-red-500"
                      />
                    </div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password">Password</Label>
                        {login && (
                          <a
                            href="#"
                            className="text-sm underline-offset-4 hover:underline"
                          >
                            Forgot your password?
                          </a>
                        )}
                      </div>
                      <div className="relative">
                        <Field
                          as={Input}
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          required
                          className={cn(
                            touched.password &&
                              errors.password &&
                              "border-red-500 focus-visible:ring-red-500"
                          )}
                        />
                        {touched.password && errors.password && (
                          <div className="absolute right-10 top-1/2 -translate-y-1/2">
                            <HiX className="h-4 w-4 text-red-500" />
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword((prev) => !prev)}
                        >
                          {showPassword ? (
                            <HiEyeOff className="h-4 w-4" />
                          ) : (
                            <HiEye className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <ErrorMessage
                        name="password"
                        component="div"
                        className="text-xs text-red-500"
                      />
                    </div>
                    {!login && (
                      <div className="grid gap-2">
                        <Label htmlFor="confirmPassword">
                          Confirm Password
                        </Label>
                        <div className="relative">
                          <Field
                            as={Input}
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            className={cn(
                              touched.confirmPassword &&
                                errors.confirmPassword &&
                                "border-red-500 focus-visible:ring-red-500"
                            )}
                          />
                          {touched.confirmPassword &&
                            errors.confirmPassword && (
                              <div className="absolute right-10 top-1/2 -translate-y-1/2">
                                <HiX className="h-4 w-4 text-red-500" />
                              </div>
                            )}
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            onClick={() =>
                              setShowConfirmPassword((prev) => !prev)
                            }
                          >
                            {showConfirmPassword ? (
                              <HiEyeOff className="h-4 w-4" />
                            ) : (
                              <HiEye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <ErrorMessage
                          name="confirmPassword"
                          component="div"
                          className="text-xs text-red-500"
                        />
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full hover:cursor-pointer"
                      disabled={isSubmitting}
                    >
                      {login ? "Login" : "Sign Up"}
                    </Button>
                  </div>
                  {login ? (
                    <div className="text-center text-sm">
                      Don&apos;t have an account?{" "}
                      <a
                        className="underline underline-offset-4 hover:cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          setLogin(false);
                        }}
                      >
                        Sign up
                      </a>
                    </div>
                  ) : (
                    <div className="text-center text-sm">
                      Already have an account?{" "}
                      <a
                        className="underline underline-offset-4 hover:cursor-pointer"
                        onClick={(e) => {
                          e.preventDefault();
                          setLogin(true);
                        }}
                      >
                        Login
                      </a>
                    </div>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
