export default function Page() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-center mt-10">
        Welcome to the Next.js App!
      </h1>
      <p className="text-center mt-4">
        This is a simple page demonstrating the structure of a Next.js
        application.
      </p>
      <div className="flex justify-center mt-8">
        <a
          href="/login"
          className="px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        >
          Go to Login
        </a>
      </div>
    </div>
  );
}
