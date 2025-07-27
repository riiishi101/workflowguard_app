import { useState, useEffect } from "react";
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
import { Wifi, Bell, RefreshCw, Users, Eye, User, Activity, Clock, AlertCircle } from "lucide-react";
import { apiService } from "@/services/api";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ui/use-toast";

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
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const [connectedUsers, setConnectedUsers] = useState<any[]>([]);
  const [userRooms, setUserRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);
  const [liveNotifications, setLiveNotifications] = useState<any[]>([]);
  const [liveUpdates, setLiveUpdates] = useState<any[]>([]);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch real-time data from backend
  const fetchRealtimeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch connection status
      const connectionData = await apiService.getRealtimeConnectionStatus();
      setConnectionStatus(connectionData);
      
      // Fetch connected users
      const usersData = await apiService.getConnectedUsers();
      setConnectedUsers(Array.isArray(usersData) ? usersData : []);
      
      // Fetch user rooms
      const roomsData = await apiService.getUserRooms();
      setUserRooms(Array.isArray(roomsData) ? roomsData : []);
      
      // For now, use sample data for notifications and updates
      // These can be implemented later with real backend endpoints
      setLiveNotifications([
        { id: '1', type: 'Workflow Updated', severity: 'Medium', message: 'Lead Nurturing Campaign was modified', time: new Date().toISOString() },
        { id: '2', type: 'New User', severity: 'Low', message: 'Sarah Johnson joined the workspace', time: new Date(Date.now() - 60000).toISOString() },
        { id: '3', type: 'System Alert', severity: 'High', message: 'High workflow usage detected', time: new Date(Date.now() - 120000).toISOString() }
      ]);
      
      setLiveUpdates([
        { id: '1', type: 'workflow_updated', data: { workflowId: '123', name: 'Lead Nurturing Campaign' }, time: new Date().toISOString() },
        { id: '2', type: 'user_activity', data: { userId: '2', action: 'login' }, time: new Date(Date.now() - 30000).toISOString() },
        { id: '3', type: 'system_maintenance', data: { message: 'Scheduled maintenance completed' }, time: new Date(Date.now() - 90000).toISOString() }
      ]);
      
      setLastRefresh(new Date());
      
    } catch (e: any) {
      console.log('Failed to fetch real-time data:', e.message);
      setError(e.message || 'Failed to fetch real-time data');
      
      // Use sample data as fallback
      setConnectionStatus({
        status: 'connected',
        lastPing: new Date().toISOString(),
        uptime: '2h 15m',
        activeConnections: 5
      });
      
      setConnectedUsers([
        { id: '1', name: 'John Smith', email: 'john@example.com', status: 'Online', lastSeen: new Date().toISOString() },
        { id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', status: 'Online', lastSeen: new Date().toISOString() },
        { id: '3', name: 'Mike Davis', email: 'mike@example.com', status: 'Away', lastSeen: new Date(Date.now() - 300000).toISOString() }
      ]);
      
      setLiveNotifications([
        { id: '1', type: 'Workflow Updated', severity: 'Medium', message: 'Lead Nurturing Campaign was modified', time: new Date().toISOString() },
        { id: '2', type: 'New User', severity: 'Low', message: 'Sarah Johnson joined the workspace', time: new Date(Date.now() - 60000).toISOString() },
        { id: '3', type: 'System Alert', severity: 'High', message: 'High workflow usage detected', time: new Date(Date.now() - 120000).toISOString() }
      ]);
      
      setLiveUpdates([
        { id: '1', type: 'workflow_updated', data: { workflowId: '123', name: 'Lead Nurturing Campaign' }, time: new Date().toISOString() },
        { id: '2', type: 'user_activity', data: { userId: '2', action: 'login' }, time: new Date(Date.now() - 30000).toISOString() },
        { id: '3', type: 'system_maintenance', data: { message: 'Scheduled maintenance completed' }, time: new Date(Date.now() - 90000).toISOString() }
      ]);
      
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    try {
      setLoading(true);
      const result = await apiService.getRealtimeConnectionStatus();
      setTestResult(result);
      toast({ title: 'Connection Test', description: 'Connection test completed successfully' });
    } catch (e: any) {
      setError(e.message);
      toast({ title: 'Connection Test Failed', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    try {
      await apiService.sendNotificationToAll({
        type: 'system_alert',
        title: 'Test Notification',
        message: 'This is a test notification from the real-time dashboard',
        priority: 'medium'
      });
      toast({ title: 'Notification Sent', description: 'Test notification sent successfully' });
    } catch (e: any) {
      toast({ title: 'Failed to Send', description: e.message, variant: 'destructive' });
    }
  };

  const handleSendUpdate = async () => {
    try {
      await apiService.broadcastAdminMessage({
        message: 'Test update from admin dashboard'
      });
      toast({ title: 'Update Sent', description: 'Test update sent successfully' });
    } catch (e: any) {
      toast({ title: 'Failed to Send', description: e.message, variant: 'destructive' });
    }
  };

  // Set up polling for real-time data
  useEffect(() => {
    // Initial fetch
    fetchRealtimeData();
    
    // Set up polling every 30 seconds
    const interval = setInterval(fetchRealtimeData, 30000);
    setRefreshInterval(interval);
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
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
              {testResult && <span className="ml-2 text-xs text-gray-500">Connection: {testResult.isConnected ? 'Connected' : 'Disconnected'} ({testResult.connectedUsersCount} users)</span>}
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
                  value={String(connectionStatus?.activeConnections || connectedUsers.length || '0')}
                  subtitle="Connected users"
                  status={connectionStatus?.status || 'Connected'}
                  statusColor={connectionStatus?.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                />
                <StatusCard
                  title="Notifications"
                  value={String(liveNotifications.length)}
                  subtitle="Recent notifications"
                  status="Active"
                  statusColor="bg-blue-100 text-blue-800"
                />
                <StatusCard
                  title="Updates"
                  value={String(liveUpdates.length)}
                  subtitle="Recent updates"
                  status="New"
                  statusColor="bg-purple-100 text-purple-800"
                />
                <StatusCard
                  title="Last Refresh"
                  value={lastRefresh.toLocaleTimeString()}
                  subtitle="Data updated"
                  status="Live"
                  statusColor="bg-green-100 text-green-800"
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
