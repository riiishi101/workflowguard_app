import { useState, useEffect, useRef } from "react";
import TopNavigation from "@/components/TopNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Wifi, Bell, RefreshCw, Users, Eye, User } from "lucide-react";
import { io, Socket } from 'socket.io-client';

const StatusCard = ({
  title,
  value,
  subtitle,
  status,
  statusColor,
  action,
}: {
  title: string;
  value: string;
  subtitle: string;
  status: string;
  statusColor: string;
  action?: string;
}) => (
  <div className="bg-white rounded-lg border border-gray-200 p-6">
    <div className="flex items-start justify-between mb-4">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <Badge className={`${statusColor} text-xs`}>{status}</Badge>
    </div>
    <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="flex items-center justify-between">
      <p className="text-sm text-gray-500">{subtitle}</p>
      {action && (
        <Button variant="link" size="sm" className="text-blue-500 p-0 h-auto">
          {action}
        </Button>
      )}
    </div>
  </div>
);

const NotificationItem = ({
  type,
  severity,
  message,
  time,
}: {
  type: string;
  severity: "Critical" | "High" | "Medium";
  message: string;
  time: string;
}) => {
  const severityColors = {
    Critical: "bg-red-100 text-red-800",
    High: "bg-orange-100 text-orange-800",
    Medium: "bg-yellow-100 text-yellow-800",
  };

  return (
    <div className="flex items-start justify-between py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-1">
          <span className="font-medium text-gray-900">{type}</span>
          <Badge className={`text-xs ${severityColors[severity]}`}>
            {severity}
          </Badge>
        </div>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
      <span className="text-xs text-gray-500 ml-4">{time}</span>
    </div>
  );
};

const ConnectedUserItem = ({
  name,
  email,
  connectionTime,
  status,
}: {
  name: string;
  email: string;
  connectionTime: string;
  status: "Online";
}) => (
  <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
    <div className="flex items-center space-x-3">
      <Avatar className="w-8 h-8">
        <AvatarImage src="/api/placeholder/32/32" />
        <AvatarFallback className="text-xs">
          {name
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </AvatarFallback>
      </Avatar>
      <div>
        <div className="font-medium text-gray-900 text-sm">{name}</div>
        <div className="text-xs text-gray-500">{email}</div>
      </div>
    </div>
    <div className="text-right">
      <div className="text-xs text-gray-500 mb-1">{connectionTime}</div>
      <Badge className="bg-green-100 text-green-800 text-xs">{status}</Badge>
    </div>
  </div>
);

export default function RealTimeDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [userRooms, setUserRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [liveNotifications, setLiveNotifications] = useState<any[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<any[]>([]);
  const [socketConnected, setSocketConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/testConnection");
      const data = await response.json();
      setConnectionStatus(data);
      setTestResult(data.testResult);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = () => {
    // Implementation of handleSendNotification
  };

  const handleSendUpdate = () => {
    // Implementation of handleSendUpdate
  };

  useEffect(() => {
    // Connect to WebSocket
    const token = localStorage.getItem('token');
    const socket = io('/realtime', {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
    });
    socketRef.current = socket;
    socket.on('connect', () => setSocketConnected(true));
    socket.on('disconnect', () => setSocketConnected(false));
    socket.on('notification', (notif) => {
      setLiveNotifications((prev) => [{ ...notif, _ts: Date.now() }, ...prev].slice(0, 20));
    });
    socket.on('update', (update) => {
      setLiveUpdates((prev) => [{ ...update, _ts: Date.now() }, ...prev].slice(0, 20));
    });
    socket.on('connected', (data) => {
      // Optionally show a welcome message or update state
    });
    socket.on('connect_error', (err) => {
      setSocketConnected(false);
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  return (
      <div className="min-h-screen bg-white">
        <TopNavigation />

        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                Real-time Dashboard
              </h1>
              <p className="text-gray-600">
                Monitor live connections, send notifications, and view real-time
                updates
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge className={connectionStatus?.isConnected ? 'bg-green-500 text-white px-3 py-1' : 'bg-gray-300 text-gray-700 px-3 py-1'}>
                {connectionStatus?.isConnected ? 'Connected' : 'Disconnected'}
              </Badge>
              <Button variant="outline" className="flex items-center" onClick={handleTestConnection} disabled={loading}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Connection
              </Button>
              {testResult && <span className="ml-2 text-xs text-gray-500">{testResult}</span>}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">Loading...</div>
          ) : error ? (
            <div className="flex justify-center items-center h-64 text-red-500">{error}</div>
          ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-8">
              <TabsTrigger value="overview" className="flex items-center">
                <Eye className="w-4 h-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center">
                <Bell className="w-4 h-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="updates" className="flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Updates
              </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center">
                  <User className="w-4 h-4 mr-2" />
                  Admin Controls
                </TabsTrigger>
              <TabsTrigger value="users" className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                Connected Users
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              {/* Status Cards */}
              <div className="grid grid-cols-4 gap-6">
                <StatusCard
                  title="Connection Status"
                  value={String(connectionStatus?.connectedUsersCount?.toLocaleString() || '0')}
                  subtitle="Connected users"
                  status={connectionStatus?.isConnected ? 'Online' : 'Offline'}
                  statusColor={connectionStatus?.isConnected ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                />
                <StatusCard
                  title="Notifications"
                  value={String(connectedUsers.length)}
                  subtitle="Recent notifications"
                  status="Active"
                  statusColor="bg-blue-100 text-blue-800"
                />
                <StatusCard
                  title="Updates"
                  value={String(userRooms.length)}
                  subtitle="Recent updates"
                  status="New"
                  statusColor="bg-purple-100 text-purple-800"
                />
                <StatusCard
                  title="Your Rooms"
                  value={String(userRooms.length)}
                  subtitle="Active rooms"
                  status="View All"
                  statusColor="bg-gray-100 text-gray-800"
                />
              </div>

              {/* Connection Details */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Connection Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">User ID</span>
                    <span className="text-sm font-medium text-gray-900">
                      {connectionStatus?.userId || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Email Address</span>
                    <span className="text-sm font-medium text-gray-900">
                      {connectionStatus?.userEmail || '-'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Connected Users Count
                    </span>
                    <span className="text-sm font-medium text-gray-900">
                      {connectionStatus?.connectedUsersCount?.toLocaleString() || '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Notifications */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Recent Notifications
                </h3>
                <div className="space-y-1">
                  {liveNotifications.length === 0 ? (
                    <div className="text-gray-500 text-sm">No notifications.</div>
                  ) : (
                    liveNotifications.map((notif, idx) => (
                      <NotificationItem
                        key={notif.id || idx}
                        type={notif.type}
                        severity={notif.severity || 'Medium'}
                        message={notif.message}
                        time={notif.time || ''}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Connected Users */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Connected Users
                </h3>
                <div className="space-y-1">
                  {connectedUsers.length === 0 ? (
                    <div className="text-gray-500 text-sm">No users connected.</div>
                  ) : connectedUsers.map((user, idx) => (
                    <ConnectedUserItem
                      key={user.id || idx}
                      name={user.name || user.email || 'User'}
                      email={user.email}
                      connectionTime={`Connected: ${user.connectedAt ? new Date(user.connectedAt).toLocaleString() : '-'}`}
                      status="Online"
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  All Notifications
                </h3>
                <div className="space-y-1">
                  {liveNotifications.length === 0 ? (
                    <div className="text-gray-500 text-sm">No notifications.</div>
                  ) : (
                    liveNotifications.map((notif, idx) => (
                      <NotificationItem
                        key={notif.id || idx}
                        type={notif.type}
                        severity={notif.severity || 'Medium'}
                        message={notif.message}
                        time={notif.time || ''}
                      />
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="updates" className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  Recent Updates
                </h3>
                <div className="space-y-4">
                  {liveUpdates.length === 0 ? (
                    <div className="text-gray-500 text-sm">No updates.</div>
                  ) : (
                    liveUpdates.map((update, idx) => (
                      <div key={update.id || idx} className="flex items-start justify-between py-3 border-b border-gray-100">
                        <div>
                          <div className="font-medium text-gray-900 mb-1">{update.title}</div>
                          <div className="text-sm text-gray-600">{update.message}</div>
                        </div>
                        <div className="text-xs text-gray-500">{update.time || ''}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </TabsContent>

              <TabsContent value="admin" className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  {/* Send Notification Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Send Notification
                      </h3>
                      <p className="text-sm text-gray-600">
                        Send real-time notifications to users
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <Select defaultValue="system-alert">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="system-alert">
                              System Alert
                            </SelectItem>
                            <SelectItem value="maintenance">Maintenance</SelectItem>
                            <SelectItem value="update">Update</SelectItem>
                            <SelectItem value="security">Security Alert</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Priority
                        </label>
                        <Select defaultValue="medium">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target
                        </label>
                        <Select defaultValue="all-users">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-users">All Users</SelectItem>
                            <SelectItem value="specific-user">
                              Specific User
                            </SelectItem>
                            <SelectItem value="admin-only">Admin Only</SelectItem>
                            <SelectItem value="active-users">
                              Active Users
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <Input placeholder="Notification title" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message
                        </label>
                        <textarea
                          className="w-full min-h-[80px] rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Notification message"
                        />
                      </div>

                      <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" onClick={handleSendNotification} disabled={loading}>
                        Send Notification
                      </Button>
                    </div>
                  </div>

                  {/* Send Update Section */}
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Send Update
                      </h3>
                      <p className="text-sm text-gray-600">
                        Send real-time updates to users
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <Select defaultValue="workflow-updated">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="workflow-updated">
                              Workflow Updated
                            </SelectItem>
                            <SelectItem value="system-status">
                              System Status
                            </SelectItem>
                            <SelectItem value="user-action">User Action</SelectItem>
                            <SelectItem value="data-sync">Data Sync</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Target
                        </label>
                        <Select defaultValue="all-users">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all-users">All Users</SelectItem>
                            <SelectItem value="specific-user">
                              Specific User
                            </SelectItem>
                            <SelectItem value="admin-only">Admin Only</SelectItem>
                            <SelectItem value="active-users">
                              Active Users
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Data (JSON)
                        </label>
                        <textarea
                          className="w-full min-h-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                          placeholder='{"key": "value"}'
                          defaultValue='{"key": "value"}'
                        />
                      </div>

                      <Button className="w-full bg-gray-900 hover:bg-gray-800 text-white" onClick={handleSendUpdate} disabled={loading}>
                        Send Update
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  All Connected Users
                </h3>
                <div className="space-y-1">
                  {connectedUsers.length === 0 ? (
                    <div className="text-gray-500 text-sm">No users connected.</div>
                  ) : connectedUsers.map((user, idx) => (
                    <ConnectedUserItem
                      key={user.id || idx}
                      name={user.name || user.email || 'User'}
                      email={user.email}
                      connectionTime={`Connected: ${user.connectedAt ? new Date(user.connectedAt).toLocaleString() : '-'}`}
                      status="Online"
                    />
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          )}
        </div>
      </div>
  );
}
