"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Route } from "next";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Menu, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface SimpleHeaderProps {
  className?: string;
}

export function SimpleHeader({ className }: SimpleHeaderProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-white border-b border-gray-200 transition-all duration-200 shadow-sm",
        className,
      )}
    >
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <div className="w-8 h-8 bg-coral-500 rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold text-coral-500">BeautyBook</span>
          </Link>

          {/* Navigation Links - Desktop */}
          <nav className="hidden lg:flex flex-1 justify-center">
            <div className="flex items-center space-x-8">
              <Link
                href="/salons"
                className="text-gray-700 hover:text-coral-600 font-medium transition-colors"
              >
                Find Salons
              </Link>
              <Link
                href="/booking"
                className="text-gray-700 hover:text-coral-600 font-medium transition-colors"
              >
                My Bookings
              </Link>
              <Link
                href="/favorites"
                className="text-gray-700 hover:text-coral-600 font-medium transition-colors"
              >
                Favorites
              </Link>
              <Link
                href="/about"
                className="text-gray-700 hover:text-coral-600 font-medium transition-colors"
              >
                About
              </Link>
              <Link
                href="/signup?type=vendor"
                className="text-coral-600 hover:text-coral-700 font-semibold transition-colors"
              >
                Become a Partner
              </Link>
            </div>
          </nav>

          {/* Right Menu */}
          <div className="flex items-center gap-2 relative z-50">
            {/* Become a Host - Mobile Hidden */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex text-gray-700 hover:bg-gray-100 rounded-lg font-semibold"
              onClick={() => router.push("/signup?type=vendor" as Route)}
            >
              Partner with us
            </Button>

            {/* User Menu */}
            <div className="flex items-center border border-gray-300 rounded-lg p-1 hover:shadow-sm transition-shadow">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-7 h-7 rounded-md"
                  >
                    <Menu className="h-4 w-4 text-gray-700" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  side="bottom"
                  sideOffset={8}
                  className="w-64 p-0 rounded-lg border border-gray-200 shadow-xl z-50"
                >
                  <div className="py-2">
                    <button
                      onClick={() => router.push("/about" as Route)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                      Help Centre
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={() =>
                        router.push("/signup?type=vendor" as Route)
                      }
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                      Become a host
                      <div className="text-xs text-gray-500">
                        Start hosting and earn income
                      </div>
                    </button>
                    <button
                      onClick={() => router.push("/membership" as Route)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                      Membership
                    </button>
                    <button
                      onClick={() => router.push("/vendor-dashboard" as Route)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                      Vendor dashboard
                    </button>
                    <button
                      onClick={() => router.push("/booking" as Route)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                      My bookings
                    </button>
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={() => router.push("/signin" as Route)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700"
                    >
                      Log in or sign up
                    </button>
                  </div>
                </PopoverContent>
              </Popover>
              <Button
                variant="ghost"
                size="icon"
                className="w-7 h-7 rounded-md bg-gray-500 ml-1"
                onClick={() => router.push("/signin" as Route)}
              >
                <User className="h-4 w-4 text-white" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        <div className="lg:hidden mt-3 pt-3 border-t border-gray-100">
          <nav className="flex flex-wrap gap-4">
            <Link
              href="/salons"
              className="text-gray-700 hover:text-coral-600 font-medium transition-colors text-sm"
            >
              Find Salons
            </Link>
            <Link
              href="/booking"
              className="text-gray-700 hover:text-coral-600 font-medium transition-colors text-sm"
            >
              My Bookings
            </Link>
            <Link
              href="/favorites"
              className="text-gray-700 hover:text-coral-600 font-medium transition-colors text-sm"
            >
              Favorites
            </Link>
            <Link
              href="/about"
              className="text-gray-700 hover:text-coral-600 font-medium transition-colors text-sm"
            >
              About
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
