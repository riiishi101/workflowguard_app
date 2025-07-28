import { useEffect, useState, useMemo } from "react";
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
import { Download, Calendar } from "lucide-react";
import { useAuth } from "@/components/AuthContext";
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { usePlan } from "@/components/AuthContext";
import { format } from 'date-fns';
import UpgradeRequiredModal from "@/components/UpgradeRequiredModal";

const dateRanges = [
  { value: "all", label: "All Time" },
  { value: "today", label: "Today" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
];

const actionOptions = [
  { value: "all", label: "All Actions" },
  { value: "create", label: "Created" },
  { value: "update", label: "Updated" },
  { value: "delete", label: "Deleted" },
  { value: "restore", label: "Restored" },
];

const AuditLogTab = () => {
  const { user } = useAuth();
  const { plan, hasFeature, isTrialing } = usePlan();
  const [dateRange, setDateRange] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<any[]>([]);

  // Fetch users for filter dropdown
  useEffect(() => {
    apiService.getUsers().then(setUsers).catch(() => setUsers([]));
  }, []);

  // Fetch audit logs
  useEffect(() => {
    setLoading(true);
    setError(null);
    // Build filter params
    let userId = userFilter !== "all" ? userFilter : undefined;
    // Only userId, entityType, entityId are supported by getAuditLogs
    apiService.getAuditLogs(userId)
      .then(setLogs)
      .catch((e) => setError(e.message || 'Failed to load audit logs'))
      .finally(() => setLoading(false));
  }, [dateRange, userFilter, actionFilter]);

  // Export logs as CSV
  const handleExport = () => {
    const csvRows = [
      [
        'Timestamp',
        'User',
        'Action',
        'Entity Type',
        'Entity ID',
        'Old Value',
        'New Value',
        'IP Address',
      ],
      ...logs.map((log) => [
        log.timestamp ? new Date(log.timestamp).toISOString() : '',
        log.user?.name || log.user?.email || '-',
        log.action,
        log.entityType,
        log.entityId,
        JSON.stringify(log.oldValue ?? ''),
        JSON.stringify(log.newValue ?? ''),
        log.ipAddress || '-',
      ]),
    ];
    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audit-logs.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // User options for filter
  const userOptions = useMemo(() => [
    { value: "all", label: "All Users" },
    ...users.map((u) => ({ value: u.id, label: u.name || u.email })),
  ], [users]);

  // Gating: show upgrade prompt if plan does not include audit_logs
  if (!hasFeature('audit_logs')) {
    return (
      <UpgradeRequiredModal
        isOpen={true}
        onClose={() => {}}
        feature="audit logs"
        isTrialing={isTrialing()}
        planId={plan?.planId}
        trialPlanId={plan?.trialPlanId}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Comprehensive App Activity Log</CardTitle>
          <CardDescription>Track all changes and actions performed in your workflows.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-500" />
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  {dateRanges.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={userFilter} onValueChange={setUserFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Users" />
              </SelectTrigger>
              <SelectContent>
                {userOptions.map((u) => (
                  <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                {actionOptions.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" className="text-blue-600" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export Log
            </Button>
          </div>

          {/* Table */}
          {loading ? (
            <div className="py-8 text-center text-gray-500">Loading audit logs...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-gray-500">No audit log entries found for the selected filters.</div>
          ) : (
            <div className="border border-gray-200 rounded-lg overflow-x-auto bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead>TIMESTAMP</TableHead>
                    <TableHead>USER</TableHead>
                    <TableHead>ACTION</TableHead>
                    <TableHead>ENTITY TYPE</TableHead>
                    <TableHead>ENTITY ID</TableHead>
                    <TableHead>OLD VALUE</TableHead>
                    <TableHead>NEW VALUE</TableHead>
                    <TableHead>IP ADDRESS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50 focus:bg-blue-50 transition-colors">
                      <TableCell className="font-mono text-sm text-gray-600">
                        {log.timestamp ? new Date(log.timestamp).toLocaleString() : ''}
                      </TableCell>
                      <TableCell className="font-medium">{log.user?.name || log.user?.email || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            log.action === 'delete'
                              ? 'bg-red-100 text-red-800'
                              : log.action === 'create'
                              ? 'bg-green-100 text-green-800'
                              : log.action === 'restore'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }
                        >
                          {log.action.charAt(0).toUpperCase() + log.action.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-blue-700 font-medium">{log.entityType || '-'}</TableCell>
                      <TableCell className="font-mono text-xs">{log.entityId || '-'}</TableCell>
                      <TableCell className="text-gray-600 max-w-xs truncate" title={JSON.stringify(log.oldValue)}>
                        {log.oldValue ? JSON.stringify(log.oldValue) : '-'}
                      </TableCell>
                      <TableCell className="font-medium max-w-xs truncate" title={JSON.stringify(log.newValue)}>
                        {log.newValue ? JSON.stringify(log.newValue) : '-'}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-gray-600">{log.ipAddress || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditLogTab;
