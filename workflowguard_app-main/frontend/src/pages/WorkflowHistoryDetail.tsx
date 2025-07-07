import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import TopNavigation from "@/components/TopNavigation";
import {
  Search,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  Eye,
  RotateCcw,
  Copy,
  Download,
  Loader2,
} from "lucide-react";
import { useRequireAuth, useAuth } from '../components/AuthContext';
import RollbackConfirmModal from "@/components/RollbackConfirmModal";
import ViewDetailsModal from "@/components/ViewDetailsModal";
import apiService from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { saveAs } from 'file-saver';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import RoleGuard from '../components/RoleGuard';

const WorkflowHistoryDetail = () => {
  useRequireAuth();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { workflowId } = useParams();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [showRollbackModal, setShowRollbackModal] = useState(false);
  const [showViewDetailsModal, setShowViewDetailsModal] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedModifiedBy, setSelectedModifiedBy] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditError, setAuditError] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState('all');
  const [auditUserFilter, setAuditUserFilter] = useState('all');
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [showAuditLogModal, setShowAuditLogModal] = useState(false);
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const [auditRowsPerPage, setAuditRowsPerPage] = useState(10);
  const [auditSearchTerm, setAuditSearchTerm] = useState("");
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  
  useEffect(() => {
    if (!workflowId) return;
    setLoading(true);
    setError("");
    apiService.getWorkflowVersions(workflowId)
      .then((data) => setVersions(Array.isArray(data) ? data : []))
      .catch((e) => setError(e.message || "Failed to load workflow history"))
      .finally(() => setLoading(false));
  }, [workflowId]);

  // Reset to page 1 when filters/search change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedModifiedBy, selectedDateRange]);

  // Filtering logic
  const filteredVersions = versions.filter((version) => {
    const matchesSearch = (version.changeSummary || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModifier = selectedModifiedBy === "all" || version.modifiedBy?.name === selectedModifiedBy;
    let matchesDate = true;
    if (selectedDateRange !== "all" && version.createdAt) {
      const date = parseISO(version.createdAt);
      if (selectedDateRange === "today") matchesDate = isToday(date);
      else if (selectedDateRange === "week") matchesDate = isThisWeek(date);
      else if (selectedDateRange === "month") matchesDate = isThisMonth(date);
    }
    return matchesSearch && matchesModifier && matchesDate;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredVersions.length / rowsPerPage);
  const paginatedVersions = filteredVersions.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Fetch audit logs for this workflow
  useEffect(() => {
    if (!workflowId) return;
    setAuditLoading(true);
    setAuditError("");
    apiService.getAuditLogs(undefined, 'workflow', workflowId)
      .then((logs) => setAuditLogs(Array.isArray(logs) ? logs : []))
      .catch((e) => setAuditError(e.message || "Failed to load audit logs"))
      .finally(() => setAuditLoading(false));
  }, [workflowId]);

  // Reset audit log page when filters change
  useEffect(() => {
    setAuditCurrentPage(1);
  }, [auditActionFilter, auditUserFilter]);

  // Audit log pagination logic
  const auditTotalPages = Math.ceil(auditLogs.length / auditRowsPerPage);
  const paginatedAuditLogs = auditLogs.slice(
    (auditCurrentPage - 1) * auditRowsPerPage,
    auditCurrentPage * auditRowsPerPage
  );

  // Filtered audit logs (with search)
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter;
    const matchesUser = auditUserFilter === 'all' || (log.user?.name || log.user?.email || log.userId) === auditUserFilter;
    const search = auditSearchTerm.toLowerCase();
    const matchesSearch =
      log.action?.toLowerCase().includes(search) ||
      (log.user?.name || '').toLowerCase().includes(search) ||
      (log.user?.email || '').toLowerCase().includes(search) ||
      (log.userId || '').toLowerCase().includes(search) ||
      (log.details ? JSON.stringify(log.details).toLowerCase() : '').includes(search) ||
      (log.entityType || '').toLowerCase().includes(search) ||
      (log.entityId || '').toLowerCase().includes(search);
    return matchesAction && matchesUser && (!auditSearchTerm || matchesSearch);
  });

  // Export filtered audit logs as CSV
  const handleExportAuditLogs = () => {
    if (!filteredAuditLogs.length) return;
    const headers = ['Action', 'User', 'Timestamp', 'Details'];
    const rows = filteredAuditLogs.map(log => [
      log.action,
      log.user?.name || log.user?.email || log.userId || 'Unknown',
      log.timestamp ? format(new Date(log.timestamp), 'PPpp') : '',
      log.details ? JSON.stringify(log.details) : '-'
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'audit-log.csv');
  };

  // Export filtered audit logs as JSON
  const handleExportAuditLogsJSON = () => {
    if (!filteredAuditLogs.length) return;
    const blob = new Blob([JSON.stringify(filteredAuditLogs, null, 2)], { type: 'application/json' });
    saveAs(blob, 'audit-log.json');
  };

  const handleAuditLogRowClick = (log) => {
    setSelectedAuditLog(log);
    setShowAuditLogModal(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <button
            onClick={() => navigate("/dashboard")}
            className="hover:text-gray-900"
          >
            Dashboard
          </button>
          <span>&gt;</span>
          <button
            onClick={() => navigate("/workflow-history")}
            className="hover:text-gray-900"
          >
            Workflow History
          </button>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Customer Onboarding</span>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-900">
              Workflow History: Customer Onboarding
            </h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("https://app.hubspot.com", "_blank")}
                className="text-blue-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View in HubSpot
              </Button>
              <RoleGuard roles={['admin', 'restorer']}>
              <Button
                onClick={() => {
                  if (filteredVersions.length > 0) {
                    setSelectedVersion(filteredVersions[0]);
                    setShowRollbackModal(true);
                  }
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Rollback Latest
              </Button>
              </RoleGuard>
              <RoleGuard roles={['admin', 'restorer']}>
                <Button
                  onClick={async () => {
                    if (!workflowId) return;
                    setSnapshotLoading(true);
                    try {
                      await apiService.syncWorkflowFromHubSpot(workflowId);
                      toast({ title: 'Snapshot Created', description: 'A new version was created from HubSpot.' });
                      // Refresh version list
                      const data = await apiService.getWorkflowVersions(workflowId);
                      setVersions(Array.isArray(data) ? data : []);
                    } catch (e: any) {
                      toast({ title: 'Error', description: e.message || 'Failed to snapshot from HubSpot', variant: 'destructive' });
                    } finally {
                      setSnapshotLoading(false);
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                  disabled={snapshotLoading}
                >
                  {snapshotLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                  Snapshot from HubSpot
                </Button>
              </RoleGuard>
            </div>
          </div>
        </div>

        {/* Workflow Status */}
        <div className="flex items-center justify-between mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-gray-900">
                Customer Onboarding
              </h2>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                Active
              </Badge>
            </div>
            <div className="text-sm text-gray-600">
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                Last modified: June 23, 2025, 2:30 PM IST
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-600">12 versions tracked</div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search history by change summary or..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedModifiedBy} onValueChange={setSelectedModifiedBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Modified By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {Array.from(new Set(versions.map(v => v.modifiedBy?.name).filter(Boolean))).map((name) => (
                  <SelectItem key={name} value={name}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-blue-600" onClick={() => { setSelectedModifiedBy("all"); setSelectedDateRange("all"); setSearchTerm(""); }}>
              Clear Filters
            </Button>
          </div>
        </div>

        {/* Version History Table */}
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  Version
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  Date & Time
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  Modified By
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  Change Summary
                </th>
                <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8">Loading...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="text-center text-red-600 py-8">{error}</td></tr>
              ) : paginatedVersions.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8">No versions found.</td></tr>
              ) : (
                paginatedVersions.map((version) => (
                  <tr key={version.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {version.version}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {version.dateTime}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-red-100 text-red-800">
                            {version.modifiedBy?.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-gray-900">
                          {version.modifiedBy?.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {version.changeSummary}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          aria-label={`View changes for ${version.version}`}
                          onClick={() => {
                            setSelectedVersion(version);
                            setShowViewDetailsModal(true);
                          }}
                        >
                          View Changes
                        </Button>
                        <RoleGuard roles={['admin', 'restorer']}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-blue-600 hover:text-blue-700"
                          aria-label={`Rollback to ${version.version}`}
                          onClick={() => {
                            setSelectedVersion(version);
                            setShowRollbackModal(true);
                          }}
                        >
                          Rollback
                        </Button>
                        </RoleGuard>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Version ID
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select value={String(rowsPerPage)} onValueChange={v => setRowsPerPage(Number(v))}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {currentPage} of {totalPages || 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages || totalPages === 0}
              aria-label="Next page"
            >
              Next
            </Button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="mt-12">
          <h2 className="text-lg font-semibold mb-4">Audit Log</h2>
          <div className="flex items-center gap-3 mb-4">
            <Input
              placeholder="Search audit logs..."
              value={auditSearchTerm}
              onChange={e => setAuditSearchTerm(e.target.value)}
              className="max-w-xs"
              aria-label="Search audit logs"
            />
            <Select value={auditActionFilter} onValueChange={setAuditActionFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {Array.from(new Set(auditLogs.map(log => log.action).filter(Boolean))).map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={auditUserFilter} onValueChange={setAuditUserFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {Array.from(new Set(auditLogs.map(log => log.user?.name || log.user?.email || log.userId).filter(Boolean))).map(user => (
                  <SelectItem key={user} value={user}>{user}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" className="text-blue-600" onClick={() => { setAuditActionFilter('all'); setAuditUserFilter('all'); setAuditSearchTerm(''); }}>
              Clear Audit Filters
            </Button>
            <Button variant="outline" size="sm" className="text-blue-600" onClick={handleExportAuditLogs} disabled={filteredAuditLogs.length === 0}>
              Export CSV
            </Button>
            <Button variant="outline" size="sm" className="text-blue-600" onClick={handleExportAuditLogsJSON} disabled={filteredAuditLogs.length === 0}>
              Export JSON
            </Button>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Action</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">User</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Timestamp</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-700">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {auditLoading ? (
                  <tr><td colSpan={4} className="text-center py-8">Loading...</td></tr>
                ) : auditError ? (
                  <tr><td colSpan={4} className="text-center text-red-600 py-8">{auditError}</td></tr>
                ) : paginatedAuditLogs.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8">No audit log entries found.</td></tr>
                ) : (
                  paginatedAuditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleAuditLogRowClick(log)}>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{log.action}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{log.user?.name || log.user?.email || log.userId || 'Unknown'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.timestamp ? format(new Date(log.timestamp), 'PPpp') : ''}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{log.details ? JSON.stringify(log.details) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <Select value={String(auditRowsPerPage)} onValueChange={v => setAuditRowsPerPage(Number(v))}>
              <SelectTrigger className="w-16">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuditCurrentPage(p => Math.max(1, p - 1))}
              disabled={auditCurrentPage === 1}
              aria-label="Previous audit log page"
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {auditCurrentPage} of {auditTotalPages || 1}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAuditCurrentPage(p => Math.min(auditTotalPages, p + 1))}
              disabled={auditCurrentPage === auditTotalPages || auditTotalPages === 0}
              aria-label="Next audit log page"
            >
              Next
            </Button>
          </div>
        </div>
      </main>

      <RollbackConfirmModal
        open={showRollbackModal}
        onClose={() => { setShowRollbackModal(false); setSelectedVersion(null); }}
        onConfirm={async () => {
          if (!selectedVersion || !workflowId || !user) return;
          setLoading(true);
          try {
            await apiService.createWorkflowVersion({
              workflowId,
              versionNumber: selectedVersion.versionNumber,
              snapshotType: "restore",
              createdBy: user.id,
              data: selectedVersion.data,
            });
            toast({
              title: "Rollback Successful",
              description: `Workflow has been rolled back to version ${selectedVersion.versionNumber}.`,
              variant: 'default',
              duration: 4000,
            });
            // Refetch versions
            const data = await apiService.getWorkflowVersions(workflowId);
            setVersions(Array.isArray(data) ? data : []);
          } catch (e: any) {
            toast({
              title: "Error",
              description: e.message || "Failed to rollback workflow.",
              variant: 'destructive',
              duration: 5000,
            });
          } finally {
            setShowRollbackModal(false);
            setSelectedVersion(null);
            setLoading(false);
          }
        }}
        workflowName={selectedVersion?.version}
      />
      <ViewDetailsModal
        open={showViewDetailsModal}
        onClose={() => { setShowViewDetailsModal(false); setSelectedVersion(null); }}
        version={selectedVersion}
      />

      {/* Audit Log Details Modal */}
      <Dialog open={showAuditLogModal} onOpenChange={setShowAuditLogModal}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Audit Log Details</DialogTitle>
          <DialogDescription>
            Detailed information about the selected audit log entry.
          </DialogDescription>
          {selectedAuditLog && (
            <div className="space-y-2 mt-4">
              <div><strong>Action:</strong> {selectedAuditLog.action}</div>
              <div><strong>User:</strong> {selectedAuditLog.user?.name || selectedAuditLog.user?.email || selectedAuditLog.userId || 'Unknown'}</div>
              <div><strong>Timestamp:</strong> {selectedAuditLog.timestamp ? format(new Date(selectedAuditLog.timestamp), 'PPpp') : ''}</div>
              <div><strong>Entity Type:</strong> {selectedAuditLog.entityType}</div>
              <div><strong>Entity ID:</strong> {selectedAuditLog.entityId}</div>
              <div><strong>Old Value:</strong> <pre className="bg-gray-100 rounded p-2 overflow-x-auto text-xs">{selectedAuditLog.oldValue ? JSON.stringify(selectedAuditLog.oldValue, null, 2) : '-'}</pre></div>
              <div><strong>New Value:</strong> <pre className="bg-gray-100 rounded p-2 overflow-x-auto text-xs">{selectedAuditLog.newValue ? JSON.stringify(selectedAuditLog.newValue, null, 2) : '-'}</pre></div>
              <div><strong>IP Address:</strong> {selectedAuditLog.ipAddress || '-'}</div>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button variant="outline" onClick={() => setShowAuditLogModal(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WorkflowHistoryDetail;
