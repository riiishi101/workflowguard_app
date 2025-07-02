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
import { AlertTriangle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import apiService from '@/services/api';

const ProfileTab = () => {
  const { toast } = useToast();
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
      toast({ title: 'Profile updated', description: 'Your profile has been updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update profile', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;
    setDeleting(true);
    try {
      await apiService.deleteMe();
      toast({ title: 'Account deleted', description: 'Your account has been deleted.' });
      // Optionally redirect or log out
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to delete account', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="py-8 text-center text-gray-500">Loading profile...</div>;
  if (error) return <div className="py-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src="/placeholder-avatar.jpg" alt="John Smith" />
          <AvatarFallback className="text-lg">JS</AvatarFallback>
        </Avatar>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{profile.fullName}</h2>
          <p className="text-gray-600">{profile.email}</p>
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
              value={profile.fullName}
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
                value={profile.email}
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
              value={profile.jobTitle}
              onChange={(e) => handleInputChange("jobTitle", e.target.value)}
              className="mt-1"
            />
          </div>
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
              value={profile.timezone}
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
              value={profile.language}
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
