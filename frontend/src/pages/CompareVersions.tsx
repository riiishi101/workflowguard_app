import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import TopNavigation from "@/components/TopNavigation";
import {
  ArrowLeft,
  Plus,
  Minus,
  Mail,
  Clock,
  Calendar,
  RotateCcw,
} from "lucide-react";
import { useRequireAuth } from '../components/AuthContext';
import RoleGuard from '../components/RoleGuard';
import apiService from "@/services/api";
import { useToast } from "@/hooks/use-toast";

const CompareVersions = () => {
  useRequireAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [versionA, setVersionA] = useState(searchParams.get("versionA") || "");
  const [versionB, setVersionB] = useState(searchParams.get("versionB") || "");
  const [syncScroll, setSyncScroll] = useState(true);
  const [fontSize, setFontSize] = useState(16);
  const panelARef = useRef<HTMLDivElement>(null);
  const panelBRef = useRef<HTMLDivElement>(null);
  const [versionAData, setVersionAData] = useState<any>(null);
  const [versionBData, setVersionBData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { toast } = useToast();

  // Fetch version details from backend
  useEffect(() => {
    if (!versionA || !versionB) return;
    setLoading(true);
    setError("");
    Promise.all([
      apiService.getWorkflowVersionById(versionA),
      apiService.getWorkflowVersionById(versionB),
    ])
      .then(([a, b]) => {
        setVersionAData(a);
        setVersionBData(b);
      })
      .catch((e) => setError(e.message || "Failed to load version details"))
      .finally(() => setLoading(false));
  }, [versionA, versionB]);

  // Sync scroll logic
  useEffect(() => {
    if (!syncScroll) return;
    const handleScrollA = () => {
      if (panelARef.current && panelBRef.current) {
        panelBRef.current.scrollTop = panelARef.current.scrollTop;
      }
    };
    const handleScrollB = () => {
      if (panelARef.current && panelBRef.current) {
        panelARef.current.scrollTop = panelBRef.current.scrollTop;
      }
    };
    const a = panelARef.current;
    const b = panelBRef.current;
    if (a && b) {
      a.addEventListener('scroll', handleScrollA);
      b.addEventListener('scroll', handleScrollB);
    }
    return () => {
      if (a && b) {
        a.removeEventListener('scroll', handleScrollA);
        b.removeEventListener('scroll', handleScrollB);
      }
    };
  }, [syncScroll]);

  const handleFontSizeChange = (delta: number) => {
    setFontSize((size) => Math.max(12, Math.min(32, size + delta)));
  };

  // Restore handlers
  const handleRestore = async (version: any) => {
    if (!version) return;
    setLoading(true);
    try {
      await apiService.createWorkflowVersion({
        workflowId: version.workflowId,
        versionNumber: version.versionNumber,
        snapshotType: "restore",
        createdBy: "current-user-id", // Replace with real user id
        data: version.data,
      });
      toast({ title: 'Restore Successful', description: 'Workflow version has been restored.', variant: 'default', duration: 4000 });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to restore workflow version', variant: 'destructive', duration: 5000 });
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHistory = () => {
    navigate("/workflow-history");
  };

  const getStepColor = (step: any) => {
    if (step.isNew) return "bg-red-50 border-red-200";
    if (step.type === "email") return "bg-green-50 border-green-200";
    if (step.type === "delay") return "bg-yellow-50 border-yellow-200";
    if (step.type === "meeting") return "bg-blue-50 border-blue-200";
    return "bg-gray-50 border-gray-200";
  };

  const getStepTextColor = (step: any) => {
    if (step.isNew) return "text-red-800";
    if (step.type === "email") return "text-green-800";
    if (step.type === "delay") return "text-yellow-800";
    if (step.type === "meeting") return "text-blue-800";
    return "text-gray-800";
  };

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />

      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
          <span>Dashboard</span>
          <span>&gt;</span>
          <span>Workflow History</span>
          <span>&gt;</span>
          <span className="text-gray-900 font-medium">Compare Versions</span>
        </nav>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Compare Workflow Versions: Customer Onboarding
          </h1>
          <p className="text-sm text-gray-600">
            Last modified: June 21, 2025, 9:00 AM IST
          </p>
        </div>

        {/* Version Selectors and Controls */}
        <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Version A:
              </span>
              <Select value={versionA} onValueChange={setVersionA}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versionAData && versionAData.map((version: any) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                Version B:
              </span>
              <Select value={versionB} onValueChange={setVersionB}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versionBData && versionBData.map((version: any) => (
                    <SelectItem key={version.id} value={version.id}>
                      {version.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                checked={syncScroll}
                onCheckedChange={setSyncScroll}
                id="sync-scroll"
              />
              <label htmlFor="sync-scroll" className="text-sm text-gray-700">
                Sync Scroll
              </label>
            </div>
            <div className="flex items-center space-x-1">
              <Button variant="outline" size="sm" onClick={() => handleFontSizeChange(2)} aria-label="Increase font size">
                <Plus className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleFontSizeChange(-2)} aria-label="Decrease font size">
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Comparison Content */}
        {loading ? (
          <div className="text-center py-12">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-600 py-12">{error}</div>
        ) : (
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Version A */}
          <div className="border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">
                  Version A - {versionAData?.createdAt ? new Date(versionAData.createdAt).toLocaleString() : ""}
              </h3>
              <p className="text-sm text-gray-600">
                  Created by {versionAData?.createdBy || "-"}
              </p>
            </div>
              <div
                className="p-4 space-y-3 max-h-96 overflow-y-auto"
                ref={panelARef}
                style={{ fontSize }}
              >
                {Array.isArray(versionAData?.data?.steps) ? versionAData.data.steps.map((step: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg border flex items-center space-x-3 bg-gray-50 border-gray-200">
                    <span className="font-medium text-gray-800">{step.title}</span>
                  </div>
                )) : <div className="text-gray-400">No steps</div>}
            </div>
          </div>

          {/* Version B */}
          <div className="border border-gray-200 rounded-lg">
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h3 className="font-semibold text-gray-900">
                  Version B - {versionBData?.createdAt ? new Date(versionBData.createdAt).toLocaleString() : ""}
              </h3>
              <p className="text-sm text-gray-600">
                  Created by {versionBData?.createdBy || "-"}
              </p>
            </div>
              <div
                className="p-4 space-y-3 max-h-96 overflow-y-auto"
                ref={panelBRef}
                style={{ fontSize }}
              >
                {Array.isArray(versionBData?.data?.steps) ? versionBData.data.steps.map((step: any, index: number) => (
                  <div key={index} className="p-3 rounded-lg border flex items-center space-x-3 bg-gray-50 border-gray-200">
                    <span className="font-medium text-gray-800">{step.title}</span>
                  </div>
                )) : <div className="text-gray-400">No steps</div>}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <Button variant="outline" onClick={handleBackToHistory}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Version History
          </Button>
          <RoleGuard roles={['admin', 'restorer']}>
            <div className="flex items-center space-x-3">
              <Button variant="outline" className="text-blue-600" onClick={() => handleRestore(versionAData)} disabled={loading}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Version A
              </Button>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => handleRestore(versionBData)} disabled={loading}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Version B
              </Button>
            </div>
          </RoleGuard>
        </div>
      </main>
    </div>
  );
};

export default CompareVersions;
