"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Filter,
  RefreshCw,
  Smartphone,
  Monitor,
  Tablet,
  Chrome,
  MapPin,
  Clock,
  Trash2,
  Ban,
  CheckCircle,
  AlertTriangle
} from "lucide-react"
import { cn, formatDate } from "@/lib/utils"

interface Device {
  id: string
  license_id: string
  device_hash: string
  browser_fingerprint: any
  ip_address: string
  country: string
  first_seen: string
  last_seen: string
  status: string
  license_key?: string
  plan_name?: string
}

export default function DevicesPage() {
  const [devices, setDevices] = useState<Device[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Mock data - replace with real API calls
  useEffect(() => {
    const fetchDevices = async () => {
      setTimeout(() => {
        setDevices([
          {
            id: "dev_1234567890",
            license_id: "lic_abc123",
            device_hash: "hash_device_001",
            browser_fingerprint: { browser: "Chrome", os: "Windows" },
            ip_address: "192.168.1.100",
            country: "United States",
            first_seen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            last_seen: new Date().toISOString(),
            status: "active",
            license_key: "PK-2024-XXXX",
            plan_name: "Pro"
          },
          {
            id: "dev_0987654321",
            license_id: "lic_xyz789",
            device_hash: "hash_device_002",
            browser_fingerprint: { browser: "Chrome", os: "MacOS" },
            ip_address: "10.0.0.50",
            country: "Canada",
            first_seen: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            last_seen: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            status: "active",
            license_key: "PK-2024-YYYY",
            plan_name: "Enterprise"
          },
          {
            id: "dev_5555555555",
            license_id: "lic_def456",
            device_hash: "hash_device_003",
            browser_fingerprint: { browser: "Chrome", os: "Linux" },
            ip_address: "172.16.0.10",
            country: "United Kingdom",
            first_seen: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            last_seen: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: "inactive",
            license_key: "PK-2024-ZZZZ",
            plan_name: "Basic"
          },
        ])
        setLoading(false)
      }, 500)
    }

    fetchDevices()
  }, [searchQuery, selectedStatus])

  const getDeviceIcon = (fingerprint: any) => {
    if (!fingerprint) return Monitor
    const os = fingerprint.os?.toLowerCase() || ""
    if (os.includes("android") || os.includes("ios")) return Smartphone
    if (os.includes("ipad") || os.includes("tablet")) return Tablet
    return Monitor
  }

  const getStatusColor = (lastSeen: string) => {
    const hoursSince = (Date.now() - new Date(lastSeen).getTime()) / (1000 * 60 * 60)
    if (hoursSince < 1) return "emerald"
    if (hoursSince < 24) return "cyan"
    if (hoursSince < 168) return "amber"
    return "red"
  }

  const stats = [
    { label: "Total Devices", value: "856", icon: Smartphone, color: "purple" },
    { label: "Active Now", value: "324", icon: CheckCircle, color: "emerald" },
    { label: "Inactive", value: "125", icon: AlertTriangle, color: "amber" },
    { label: "Blocked", value: "12", icon: Ban, color: "red" },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gradient">Device Management</h1>
          <p className="text-gray-400 mt-1">Monitor and manage connected devices</p>
        </div>
        <Button variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <Card key={i} className="card-hover">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full",
                    `bg-${stat.color}-500/10`
                  )}>
                    <Icon className={cn("h-6 w-6", `text-${stat.color}-400`)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by device, IP, country, or license..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filter
              </Button>
            </div>
          </div>

          {/* Status Filters */}
          <div className="flex gap-2 mt-4">
            {["all", "active", "inactive", "blocked"].map((status) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(status)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium transition-all",
                  selectedStatus === status
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/50"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 border border-white/10"
                )}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Device Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
            <p className="text-sm text-gray-400">Loading devices...</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const DeviceIcon = getDeviceIcon(device.browser_fingerprint)
            const statusColor = getStatusColor(device.last_seen)
            
            return (
              <Card key={device.id} className="card-hover group relative overflow-hidden">
                {/* Background Gradient */}
                <div className={cn(
                  "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
                  `bg-gradient-to-br from-${statusColor}-500/5 via-transparent to-transparent`
                )} />
                
                <CardContent className="pt-6 relative z-10">
                  {/* Device Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      `bg-${statusColor}-500/10 border border-${statusColor}-500/20`
                    )}>
                      <DeviceIcon className={cn("h-6 w-6", `text-${statusColor}-400`)} />
                    </div>
                    <div className="flex gap-1">
                      <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100">
                        <Ban className="h-4 w-4 text-amber-400" />
                      </button>
                      <button className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Device Info */}
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">License Key</p>
                      <p className="font-mono text-sm font-medium">{device.license_key}</p>
                      <Badge variant="default" className="mt-1 text-xs">
                        {device.plan_name}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <Chrome className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">
                        {device.browser_fingerprint?.browser || "Unknown"} • {device.browser_fingerprint?.os || "Unknown"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-300">{device.country}</span>
                      <span className="text-gray-500">({device.ip_address})</span>
                    </div>

                    <div className="pt-3 border-t border-white/10">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock className="h-3 w-3" />
                          <span>Last seen</span>
                        </div>
                        <span className={cn("font-medium", `text-${statusColor}-400`)}>
                          {formatDate(device.last_seen)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs mt-2">
                        <span className="text-gray-400">First seen</span>
                        <span className="text-gray-500">{formatDate(device.first_seen)}</span>
                      </div>
                    </div>

                    {/* Status Indicator */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full status-dot",
                          statusColor === "emerald" ? "bg-emerald-400 active" : `bg-${statusColor}-400`
                        )} />
                        <span className="text-xs text-gray-400">
                          {statusColor === "emerald" ? "Active Now" : 
                           statusColor === "cyan" ? "Active Today" :
                           statusColor === "amber" ? "Inactive" : "Offline"}
                        </span>
                      </div>
                      <code className="text-xs font-mono text-gray-600">
                        {device.device_hash.slice(0, 8)}...
                      </code>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
