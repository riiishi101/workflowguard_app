import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Eye, AlertTriangle, ExternalLink, Copy, Loader2, Lock } from "lucide-react";
import SsoConfiguration from "./SsoConfiguration";
import WebhooksConfiguration from "./WebhooksConfiguration";
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import React from 'react';
import PremiumModal from "@/components/PremiumModal";

interface ApiKeyMeta {
  id: string;
  description: string;
  createdAt: string;
  lastUsed: string | null;
  revoked: boolean;
}

interface ApiKeyCreateResponse {
  id: string;
  description: string;
  createdAt: string;
  key: string;
}

const ApiAccessTab = ({ setActiveTab }) => {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState("api-access");
  const [apiKeys, setApiKeys] = useState<ApiKeyMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lastDeletedKey, setLastDeletedKey] = useState<any | null>(null);
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [newRawKey, setNewRawKey] = useState<string | null>(null);
  const [canEdit, setCanEdit] = useState(false);
  const [planChecked, setPlanChecked] = useState(false);

  useEffect(() => {
    async function checkPlan() {
      try {
        const plan = await apiService.getMyPlan();
        if ((plan as any).features && (plan as any).features.includes('api_access')) {
          setCanEdit(true);
        } else {
          setCanEdit(false);
        }
      } catch (e) {
        setCanEdit(false);
      } finally {
        setPlanChecked(true);
      }
    }
    checkPlan();
  }, []);

  useEffect(() => {
    if (!canEdit) {
      setLoading(false);
      return;
    }
    const fetchKeys = async () => {
      setLoading(true);
      setError(null);
      try {
        const keys: ApiKeyMeta[] = await apiService.getApiKeys();
        setApiKeys(keys);
      } catch (e: any) {
        setError(e.message || 'Failed to load API keys');
      } finally {
        setLoading(false);
      }
    };
    fetchKeys();
  }, [canEdit]);

  const handleGenerateKey = async () => {
    try {
      const newKey: ApiKeyCreateResponse = await apiService.createApiKey('New API Key');
      setApiKeys([{ id: newKey.id, description: newKey.description, createdAt: newKey.createdAt, lastUsed: null, revoked: false }, ...apiKeys]);
      setNewRawKey(newKey.key);
      setShowKeyModal(true);
      toast({ title: 'API Key Generated', description: 'A new API key has been created.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to generate API key', variant: 'destructive' });
    }
  };

  const handleRevealKey = (id: string) => {
    setApiKeys(keys => keys.map(k => k.id === id ? { ...k, revealed: !k.revealed } : k));
    toast({ title: 'API Key Revealed', description: 'API key visibility toggled.' });
  };

  const handleDeleteKey = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await apiService.deleteApiKey(confirmDeleteId);
      const deletedKey = apiKeys.find(k => k.id === confirmDeleteId);
      setApiKeys(keys => keys.filter(k => k.id !== confirmDeleteId));
      setLastDeletedKey(deletedKey);
      toast({
        title: 'API Key Deleted',
        description: 'The API key has been deleted.',
        action: {
          label: 'Undo',
          onClick: () => {
            if (deletedKey) setApiKeys(prev => [deletedKey, ...prev]);
            setLastDeletedKey(null);
            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
          },
        },
      });
      // Remove undo after 5 seconds
      undoTimeoutRef.current = setTimeout(() => setLastDeletedKey(null), 5000);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete API key', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  const handleGoToPlan = () => setActiveTab && setActiveTab('plan-billing');

  if (!planChecked || loading) return <div className="py-8 text-center text-gray-500">Loading...</div>;
  if (!canEdit) {
    return (
      <PremiumModal
        isOpen={true}
        onUpgrade={handleGoToPlan}
        onCloseAndGoToPlan={handleGoToPlan}
        message="API access is available on the Enterprise plan. Upgrade to unlock this feature."
      />
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
        <TabsList className="bg-gray-100">
          <TabsTrigger value="api-access">API Access</TabsTrigger>
          <TabsTrigger value="single-sign-on">Single Sign-On</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>
        <TabsContent value="api-access" className="space-y-6">
          <div className="pt-10 pb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              API & Integrations Management
            </h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              Generate API keys for programmatic access to WorkflowGuard's
              version control and audit data
            </p>
          </div>
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Security Notice: API keys provide full access to your account.
              Keep them secure and never share them publicly.
            </AlertDescription>
          </Alert>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>API Keys</CardTitle>
              <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleGenerateKey}>
                <Plus className="w-4 h-4 mr-2" />
                Generate New Key
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-8 text-center text-gray-500">Loading API keys...</div>
              ) : error ? (
                <div className="py-8 text-center text-red-500">{error}</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>KEY ID</TableHead>
                      <TableHead>DESCRIPTION</TableHead>
                      <TableHead>CREATED</TableHead>
                      <TableHead>LAST USED</TableHead>
                      <TableHead>ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-mono text-sm flex items-center gap-2">
                          {key.id}
                        </TableCell>
                        <TableCell>{key.description}</TableCell>
                        <TableCell className="text-gray-600">
                          {key.createdAt ? new Date(key.createdAt).toLocaleString() : ''}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {key.lastUsed ? new Date(key.lastUsed).toLocaleString() : ''}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleDeleteKey(key.id)}>
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="mt-4">
                <Button variant="outline" className="text-blue-600" asChild>
                  <a href="https://docs.workflowguard.com/api" target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View API Documentation
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
          {/* Delete Confirmation Dialog */}
          {confirmDeleteId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-8 relative">
                <h2 className="text-lg font-semibold mb-4">Delete API Key?</h2>
                <p className="mb-6">Are you sure you want to delete this API key? This action cannot be undone.</p>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setConfirmDeleteId(null)} disabled={deleting}>Cancel</Button>
                  <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2" onClick={confirmDelete} disabled={deleting}>
                    {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete
                  </Button>
                </div>
              </div>
            </div>
          )}
        </TabsContent>
        <TabsContent value="single-sign-on" className="space-y-6">
          <SsoConfiguration canEdit={canEdit} planChecked={planChecked} />
        </TabsContent>
        <TabsContent value="webhooks" className="space-y-6">
          <WebhooksConfiguration canEdit={canEdit} planChecked={planChecked} />
        </TabsContent>
      </Tabs>
      {/* Show raw API key modal */}
      {showKeyModal && newRawKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-8 relative">
            <h2 className="text-lg font-semibold mb-4">Your New API Key</h2>
            <p className="mb-4 text-gray-700">Copy and save this key now. You won't be able to see it again!</p>
            <div className="bg-gray-100 rounded px-4 py-2 font-mono text-sm break-all mb-4">{newRawKey}</div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => {navigator.clipboard.writeText(newRawKey); toast({ title: 'Copied', description: 'API key copied to clipboard.' });}}>Copy</Button>
              <Button variant="outline" onClick={() => { setShowKeyModal(false); setNewRawKey(null); }}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiAccessTab;
