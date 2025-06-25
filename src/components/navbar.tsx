"use client";
import Image from "next/image";
import { Button } from "./ui/button";
import { FaArrowRightLong } from "react-icons/fa6";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { logout } from "../../firebase/util";

export default function Navbar() {
  const { currentUser, isAuthenticated, loading } = useAuth();

  const items = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <nav className="p-4 px-14 border-b bg-white shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="text-lg font-bold pr-4 ">
            <Image src="/logo.png" alt="Logo" width={40} height={40} />
          </div>
          <ul className="flex space-x-10">
            {items.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-gray-700 hover:text-gray-900 transition-colors"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex items-center space-x-4">
          {loading ? (
            <Button variant="ghost" disabled>
              Loading...
            </Button>
          ) : currentUser ? (
            <>
              <Button
                variant="outline"
                className="text-gray-700 hover:text-gray-900 transition-colors hover:cursor-pointer"
              >
                {currentUser.displayName || "Profile"}
              </Button>
              <Button
                variant="destructive"
                className="hover:cursor-pointer"
                onClick={() => {
                  logout();
                  window.location.href = "/login";
                }}
              >
                Logout
              </Button>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button
                  variant="secondary"
                  className="bg-white text-black border hover:cursor-pointer"
                >
                  Sign In <FaArrowRightLong className="pt-0.5" />{" "}
                </Button>
              </Link>
              <Link href="/login?register=true">
                <Button
                  variant="ghost"
                  className="bg-[#5C53E9] text-white hover:cursor-pointer"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
