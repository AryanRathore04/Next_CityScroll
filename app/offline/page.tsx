import React from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Wifi,
  WifiOff,
  Download,
  Smartphone,
  Globe,
  Zap,
  Shield,
  Bell,
  MapPin,
  BarChart3,
  Gift,
  Bot,
  Languages,
  Moon,
  Sun,
} from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 py-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <WifiOff className="h-12 w-12 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              You're Offline
            </h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            No worries! CityScroll works offline too. You can still access your
            bookings, browse cached salons, and use many features without an
            internet connection.
          </p>
        </div>

        {/* Offline Capabilities */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <Shield className="h-6 w-6" />
              Available Offline Features
            </CardTitle>
            <CardDescription className="text-blue-600">
              These features work even without an internet connection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">View Bookings</div>
                  <div className="text-sm text-gray-500">
                    Access your appointment history
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <MapPin className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium">Browse Salons</div>
                  <div className="text-sm text-gray-500">
                    View cached salon information
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Bot className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium">AI Recommendations</div>
                  <div className="text-sm text-gray-500">
                    Based on cached preferences
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Languages className="h-5 w-5 text-orange-600" />
                <div>
                  <div className="font-medium">Language Settings</div>
                  <div className="text-sm text-gray-500">
                    Switch between 12 languages
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Moon className="h-5 w-5 text-indigo-600" />
                <div>
                  <div className="font-medium">Theme Settings</div>
                  <div className="text-sm text-gray-500">
                    Light/dark mode switching
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
                <Shield className="h-5 w-5 text-green-600" />
                <div>
                  <div className="font-medium">Account Info</div>
                  <div className="text-sm text-gray-500">
                    View profile and preferences
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* PWA Features */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6" />
              Progressive Web App Features
            </CardTitle>
            <CardDescription>
              CityScroll is a full-featured Progressive Web App
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Download className="h-5 w-5 text-blue-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Installable App</h4>
                    <p className="text-sm text-gray-600">
                      Add CityScroll to your home screen for a native app
                      experience
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <WifiOff className="h-5 w-5 text-green-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Offline Support</h4>
                    <p className="text-sm text-gray-600">
                      Core features work without internet connection
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Bell className="h-5 w-5 text-purple-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Push Notifications</h4>
                    <p className="text-sm text-gray-600">
                      Receive booking reminders and updates
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-yellow-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Fast Loading</h4>
                    <p className="text-sm text-gray-600">
                      Cached content loads instantly
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="h-5 w-5 text-indigo-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Multi-Language</h4>
                    <p className="text-sm text-gray-600">
                      Available in 12 languages worldwide
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Smartphone className="h-5 w-5 text-pink-600 mt-1" />
                  <div>
                    <h4 className="font-medium">Mobile Optimized</h4>
                    <p className="text-sm text-gray-600">
                      Perfect mobile experience on any device
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-orange-200 bg-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-orange-800">
                <WifiOff className="h-6 w-6" />
                Connection Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Internet Connection</span>
                  <Badge variant="destructive">Offline</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Cached Content</span>
                  <Badge variant="default" className="bg-green-600">
                    Available
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Service Worker</span>
                  <Badge variant="default" className="bg-blue-600">
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Offline Features</span>
                  <Badge variant="default" className="bg-purple-600">
                    Enabled
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Shield className="h-6 w-6" />
                Available Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Link href="/bookings">
                  <Button className="w-full justify-start" variant="outline">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View My Bookings
                  </Button>
                </Link>
                <Link href="/salons">
                  <Button className="w-full justify-start" variant="outline">
                    <MapPin className="h-4 w-4 mr-2" />
                    Browse Salons
                  </Button>
                </Link>
                <Link href="/account">
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="h-4 w-4 mr-2" />
                    Account Settings
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sync Information */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-center">🔄 Automatic Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-3">
              <p className="text-gray-600">
                When your connection is restored, CityScroll will automatically:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                  <Wifi className="h-8 w-8 text-green-600" />
                  <span className="font-medium">Sync Data</span>
                  <span className="text-sm text-gray-500 text-center">
                    Update bookings and salon information
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                  <Bell className="h-8 w-8 text-blue-600" />
                  <span className="font-medium">Send Notifications</span>
                  <span className="text-sm text-gray-500 text-center">
                    Deliver pending notifications
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg">
                  <Download className="h-8 w-8 text-purple-600" />
                  <span className="font-medium">Update Cache</span>
                  <span className="text-sm text-gray-500 text-center">
                    Refresh offline content
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500">
          <p className="mb-2">CityScroll PWA v1.0.0</p>
          <p className="text-sm">
            Built with Next.js 14, featuring offline capabilities and
            progressive web app technology
          </p>
        </div>
      </div>
    </div>
  );
}
