import { useState, useEffect } from "react";
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
import PremiumModal from "@/components/UpgradeRequiredModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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

const AuditLogTab = () => {
  const [dateRange, setDateRange] = useState("all");
  const [userFilter, setUserFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [planChecked, setPlanChecked] = useState(false);

  useEffect(() => {
    const fetchAuditLogs = async () => {
      setLoading(true);
      setError(null);
      try {
        // For now, only userId and entityType filters are supported by backend
        const userId = userFilter !== "all" ? userFilter : undefined;
        const entityType = undefined; // Could be set from actionFilter if backend supports
        const logs = await apiService.getAuditLogs(userId, entityType);
        setAuditLogs(logs as AuditLog[]);
        setShowUpgradeBanner(false);
      } catch (err: any) {
        setError(err.message || "Failed to fetch audit logs");
        if (
          err.message === "Unauthorized" ||
          (typeof err.message === "string" &&
            (err.message.toLowerCase().includes("plan") ||
             err.message.toLowerCase().includes("upgrade")))
        ) {
          setShowUpgradeBanner(true);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchAuditLogs();
  }, [userFilter]);

  useEffect(() => {
    apiService.getMyPlan()
      .then((data) => setPlan(data))
      .finally(() => setPlanChecked(true));
  }, []);

  return (
    <div className="space-y-6">
      {showUpgradeBanner && (
        <div className="bg-orange-50 border border-orange-200 text-orange-800 rounded p-4 flex items-center gap-2">
          <Lock className="w-4 h-4 mr-2" />
          <span>Upgrade to Enterprise Plan to access audit logs</span>
        </div>
      )}
      {/* Upgrade Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Upgrade to Enterprise Plan
          </h3>
          <p className="text-gray-600 text-sm">
            Get access to comprehensive audit logs and advanced security
            features
          </p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className="bg-blue-500 hover:bg-blue-600 text-white"
                onClick={() => {
                  const url = plan?.hubspotPortalId
                    ? `https://app.hubspot.com/ecosystem/${plan.hubspotPortalId}/marketplace/apps`
                    : 'https://app.hubspot.com/ecosystem/marketplace/apps';
                  window.open(url, '_blank');
                }}
                disabled={!planChecked}
              >
          Upgrade Now
        </Button>
            </TooltipTrigger>
            <TooltipContent>
              All plan upgrades are managed in your HubSpot account. Clicking this button will open HubSpot's subscription management page.
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Audit Log Content */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Comprehensive App Activity Log
        </h3>
        <p className="text-gray-600 text-sm mb-6">
          Track all changes and actions performed in your workflows
        </p>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
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
          </div>

          <Select value={userFilter} onValueChange={setUserFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {/* TODO: Populate user list dynamically if needed */}
              {/* <SelectItem value="userId1">User 1</SelectItem> */}
            </SelectContent>
          </Select>

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {/* <SelectItem value="created">Created</SelectItem>
              <SelectItem value="updated">Updated</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem> */}
            </SelectContent>
          </Select>

          <Button variant="outline" className="text-blue-600">
            <Download className="w-4 h-4 mr-2" />
            Export Log
          </Button>
        </div>

        {/* Loading/Error States */}
        {loading && <div className="text-center py-8">Loading audit logs...</div>}
        {error && !showUpgradeBanner && (
          <div className="text-center text-red-500 py-8">{error}</div>
        )}

        {/* Audit Log Table */}
        {!loading && !error && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                {auditLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500">
                      No audit logs found.
                    </TableCell>
                  </TableRow>
                ) : (
                  auditLogs.map((log: any) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="font-mono text-sm text-gray-600">
                        {log.timestamp || log.createdAt}
                      </TableCell>
                      <TableCell className="font-medium">
                        {log.user?.name || log.userId || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            log.action?.toLowerCase().includes("delete")
                              ? "bg-red-100 text-red-800"
                              : log.action?.toLowerCase().includes("create")
                              ? "bg-green-100 text-green-800"
                              : "bg-blue-100 text-blue-800"
                          }
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>{log.entityType || "-"}</TableCell>
                      <TableCell>{log.entityId || "-"}</TableCell>
                      <TableCell className="text-gray-600">
                        {typeof log.oldValue === "object"
                          ? JSON.stringify(log.oldValue)
                          : log.oldValue || "-"}
                      </TableCell>
                      <TableCell className="font-medium">
                        {typeof log.newValue === "object"
                          ? JSON.stringify(log.newValue)
                          : log.newValue || "-"}
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
    </div>
  );
};

export default AuditLogTab;
