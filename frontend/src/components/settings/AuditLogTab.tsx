import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Download, Calendar, Lock } from "lucide-react";
import apiService from "@/services/api";
import PremiumModal from "../UpgradeRequiredModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { format, subDays } from 'date-fns';
import { io, Socket } from "socket.io-client";
import { useToast } from '@/components/ui/use-toast';
import { Link } from "react-router-dom";

// Define the audit log type
interface AuditLog {
  id: string;
  userId?: string;
  user?: { name: string };
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  timestamp?: string;
  createdAt?: string;
  entityName?: string;
}

// Simple JSON display component
const JsonDisplay = ({ data }: { data: any }) => {
  return (
    <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

const AuditLogTab = ({ setActiveTab }) => {
  const [dateRange, setDateRange] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [entityFilter, setEntityFilter] = useState('all');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [planChecked, setPlanChecked] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [highlightedLogId, setHighlightedLogId] = useState<string | null>(null);
  const { toast } = useToast();

  // Debug log for plan and gating state
  console.log('AuditLogTab debug:', { plan, showUpgradeBanner });

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        const userId = userFilter !== 'all' ? userFilter : undefined;
        const entityType = entityFilter !== 'all' ? entityFilter : undefined;
        const logs = await apiService.getAuditLogs(userId, entityType);
        setAuditLogs(logs as AuditLog[]);
        setShowUpgradeBanner(false);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch audit logs');
        if (
          err.message === 'Unauthorized' ||
          (typeof err.message === 'string' &&
            (err.message.toLowerCase().includes('plan') ||
              err.message.toLowerCase().includes('upgrade')))
        ) {
          setShowUpgradeBanner(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLogs();
  }, [userFilter, entityFilter, actionFilter, startDate, endDate]);

  useEffect(() => {
    apiService.getMyPlan()
      .then((data) => setPlan(data))
      .finally(() => setPlanChecked(true));
  }, []);

  useEffect(() => {
    // Connect to socket.io for real-time audit log updates
    if (!socketRef.current) {
      socketRef.current = io("/realtime", { transports: ["websocket"] });
      socketRef.current.on("connect", () => {
        // Join admin room for audit log updates
        socketRef.current?.emit("join", { room: "admin" });
      });
      socketRef.current.on("update", (update: any) => {
        if (update.type === "user_activity" && update.data) {
          // Only prepend if matches current filters
          const log = update.data;
          if (
            (userFilter === "all" || log.userId === userFilter) &&
            (entityFilter === "all" || log.entityType === entityFilter) &&
            (actionFilter === "all" || log.action === actionFilter)
          ) {
            setAuditLogs((prev) => [log, ...prev]);
            setHighlightedLogId(log.id);
            toast({
              title: 'New Activity',
              description: `${log.user?.name || log.userId || 'Someone'} performed ${log.action} on ${log.entityType}`,
              duration: 4000,
            });
            setTimeout(() => setHighlightedLogId(null), 3000);
          }
        }
      });
    }
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportAuditLogsToCSV(logs: AuditLog[]) {
    if (!logs.length) return;
    const headers = [
      'Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Old Value', 'New Value', 'IP Address'
    ];
    const rows = logs.map(log => [
      log.timestamp || log.createdAt || '',
      log.user?.name || log.userId || '-',
      log.action,
      log.entityType,
      log.entityId,
      typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue) : (log.oldValue || '-'),
      typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : (log.newValue || '-'),
      log.ipAddress || '-'
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  const handleGoToPlan = () => setActiveTab && setActiveTab('plan-billing');

  if (showUpgradeBanner) {
    return (
      <PremiumModal
        isOpen={showUpgradeBanner}
        onUpgrade={handleGoToPlan}
        onCloseAndGoToPlan={handleGoToPlan}
        message="Upgrade to Enterprise Plan\nGet access to comprehensive audit logs and advanced security features"
      />
    );
  }

  // Helper to format timestamp
  const formatTimestamp = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  };

  // Helper to style action badge
  const getActionBadge = (action) => {
    const a = action?.toLowerCase() || '';
    if (a.includes('delete')) return 'bg-red-100 text-red-800';
    if (a.includes('create')) return 'bg-green-100 text-green-800';
    if (a.includes('update') || a.includes('modify')) return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  // Helper to bold new value if changed
  const renderValue = (val, bold = false) => {
    if (!val) return '-';
    if (typeof val === 'object') return <JsonDisplay data={val} />;
    return bold ? <span className="font-bold">{val}</span> : val;
  };

  return (
    <div className="space-y-6">
      {/* Section Title and Subtitle */}
      <div>
        <h2 className="text-xl font-semibold mb-1">Comprehensive App Activity Log</h2>
        <p className="text-gray-600 text-sm mb-4">Track all changes and actions performed in your workflows</p>
      </div>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center mb-4">
        {/* Date Range Filter */}
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="week">Last 7 days</SelectItem>
            <SelectItem value="month">Last 30 days</SelectItem>
          </SelectContent>
        </Select>
        {/* User Filter (static for now) */}
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {/* Add dynamic user list if available */}
          </SelectContent>
        </Select>
        {/* Action Filter */}
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Actions" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="create">Create</SelectItem>
            <SelectItem value="update">Update</SelectItem>
            <SelectItem value="delete">Delete</SelectItem>
            <SelectItem value="restore">Restore</SelectItem>
            <SelectItem value="sync">Sync</SelectItem>
          </SelectContent>
        </Select>
        {/* Entity Type Filter */}
        <Select value={entityFilter} onValueChange={setEntityFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Entities" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="workflow">Workflow</SelectItem>
            <SelectItem value="user">User</SelectItem>
            <SelectItem value="notification_settings">Notification Settings</SelectItem>
            <SelectItem value="sso_config">SSO Config</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="text-blue-600" onClick={() => exportAuditLogsToCSV(auditLogs)}>
          <Download className="w-4 h-4 mr-2" />
          Export Log
        </Button>
      </div>

      {/* Loading/Error States */}
      {loading && <div className="text-center py-8">Loading audit logs...</div>}
      {error && (
        <div className="text-center text-red-500 py-8">{error}</div>
      )}

      {/* Audit Log Table */}
      {!loading && !error && (
        <div className="border border-gray-200 rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead>TIMESTAMP</TableHead>
                <TableHead>USER</TableHead>
                <TableHead>ACTION</TableHead>
                <TableHead>WORKFLOW NAME</TableHead>
                <TableHead>OLD VALUE</TableHead>
                <TableHead>NEW VALUE</TableHead>
                <TableHead>IP ADDRESS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {auditLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-gray-500">
                    No audit logs found.
                  </TableCell>
                </TableRow>
              ) : (
                auditLogs.map((log: any) => (
                  <TableRow key={log.id} className={`hover:bg-gray-50 ${log.id === highlightedLogId ? 'bg-yellow-100 animate-pulse' : ''}`}>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {formatTimestamp(log.timestamp || log.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {log.user?.name || log.userId || "-"}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${getActionBadge(log.action)}`}>
                        {log.action}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.entityType === 'workflow' && log.entityId ? (
                        <a href={`#`} className="text-blue-600 hover:underline font-medium">
                          {log.entityName || log.entityId}
                        </a>
                      ) : (
                        log.entityName || log.entityId || '-'
                      )}
                    </TableCell>
                    <TableCell className="text-gray-600 max-w-xs truncate">
                      {renderValue(log.oldValue)}
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                      {renderValue(log.newValue, true)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-gray-600">
                      {log.ipAddress || "-"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AuditLogTab;
