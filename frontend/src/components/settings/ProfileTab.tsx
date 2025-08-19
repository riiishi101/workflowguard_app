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
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import { AlertTriangle, CheckCircle, Loader2, Save, Mail, Camera, Upload, X, Link, Unlink } from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  jobTitle?: string;
  timezone?: string;
  language?: string;
  avatarUrl?: string;
  emailVerified?: boolean;
}

const ProfileTab = () => {
  const { toast } = useToast();
  const { user, connectHubSpot, isConnecting, disconnectHubSpot } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [emailVerifying, setEmailVerifying] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  console.log('🔍 ProfileTab - Component mounted');

  useEffect(() => {
    console.log('🔍 ProfileTab - useEffect called, fetching user profile');
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      console.log('🔍 ProfileTab - Starting fetchUserProfile');
      setLoading(true);
      setError(null);
      const response = await ApiService.getUserProfile();
      console.log('🔍 ProfileTab - API response:', response);
      
      // Handle case where response.data might be undefined
      if (response && response.data) {
        setProfile(response.data);
        console.log('🔍 ProfileTab - Profile set:', response.data);
      } else {
        console.error('🔍 ProfileTab - No data in response:', response);
        setError('No profile data received from server');
        toast({
          title: "Error",
          description: "No profile data received. Please try again.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      console.error('🔍 ProfileTab - Failed to fetch user profile:', err);
      setError(err.response?.data?.message || 'Failed to load user profile. Please try again.');
      toast({
        title: "Error",
        description: "Failed to load user profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('🔍 ProfileTab - Loading finished');
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    if (!profile) return;
    
    setProfile((prev) => ({
      ...prev!,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    if (!profile) return;
    
    try {
      setSaving(true);
      await ApiService.updateUserProfile({
        name: profile.name,
        email: profile.email,
        jobTitle: profile.jobTitle,
        timezone: profile.timezone,
        language: profile.language,
      });
      
      setHasChanges(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast({
        title: "Update Failed",
        description: err.response?.data?.message || "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEmailVerification = async () => {
    if (!profile?.email) {
      toast({
        title: "No Email",
        description: "Please enter an email address first.",
        variant: "destructive",
      });
      return;
    }

    try {
      setEmailVerifying(true);
      await ApiService.verifyEmail(profile.email);
      toast({
        title: "Verification Email Sent",
        description: "A verification email has been sent to your email address. Please check your inbox.",
      });
    } catch (err: any) {
      console.error('Failed to send verification email:', err);
      toast({
        title: "Verification Failed",
        description: err.response?.data?.message || "Failed to send verification email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setEmailVerifying(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File",
          description: "Please select an image file (JPEG, PNG, GIF).",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "No File Selected",
        description: "Please select an image file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', selectedFile);

      const response = await ApiService.uploadAvatar(formData);
      
      if (response && response.data && response.data.avatarUrl) {
        setProfile((prev) => ({
          ...prev!,
          avatarUrl: response.data.avatarUrl,
        }));
        
        // Clean up
        setSelectedFile(null);
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl);
          setPreviewUrl(null);
        }
        
        toast({
          title: "Avatar Updated",
          description: "Your profile picture has been updated successfully.",
        });
      }
    } catch (err: any) {
      console.error('Failed to upload avatar:', err);
      toast({
        title: "Upload Failed",
        description: err.response?.data?.message || "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await ApiService.removeAvatar();
      setProfile((prev) => ({
        ...prev!,
        avatarUrl: undefined,
      }));
      toast({
        title: "Avatar Removed",
        description: "Your profile picture has been removed.",
      });
    } catch (err: any) {
      console.error('Failed to remove avatar:', err);
      toast({
        title: "Remove Failed",
        description: err.response?.data?.message || "Failed to remove avatar. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    try {
      await ApiService.deleteAccount();
      toast({
        title: "Account Deleted",
        description: "Your account has been deleted successfully.",
      });
      // Redirect to logout or home page
      window.location.href = '/';
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      toast({
        title: "Delete Failed",
        description: err.response?.data?.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j}>
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchUserProfile}
              className="ml-2"
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            No profile data available.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <Avatar className="h-16 w-16">
            <AvatarImage src={previewUrl || profile.avatarUrl || "/placeholder-avatar.jpg"} alt={profile.name} />
            <AvatarFallback className="text-lg">
              {profile.name.split(' ').map(n => n[0]).join('').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          {/* Avatar Upload Overlay */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-50 rounded-full">
            <label htmlFor="avatar-upload" className="cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </label>
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        </div>
        
        <div>
          <h2 className="text-xl font-semibold text-gray-900">{profile.name}</h2>
          <p className="text-gray-600">{profile.email}</p>
          {profile.emailVerified && (
            <div className="flex items-center gap-1 mt-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm text-green-600">Email verified</span>
            </div>
          )}
        </div>
      </div>

      {/* Avatar Upload Section */}
      {selectedFile && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={previewUrl || ""} alt="Preview" />
                <AvatarFallback className="text-sm">Preview</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-600">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleAvatarUpload}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    if (previewUrl) {
                      URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                    }
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
              value={profile.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
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
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleEmailVerification}
                disabled={emailVerifying || profile.emailVerified}
              >
                {emailVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : profile.emailVerified ? (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Verified
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4 mr-2" />
                    Verify Email
                  </>
                )}
              </Button>
            </div>
            {profile.emailVerified && (
              <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Your email address is verified
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="job-title">Job Title</Label>
            <Input
              id="job-title"
              value={profile.jobTitle || ""}
              onChange={(e) => handleInputChange("jobTitle", e.target.value)}
              className="mt-1"
              placeholder="Enter your job title"
            />
          </div>
        </CardContent>
      </Card>

      {/* HubSpot Connection */}
      <Card>
        <CardHeader>
          <CardTitle>HubSpot Connection</CardTitle>
        </CardHeader>
        <CardContent>
          {user?.hubspotPortalId ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-green-600">Connected</p>
                <p className="text-sm text-gray-500">Portal ID: {user.hubspotPortalId}</p>
              </div>
              <Button variant="destructive" onClick={disconnectHubSpot}>
                <Unlink className="w-4 h-4 mr-2" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-red-600">Not Connected</p>
                <p className="text-sm text-gray-500">Connect your HubSpot account to get started.</p>
              </div>
              <Button onClick={() => connectHubSpot(false)} disabled={isConnecting}>
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4 mr-2" />
                    Connect HubSpot
                  </>
                )}
              </Button>
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
              value={profile.timezone || "Pacific Time (PT) UTC-7"}
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
              value={profile.language || "English (US)"}
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
          <Button variant="destructive" onClick={handleDeleteAccount}>
            Delete Account
          </Button>
        </CardContent>
      </Card>

      {/* Save Changes */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex items-center gap-2">
          {hasChanges && (
            <span className="text-sm text-gray-600">
              You have unsaved changes
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" disabled={!hasChanges}>
            Cancel
          </Button>
          <Button 
            className="bg-blue-500 hover:bg-blue-600 text-white"
            onClick={handleSaveChanges}
            disabled={!hasChanges || saving}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileTab;
