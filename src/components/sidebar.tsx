"use client";
import Link from "next/link";
import { useState } from "react";
import { IoIosArrowDown } from "react-icons/io";

export default function Sidebar({ videos }: { videos: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="w-64 h-full bg-gray-800 text-white flex flex-col">
      <div className="flex items-center justify-center h-16 border-b border-gray-700">
        <h1 className="text-xl font-bold">SpeakPortrait</h1>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href="/user/dashboard"
              className="block px-4 py-2 hover:bg-gray-700 rounded"
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/user/generate"
              className="block px-4 py-2 hover:bg-gray-700 rounded"
            >
              Generate AI Portrait
            </Link>
          </li>
          <li>
            <ul className="space-y-2 mt-2">
              <li>
                <button
                  className="flex w-full items-center justify-between px-4 py-2 hover:bg-gray-700 rounded hover:cursor-pointer transition-colors duration-200"
                  onClick={() => setOpen((prev) => !prev)}
                >
                  Gallery
                  <div
                    className={`transform transition-transform duration-200 ${
                      open ? "rotate-0" : "-rotate-90"
                    }`}
                  >
                    <IoIosArrowDown />
                  </div>
                </button>
              </li>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <ul className="pl-4 space-y-1 relative">
                  <div className="absolute left-0 w-px h-full bg-gray-600 ml-2"></div>
                  <li>
                    <Link
                      href="/user/gallery"
                      className="block px-4 py-2 hover:bg-gray-700 rounded transition-colors duration-200 relative"
                    >
                      <div className="absolute -left-2 top-1/2 w-4 h-px bg-gray-600"></div>
                      All Videos
                    </Link>
                  </li>
                  {videos.map((video, index) => (
                    <li key={index}>
                      <Link
                        href={`/user/gallery/${video}`}
                        className="block px-4 py-2 hover:bg-gray-700 rounded transition-colors duration-200 relative"
                      >
                        <div className="absolute -left-2 top-1/2 w-4 h-px bg-gray-600"></div>
                        {video}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </ul>
          </li>
          <li>
            <Link
              href="/user/settings"
              className="block px-4 py-2 hover:bg-gray-700 rounded"
            >
              Settings
            </Link>
          </li>
          <li>
            <Link
              href="/user/help"
              className="block px-4 py-2 hover:bg-gray-700 rounded"
            >
              Help
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  );
}
