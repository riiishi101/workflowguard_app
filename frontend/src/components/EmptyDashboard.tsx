import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TopNavigation from "@/components/TopNavigation";
import {
  Search,
  Plus,
  Download,
  CheckCircle,
  TrendingUp,
  Users,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const EmptyDashboard = () => {
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);

  const handleAddWorkflow = () => {
    window.location.href = "https://www.workflowguard.pro/workflow-selection";
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Dashboard Overview
          </h1>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-900">
                No active workflows to monitor
              </p>
              <p className="text-xs text-green-700">
                Last Snapshot: Today, 2:30 PM IST
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-500" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">0</div>
              <div className="text-sm text-gray-600">Active Workflows</div>
              <div className="text-xs text-gray-500 mt-1">
                Start your first workflow
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">0%</div>
              <div className="text-sm text-gray-600">Total Uptime</div>
              <div className="text-xs text-gray-500 mt-1">
                No data available
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-500" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900 mb-1">0/500</div>
              <div className="text-sm text-gray-600">Monitored Services</div>
              <div className="text-xs text-gray-500 mt-1">
                Maximum plan capacity
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                All Protected Workflows
              </h2>
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleAddWorkflow}
                  variant="outline"
                  size="sm"
                  className="text-blue-600"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Workflow
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search workflows by name..."
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-3">
                <Select defaultValue="modified">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Last Modified" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="modified">Last Modified</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="versions">Versions</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="status">
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="status">Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="folder">
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="HubSpot Folder" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="folder">HubSpot Folder</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" className="text-blue-600">
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Empty State */}
          <div className="py-16 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FolderOpen className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No workflows yet
            </h3>
            <p className="text-gray-600 text-sm mb-6 max-w-md mx-auto">
              Get started by adding your first workflow using the 'Add Workflow'
              button above
            </p>
            <Button
              onClick={handleAddWorkflow}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Add Workflow
            </Button>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Rows per page:
              <Select defaultValue="10">
                <SelectTrigger className="w-16 ml-2 inline-flex">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </p>

            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">0 workflows</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" disabled>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="bg-blue-500 text-white hover:bg-blue-600"
                >
                  1
                </Button>
                <Button variant="ghost" size="sm" disabled>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmptyDashboard;
