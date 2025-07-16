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
  // No need for versions state in empty state

  const handleAddWorkflow = () => {
    navigate('/select-workflows');
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
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              All Protected Workflows
            </h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAddWorkflow}
                variant="outline"
                size="sm"
                className="text-blue-600"
                title="Select workflows from your HubSpot account to start monitoring."
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Workflow
              </Button>
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
              Get started by adding your first workflow using the 'Add Workflow' button above.
            </p>
            <Button
              onClick={handleAddWorkflow}
              className="bg-blue-500 hover:bg-blue-600 text-white"
              title="Select workflows from your HubSpot account to start monitoring."
            >
              Add Workflow
            </Button>
            <p className="text-xs text-gray-500 mt-4 max-w-xs mx-auto">
              You can select one or more workflows from your HubSpot account to start monitoring changes and activity.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EmptyDashboard;
