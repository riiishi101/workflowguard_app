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
        message="Audit logs are available on the Enterprise plan. Upgrade to unlock this feature."
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ... actual tab content ... */}
    </div>
  );
};

export default AuditLogTab;
