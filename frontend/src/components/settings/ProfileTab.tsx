import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import apiService from '@/services/api';
import { useAuth } from "@/components/AuthContext";
import SuccessErrorBanner from '@/components/ui/SuccessErrorBanner';

const ProfileTab = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    jobTitle: "",
    timezone: "",
    language: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'checking' | 'valid' | 'invalid'>(
    'unknown'
  );
  const [connectionMessage, setConnectionMessage] = useState<string>("");
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setLoading(true);
    apiService.getMe()
      .then((data: { name?: string; email?: string; jobTitle?: string; timezone?: string; language?: string }) => {
        setProfile({
          fullName: data.name || "",
          email: data.email || "",
          jobTitle: data.jobTitle || "",
          timezone: data.timezone || "",
          language: data.language || "",
        });
      })
      .catch((e) => setError(e.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateMe({
        name: profile.fullName,
        email: profile.email,
        jobTitle: profile.jobTitle,
        timezone: profile.timezone,
        language: profile.language,
      });
      setBanner({ type: 'success', message: 'Your profile has been updated.' });
    } catch (e: any) {
      setBanner({ type: 'error', message: e.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await apiService.deleteMe();
      setBanner({ type: 'success', message: 'Your account has been deleted.' });
      // Optionally redirect or log out
    } catch (e: any) {
      setBanner({ type: 'error', message: e.message || 'Failed to delete account' });
    } finally {
      setDeleting(false);
    }
  };

  const handleDisconnectHubSpot = async () => {
    if (!window.confirm('Are you sure you want to disconnect your HubSpot account? This will disable all HubSpot features.')) return;
    setDisconnecting(true);
    try {
      await apiService.disconnectHubSpot();
      setBanner({ type: 'success', message: 'Your HubSpot account has been disconnected.' });
      window.location.reload();
    } catch (e: any) {
      setBanner({ type: 'error', message: e.message || 'Failed to disconnect HubSpot account' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleReconnectHubSpot = () => {
    window.location.href = '/api/auth/hubspot';
  };

  const handleCheckConnection = async () => {
    if (!user?.hubspotPortalId) return;
    setConnectionStatus('checking');
    setConnectionMessage('');
    try {
      const res = await apiService.validateHubSpotConnection(user.hubspotPortalId);
      if (res.isValid) {
        setConnectionStatus('valid');
        setConnectionMessage(res.message || 'HubSpot connection validated successfully.');
      } else {
        setConnectionStatus('invalid');
        setConnectionMessage(res.message || 'HubSpot connection is not valid.');
      }
    } catch (e: any) {
      setConnectionStatus('invalid');
      setConnectionMessage(e.message || 'Failed to validate HubSpot connection.');
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading profile...</div>;

  // Use default/empty profile if error
  const profileData = error ? {
    fullName: '',
    email: '',
    jobTitle: '',
    timezone: '',
    language: '',
  } : profile;

  return (
    <div className="space-y-8">
      {banner && (
        <SuccessErrorBanner type={banner.type} message={banner.message} onClose={() => setBanner(null)} />
      )}
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src="/placeholder-avatar.jpg" alt="John Smith" />
          <AvatarFallback className="text-lg">JS</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{profileData.fullName}</h2>
          <p className="text-gray-600">{profileData.email}</p>
        </div>
      </div>

      {/* Personal Details */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="full-name">Full Name</Label>
            <Input
              id="full-name"
              value={profileData.fullName}
              onChange={(e) => handleInputChange("fullName", e.target.value)}
              className="mt-1"
            />
            <p className="text-sm text-gray-500 mt-1">
              This is how your name appears across the platform
            </p>
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <div className="flex items-center gap-2 mt-1">
              <Input
                id="email"
                value={profileData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="flex-1"
              />
              <Button variant="outline" size="sm">
                Verify Email
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="job-title">Job Title</Label>
            <Input
              id="job-title"
              value={profileData.jobTitle}
              onChange={(e) => handleInputChange("jobTitle", e.target.value)}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* HubSpot Account Connection */}
      <Card>
        <CardHeader>
          <CardTitle>HubSpot Account Connection</CardTitle>
        </CardHeader>
        <CardContent>
          {user?.hubspotPortalId ? (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                {connectionStatus === 'valid' ? (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                ) : connectionStatus === 'invalid' ? (
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                )}
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {connectionStatus === 'valid'
                      ? 'Connected (Valid)'
                      : connectionStatus === 'invalid'
                      ? 'Connected (Invalid)'
                      : 'Connected'}
                  </span>
                  {connectionStatus === 'checking' && (
                    <span className="text-xs text-gray-500">Checking...</span>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Portal ID:</span>
                    <span className="text-sm text-gray-900 font-mono">{user.hubspotPortalId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Connected as:</span>
                    <span className="text-sm text-gray-900">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 font-medium">Role:</span>
                    <span className="text-sm text-gray-900">{user.role || 'Viewer'}</span>
                  </div>
                </div>
                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
                    onClick={handleCheckConnection}
                    disabled={connectionStatus === 'checking'}
                  >
                    {connectionStatus === 'checking' ? 'Checking...' : 'Check Connection'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={handleDisconnectHubSpot}
                    disabled={disconnecting}
                  >
                    {disconnecting ? 'Disconnecting...' : 'Disconnect HubSpot'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                    onClick={handleReconnectHubSpot}
                  >
                    Reconnect to HubSpot
                  </Button>
                </div>
                {connectionStatus !== 'unknown' && (
                  <p
                    className={
                      connectionStatus === 'valid'
                        ? 'text-green-600 text-sm pt-1'
                        : 'text-red-600 text-sm pt-1'
                    }
                  >
                    {connectionMessage}
                  </p>
                )}
                <p className="text-sm text-gray-500 pt-1">
                  Disconnecting will disable all HubSpot-related features and monitoring.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
              </div>
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">Not Connected</span>
                </div>
                <p className="text-sm text-gray-500 pt-1">
                  Connect your HubSpot account to enable workflow monitoring and backup.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-orange-600 border-orange-200 hover:bg-orange-50 hover:border-orange-300"
                  onClick={handleReconnectHubSpot}
                >
                  Connect to HubSpot
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Regional Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="timezone">Time Zone</Label>
            <Select
              value={profileData.timezone}
              onValueChange={(value) => handleInputChange("timezone", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pacific Time (PT) UTC-7">
                  Pacific Time (PT) UTC-7
                </SelectItem>
                <SelectItem value="Mountain Time (MT) UTC-6">
                  Mountain Time (MT) UTC-6
                </SelectItem>
                <SelectItem value="Central Time (CT) UTC-5">
                  Central Time (CT) UTC-5
                </SelectItem>
                <SelectItem value="Eastern Time (ET) UTC-4">
                  Eastern Time (ET) UTC-4
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="language">Display Language</Label>
            <Select
              value={profileData.language}
              onValueChange={(value) => handleInputChange("language", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English (US)">English (US)</SelectItem>
                <SelectItem value="English (UK)">English (UK)</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="German">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50 mb-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Once you delete your account, there is no going back. Please be
              certain.
            </AlertDescription>
          </Alert>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>{deleting ? 'Deleting...' : 'Delete Account'}</Button>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t">
        <Button variant="outline">Cancel</Button>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default ProfileTab;
