"use client"
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, Calendar, DollarSign, Search, Filter, MoreVertical, Star, CheckCircle, XCircle, Leaf, Moon, Sun, Bell, Settings } from "lucide-react";

const stats = [
  { title: "Total Users", value: "25,486", change: "+12.5%", trend: "up", icon: Users },
  { title: "Monthly Bookings", value: "5,247", change: "+8.2%", trend: "up", icon: Calendar },
  { title: "Revenue", value: "₹12.4L", change: "+15.3%", trend: "up", icon: DollarSign },
  { title: "Active Vendors", value: "342", change: "+5.7%", trend: "up", icon: TrendingUp },
];

const recentBookings = [
  { id: "BK001", customer: "Priya Sharma", vendor: "Serenity Spa", service: "Deep Tissue Massage", amount: "₹2,500", status: "completed", date: "Today, 2:30 PM" },
  { id: "BK002", customer: "Rajesh Kumar", vendor: "Zen Beauty Lounge", service: "Facial Treatment", amount: "₹1,800", status: "pending", date: "Today, 1:15 PM" },
  { id: "BK003", customer: "Anita Patel", vendor: "Natural Glow Studio", service: "Hair Spa", amount: "₹3,200", status: "confirmed", date: "Yesterday, 4:45 PM" },
];

const vendors = [
  { id: "V001", name: "Serenity Wellness Spa", location: "Delhi", rating: 4.9, bookings: 156, revenue: "₹4.2L", status: "active", joinDate: "Jan 2024" },
  { id: "V002", name: "Zen Beauty Lounge", location: "Mumbai", rating: 4.8, bookings: 234, revenue: "₹6.8L", status: "active", joinDate: "Dec 2023" },
  { id: "V003", name: "Natural Glow Studio", location: "Bangalore", rating: 4.7, bookings: 89, revenue: "₹2.1L", status: "pending", joinDate: "Feb 2024" },
];

export default function AdminDashboardPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-primary/10 text-primary";
      case "confirmed":
        return "bg-blue-100 text-blue-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "active":
        return "bg-primary/10 text-primary";
      default:
        return "bg-spa-stone text-spa-charcoal/60";
    }
  };

  return (
    <div className={`min-h-screen ${darkMode ? "bg-spa-charcoal text-white" : "bg-gradient-hero"}`}>
      <nav className={`border-b ${darkMode ? "bg-spa-charcoal/50 border-white/10" : "bg-white/95 backdrop-blur-sm border-spa-stone/20"} sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <Leaf className="h-4 w-4 text-white" />
              </div>
              <span className={`text-xl font-light tracking-wide ${darkMode ? "text-white" : "text-spa-charcoal"}`}>BeautyBook Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setDarkMode(!darkMode)} className="p-2">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" className="p-2"><Bell className="h-4 w-4" /></Button>
              <Button variant="ghost" size="sm" className="p-2"><Settings className="h-4 w-4" /></Button>
              <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">A</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className={`text-3xl font-light mb-2 ${darkMode ? "text-white" : "text-spa-charcoal"}`}>Dashboard Overview</h1>
          <p className={`font-light ${darkMode ? "text-white/60" : "text-spa-charcoal/60"}`}>Monitor your platform's performance and manage operations</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className={`rounded-lg p-6 sophisticated-shadow border ${darkMode ? "bg-spa-charcoal/30 border-white/10" : "bg-white border-spa-stone/10"}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-primary/10 rounded-lg"><stat.icon className="h-5 w-5 text-primary" /></div>
                <Badge className={`${stat.trend === "up" ? "bg-primary/10 text-primary" : "bg-red-100 text-red-600"} border-0`}>{stat.change}</Badge>
              </div>
              <div className={`text-2xl font-light mb-1 ${darkMode ? "text-white" : "text-spa-charcoal"}`}>{stat.value}</div>
              <div className={`text-sm font-light ${darkMode ? "text-white/60" : "text-spa-charcoal/60"}`}>{stat.title}</div>
            </div>
          ))}
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList className={`grid w-full max-w-md grid-cols-3 ${darkMode ? "bg-spa-charcoal/30" : "bg-white/70 backdrop-blur-sm"}`}>
            <TabsTrigger value="bookings" className="font-light">Bookings</TabsTrigger>
            <TabsTrigger value="vendors" className="font-light">Vendors</TabsTrigger>
            <TabsTrigger value="analytics" className="font-light">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-6">
            <div className={`rounded-lg sophisticated-shadow border ${darkMode ? "bg-spa-charcoal/30 border-white/10" : "bg-white border-spa-stone/10"}`}>
              <div className="p-6 border-b border-spa-stone/10">
                <div className="flex items-center justify-between mb-4">
                  <h2 className={`text-xl font-light ${darkMode ? "text-white" : "text-spa-charcoal"}`}>Recent Bookings</h2>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${darkMode ? "text-white/40" : "text-spa-charcoal/40"}`} />
                      <Input placeholder="Search bookings..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`pl-10 w-64 ${darkMode ? "bg-spa-charcoal/20 border-white/10" : "border-spa-stone/20"}`} />
                    </div>
                    <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" />Filter</Button>
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b ${darkMode ? "border-white/10" : "border-spa-stone/10"}`}>
                      {['Booking ID','Customer','Vendor','Service','Amount','Status','Actions'].map((h) => (
                        <th key={h} className={`text-left p-4 font-medium text-sm ${darkMode ? "text-white/80" : "text-spa-charcoal/80"}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentBookings.map((booking) => (
                      <tr key={booking.id} className={`border-b ${darkMode ? "border-white/5" : "border-spa-stone/5"} hover:bg-spa-stone/5`}>
                        <td className={`p-4 font-medium text-sm ${darkMode ? "text-white" : "text-spa-charcoal"}`}>{booking.id}</td>
                        <td className={`p-4 text-sm ${darkMode ? "text-white/80" : "text-spa-charcoal/80"}`}>{booking.customer}</td>
                        <td className={`p-4 text-sm ${darkMode ? "text-white/80" : "text-spa-charcoal/80"}`}>{booking.vendor}</td>
                        <td className={`p-4 text-sm ${darkMode ? "text-white/80" : "text-spa-charcoal/80"}`}>{booking.service}</td>
                        <td className={`p-4 text-sm font-medium ${darkMode ? "text-white" : "text-spa-charcoal"}`}>{booking.amount}</td>
                        <td className="p-4"><Badge className={`${getStatusColor(booking.status)} border-0 font-light`}>{booking.status}</Badge></td>
                        <td className="p-4"><Button variant="ghost" size="sm"><MoreVertical className="h-4 w-4" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vendors" className="space-y-6">
            <div className={`rounded-lg sophisticated-shadow border ${darkMode ? "bg-spa-charcoal/30 border-white/10" : "bg-white border-spa-stone/10"}`}>
              <div className="p-6 border-b border-spa-stone/10">
                <h2 className={`text-xl font-light mb-4 ${darkMode ? "text-white" : "text-spa-charcoal"}`}>Vendor Management</h2>
              </div>
              <div className="p-6">
                <div className="grid gap-4">
                  {vendors.map((vendor) => (
                    <div key={vendor.id} className={`border rounded-lg p-4 hover:bg-spa-stone/5 transition-colors ${darkMode ? "border-white/10" : "border-spa-stone/10"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 bg-spa-cream rounded-lg flex items-center justify-center">
                            <span className={`${darkMode ? "text-spa-charcoal" : "text-primary"} font-medium`}>{vendor.name.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className={`${darkMode ? "text-white" : "text-spa-charcoal"} font-medium`}>{vendor.name}</h3>
                            <div className="flex items-center gap-4 text-sm">
                              <span className={`${darkMode ? "text-white/60" : "text-spa-charcoal/60"} font-light`}>{vendor.location}</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-spa-lime text-spa-lime" />
                                <span className={`${darkMode ? "text-white/80" : "text-spa-charcoal/80"} font-light`}>{vendor.rating}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center">
                            <div className={`${darkMode ? "text-white" : "text-spa-charcoal"} text-lg font-medium`}>{vendor.bookings}</div>
                            <div className={`${darkMode ? "text-white/60" : "text-spa-charcoal/60"} text-xs font-light`}>Bookings</div>
                          </div>
                          <div className="text-center">
                            <div className={`${darkMode ? "text-white" : "text-spa-charcoal"} text-lg font-medium`}>{vendor.revenue}</div>
                            <div className={`${darkMode ? "text-white/60" : "text-spa-charcoal/60"} text-xs font-light`}>Revenue</div>
                          </div>
                          <Badge className={`${getStatusColor(vendor.status)} border-0 font-light`}>{vendor.status}</Badge>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="outline"><CheckCircle className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline"><XCircle className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className={`rounded-lg sophisticated-shadow border p-6 ${darkMode ? "bg-spa-charcoal/30 border-white/10" : "bg-white border-spa-stone/10"}`}>
              <h2 className={`text-xl font-light mb-6 ${darkMode ? "text-white" : "text-spa-charcoal"}`}>Platform Analytics</h2>
              <div className="text-center py-20">
                <TrendingUp className={`h-16 w-16 mx-auto mb-4 ${darkMode ? "text-white/20" : "text-spa-charcoal/20"}`} />
                <p className={`${darkMode ? "text-white/60" : "text-spa-charcoal/60"} font-light`}>Advanced analytics and reporting features coming soon</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
