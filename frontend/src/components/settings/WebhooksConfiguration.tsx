import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye, Edit, Trash2, Copy, Loader2, Lock } from "lucide-react";
import AddWebhookModal from "./AddWebhookModal";
import { useToast } from '@/components/ui/use-toast';
import apiService from '@/services/api';
import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const WebhooksConfiguration = ({ canEdit = true, planChecked = true, setActiveTab = () => {} }) => {
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingWebhook, setEditingWebhook] = useState<any | null>(null);
  const [viewingWebhook, setViewingWebhook] = useState<any | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [lastDeletedWebhook, setLastDeletedWebhook] = useState<any | null>(null);
  const undoTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchWebhooks = async () => {
      setLoading(true);
      setError(null);
      try {
        const hooks = await apiService.getWebhooks();
        setWebhooks(hooks as unknown as any[]);
      } catch (e: any) {
        setError(e.message || 'Failed to load webhooks');
      } finally {
        setLoading(false);
      }
    };
    fetchWebhooks();
  }, []);

  const handleAddWebhook = async (webhook: any) => {
    try {
      const newWebhook = await apiService.addWebhook(webhook);
      setWebhooks([newWebhook, ...webhooks]);
      toast({ title: 'Webhook Added', description: 'A new webhook has been added.' });
      setShowAddModal(false);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to add webhook', variant: 'destructive' });
    }
  };

  const handleEditWebhook = async (id: string, webhookData: any) => {
    setEditingWebhook(webhookData);
    setShowAddModal(true);
  };

  const handleUpdateWebhook = async (webhook: any) => {
    try {
      const updated = await apiService.updateWebhook(editingWebhook.id, webhook);
      setWebhooks(webhooks.map(w => w.id === editingWebhook.id ? updated : w));
      toast({ title: 'Webhook Updated', description: 'Webhook has been updated.' });
      setShowAddModal(false);
      setEditingWebhook(null);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update webhook', variant: 'destructive' });
    }
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    setEditingWebhook(null);
  };

  const handleDeleteWebhook = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    try {
      await apiService.deleteWebhook(confirmDeleteId);
      const deletedWebhook = webhooks.find(w => w.id === confirmDeleteId);
      setWebhooks(webhooks.filter(w => w.id !== confirmDeleteId));
      setLastDeletedWebhook(deletedWebhook);
      toast({
        title: 'Webhook Deleted',
        description: 'The webhook has been deleted.',
        action: {
          label: 'Undo',
          onClick: () => {
            if (deletedWebhook) setWebhooks(prev => [deletedWebhook, ...prev]);
            setLastDeletedWebhook(null);
            if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
          },
        },
      });
      // Remove undo after 5 seconds
      undoTimeoutRef.current = setTimeout(() => setLastDeletedWebhook(null), 5000);
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete webhook', variant: 'destructive' });
    } finally {
      setDeleting(false);
      setConfirmDeleteId(null);
    }
  };

  const handleCopy = (value: string, label: string) => {
    navigator.clipboard.writeText(value);
    toast({ title: 'Copied', description: `${label} copied to clipboard.` });
  };

  const handleViewWebhook = (webhook: any) => {
    setViewingWebhook(webhook);
  };

  const handleViewModalClose = () => {
    setViewingWebhook(null);
  };

  const handleGoToPlan = () => setActiveTab && setActiveTab('plan-billing');

  if (!planChecked || loading) return <div className="py-8 text-center text-gray-500">Loading webhooks...</div>;
  if (error) return <div className="py-8 text-center text-red-500">{error}</div>;

  if (!canEdit) {
    return (
      <Card className="p-8 flex flex-col items-center justify-center text-center">
        <CardHeader>
          <CardTitle>Upgrade to Enterprise Plan</CardTitle>
          <CardDescription>Get access to advanced webhook integrations and automation features.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setActiveTab && setActiveTab('plan-billing')}>Upgrade Now</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pt-10 pb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Outgoing Webhooks
          </h2>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
            Configure endpoints to receive real-time notifications about events
            in your WorkflowGuard account.
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 hover:bg-blue-600"
          disabled={!canEdit}
        >
          + Add Webhook
        </Button>
      </div>
      {/* Webhooks Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading webhooks...</div>
        ) : error ? (
          <div className="py-8 text-center text-red-500">{error}</div>
        ) : (
          <Table>
            <TableHeader className="bg-gray-50">
              <TableRow>
                <TableHead className="font-medium text-gray-700">
                  NAME / DESCRIPTION
                </TableHead>
                <TableHead className="font-medium text-gray-700">
                  ENDPOINT URL
                </TableHead>
                <TableHead className="font-medium text-gray-700">
                  EVENT TYPE(S)
                </TableHead>
                <TableHead className="font-medium text-gray-700">
                  STATUS
                </TableHead>
                <TableHead className="font-medium text-gray-700">
                  LAST TRIGGERED
                </TableHead>
                <TableHead className="font-medium text-gray-700">
                  ACTIONS
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => (
                <TableRow key={webhook.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded flex items-center justify-center">
                        <span className="text-orange-600 text-sm font-medium">
                          {webhook.name
                            .split(" ")
                            .map((w: string) => w[0])
                            .join("")}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {webhook.name}
                        </div>
                        {webhook.description && (
                          <div className="text-sm text-gray-500">
                            {webhook.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600 truncate max-w-xs">
                        {webhook.endpointUrl}
                      </span>
                      <Eye className="w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {webhook.eventTypes.map((eventType: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs bg-gray-100 text-gray-700 hover:bg-gray-100"
                        >
                          {eventType}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        webhook.status === "Active" ? "default" : "secondary"
                      }
                      className={
                        webhook.status === "Active"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                      }
                    >
                      {webhook.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {webhook.lastTriggered}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleEditWebhook(webhook.id, webhook)}
                        disabled={!canEdit}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                        onClick={() => handleViewWebhook(webhook)}
                        disabled={!canEdit}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        disabled={!canEdit}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
      {/* Documentation Link */}
      <div className="flex items-center">
        <Button variant="outline" size="sm" className="text-blue-600" disabled={!canEdit}>
          📄 View Webhook Documentation
        </Button>
      </div>
      {/* Add Webhook Modal */}
      <AddWebhookModal
        open={showAddModal}
        onClose={handleModalClose}
        onAdd={editingWebhook ? handleUpdateWebhook : handleAddWebhook}
        initialData={editingWebhook}
        disabled={!canEdit}
      />
      {/* View Webhook Modal */}
      {viewingWebhook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-8 relative">
            <button
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
              onClick={handleViewModalClose}
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4">Webhook Details</h2>
            <div className="space-y-3">
              <div>
                <span className="font-medium">Name:</span> {viewingWebhook.name || <span className="text-gray-400">(none)</span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Endpoint URL:</span> <span className="font-mono break-all">{viewingWebhook.endpointUrl}</span>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(viewingWebhook.endpointUrl, 'Endpoint URL')}><Copy className="w-4 h-4" /></Button>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Secret:</span> <span className="font-mono break-all">{viewingWebhook.secret || <span className="text-gray-400">(none)</span>}</span>
                {viewingWebhook.secret && <Button variant="ghost" size="icon" onClick={() => handleCopy(viewingWebhook.secret, 'Secret')}><Copy className="w-4 h-4" /></Button>}
              </div>
              <div>
                <span className="font-medium">Event Types:</span> {viewingWebhook.eventTypes && viewingWebhook.eventTypes.length > 0 ? (
                  <ul className="list-disc ml-6">
                    {viewingWebhook.eventTypes.map((e: string, i: number) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                ) : <span className="text-gray-400">(none)</span>}
              </div>
              <div>
                <span className="font-medium">Status:</span> {viewingWebhook.status}
              </div>
              <div>
                <span className="font-medium">Last Triggered:</span> {viewingWebhook.lastTriggered}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-8 relative">
            <h2 className="text-lg font-semibold mb-4">Delete Webhook?</h2>
            <p className="mb-6">Are you sure you want to delete this webhook? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)} disabled={deleting}>Cancel</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2" onClick={confirmDelete} disabled={deleting}>
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />} Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WebhooksConfiguration;
