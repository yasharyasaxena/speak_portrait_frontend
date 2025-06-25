import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div className="flex bg-gray-100 px-20 pt-5">
      <Image
        src={"/hero.png"}
        alt="Hero Image"
        width={600}
        height={300}
        className="rounded-lg shadow-lg"
      />
      <div className="flex flex-col items-center text-center mx-auto justify-center w-1/3">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          Bring Any Portrait to Life with AI
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Transform static photos into realistic talking videos in minutes. Just
          upload a portrait and your audio—watch as AI creates
          professional-quality speaking videos instantly.
        </p>
        <Link href="/dashboard">
          <button className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-300 hover:cursor-pointer">
            Get Started
          </button>
        </Link>
      </div>
    </div>
  );
}
