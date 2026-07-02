"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Key, 
  Smartphone, 
  Activity, 
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"

export default function DashboardPage() {
  // Mock data - replace with real API calls
  const stats = [
    {
      title: "Total Licenses",
      value: "1,234",
      change: "+12.5%",
      trend: "up",
      icon: Key,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Active Devices",
      value: "856",
      change: "+8.2%",
      trend: "up",
      icon: Smartphone,
      color: "from-cyan-500 to-blue-500"
    },
    {
      title: "Revenue",
      value: "$24,531",
      change: "+23.1%",
      trend: "up",
      icon: DollarSign,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Active Users",
      value: "2,845",
      change: "+5.3%",
      trend: "up",
      icon: Users,
      color: "from-orange-500 to-red-500"
    },
  ]

  const recentActivity = [
    {
      id: 1,
      type: "activation",
      message: "New license activated",
      license: "PK-2024-XXXX",
      time: "2 minutes ago",
      icon: CheckCircle,
      color: "text-emerald-400"
    },
    {
      id: 2,
      type: "warning",
      message: "Suspicious device detected",
      license: "PK-2024-YYYY",
      time: "15 minutes ago",
      icon: AlertCircle,
      color: "text-amber-400"
    },
    {
      id: 3,
      type: "device",
      message: "New device registered",
      license: "PK-2024-ZZZZ",
      time: "1 hour ago",
      icon: Smartphone,
      color: "text-blue-400"
    },
    {
      id: 4,
      type: "expiry",
      message: "License expiring soon",
      license: "PK-2024-AAAA",
      time: "2 hours ago",
      icon: Clock,
      color: "text-orange-400"
    },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-2xl glass border border-white/10 p-8">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-cyan-500/10" />
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Welcome back, Admin! 👋
          </h1>
          <p className="text-gray-400">
            Here's what's happening with your licensing system today
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 h-40 w-40 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -left-10 -top-10 h-40 w-40 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Card key={index} className="card-hover relative overflow-hidden">
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-5`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {stat.title}
                </CardTitle>
                <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${stat.color} shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center gap-1 text-xs">
                  <TrendingUp className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">{stat.change}</span>
                  <span className="text-gray-500">from last month</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts and Activity */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-purple-400" />
              License Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-[300px] items-end justify-between gap-2">
              {[65, 45, 80, 55, 70, 90, 75, 85, 60, 95, 70, 88].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-lg bg-gradient-to-t from-purple-500/50 to-pink-500/50 hover:from-purple-500 hover:to-pink-500 transition-all duration-300 cursor-pointer group relative"
                  style={{ height: `${height}%` }}
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 px-2 py-1 rounded text-xs whitespace-nowrap">
                    {Math.floor((height / 100) * 150)} activations
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-between text-xs text-gray-500">
              <span>Jan</span>
              <span>Dec</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-cyan-400" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity) => {
                const Icon = activity.icon
                return (
                  <div
                    key={activity.id}
                    className="flex gap-3 rounded-lg bg-white/5 p-3 hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 ${activity.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-gray-500 truncate">{activity.license}</p>
                      <p className="text-xs text-gray-600 mt-1">{activity.time}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: "Create License", icon: Key, color: "purple" },
              { label: "View Devices", icon: Smartphone, color: "cyan" },
              { label: "Check Activity", icon: Activity, color: "pink" },
              { label: "Generate Report", icon: TrendingUp, color: "emerald" },
            ].map((action, i) => {
              const Icon = action.icon
              return (
                <button
                  key={i}
                  className="flex flex-col items-center gap-3 rounded-xl glass-dark border border-white/10 p-6 hover:border-purple-500/50 hover:bg-white/5 transition-all group"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full bg-${action.color}-500/20 group-hover:bg-${action.color}-500/30 transition-all`}>
                    <Icon className={`h-6 w-6 text-${action.color}-400`} />
                  </div>
                  <span className="text-sm font-medium">{action.label}</span>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
