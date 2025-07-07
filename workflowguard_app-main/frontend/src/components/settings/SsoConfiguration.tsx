import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, Copy, Lock } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import apiService from '@/services/api';
import { Alert, AlertDescription } from "@/components/ui/alert";

const SsoConfiguration = ({ canEdit = true, planChecked = true }) => {
  const { toast } = useToast();
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [protocol, setProtocol] = useState("saml");
  const [metadataMethod, setMetadataMethod] = useState("upload");
  const [justInTimeEnabled, setJustInTimeEnabled] = useState(false);
  const [ssoUrl, setSsoUrl] = useState("");
  const [issuerId, setIssuerId] = useState("");
  const [certificate, setCertificate] = useState("");
  const [metadataUrl, setMetadataUrl] = useState("");
  const [metadata, setMetadata] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiService.getSsoConfig()
      .then((data: { provider: string; metadata: string; enabled: boolean }) => {
        setSsoEnabled(data.enabled);
        setProtocol(data.provider);
        setMetadata(data.metadata);
      })
      .catch((e) => setError(e.message || 'Failed to load SSO config'))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiService.updateSsoConfig({
        provider: protocol,
        metadata,
        enabled: ssoEnabled,
      });
      toast({ title: 'SSO config updated', description: 'Your SSO configuration has been updated.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message || 'Failed to update SSO config', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (!planChecked || loading) return <div className="py-8 text-center text-gray-500">Loading SSO config...</div>;
  if (error) return <div className="py-8 text-center text-red-500">{error}</div>;

  return (
    <div className="space-y-12">
      {!canEdit && (
        <Alert className="border-orange-200 bg-orange-50 flex items-center gap-2">
          <Lock className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            SSO configuration is available on the Enterprise Plan. Upgrade to enable and manage SSO.
          </AlertDescription>
        </Alert>
      )}
      {/* Header */}
      <div className="pt-10 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Single Sign-On (SSO) Configuration
        </h2>
        <p className="text-gray-600 text-sm leading-relaxed">
          Enable secure and streamlined access to WorkflowGuard using your
          organization's Identity Provider (IdP). We support SAML 2.0 and OIDC
          (OpenID Connect).
        </p>
      </div>

      {/* Enable SSO Toggle */}
      <div className="flex items-center justify-between py-8 border-t border-gray-100">
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-gray-900">
            Enable Single Sign-On
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed">
            Toggle to enable or disable SSO authentication for your
            organization.
          </p>
        </div>
        <Switch
          checked={ssoEnabled}
          onCheckedChange={setSsoEnabled}
          className="data-[state=checked]:bg-blue-500"
          disabled={!canEdit}
        />
      </div>

      {ssoEnabled && (
        <>
          {/* Choose SSO Protocol */}
          <div className="space-y-8 pt-4">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">
                Choose SSO Protocol
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Select the authentication protocol your Identity Provider
                supports.
              </p>
            </div>
            <RadioGroup
              value={protocol}
              onValueChange={setProtocol}
              className="grid grid-cols-2 gap-6"
              disabled={!canEdit}
            >
              <div>
                <RadioGroupItem value="saml" id="saml" className="sr-only" />
                <Label
                  htmlFor="saml"
                  className={`block p-6 border rounded-lg cursor-pointer transition-colors ${
                    protocol === "saml"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        protocol === "saml"
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {protocol === "saml" && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                    <span className="font-semibold">SAML 2.0</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Use SAML 2.0 protocol for SSO authentication with your
                    Identity Provider.
                  </p>
                </Label>
              </div>

              <div>
                <RadioGroupItem value="oidc" id="oidc" className="sr-only" />
                <Label
                  htmlFor="oidc"
                  className={`block p-6 border rounded-lg cursor-pointer transition-colors ${
                    protocol === "oidc"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-3">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        protocol === "oidc"
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {protocol === "oidc" && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                    <span className="font-semibold">OpenID Connect (OIDC)</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Use OIDC protocol for SSO authentication with your Identity
                    Provider.
                  </p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Identity Provider Metadata */}
          <div className="space-y-8 pt-6">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">
                Identity Provider (IdP) Metadata
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Provide your Identity Provider's metadata configuration.
              </p>
            </div>
            <RadioGroup
              value={metadataMethod}
              onValueChange={setMetadataMethod}
              className="grid grid-cols-2 gap-6"
              disabled={!canEdit}
            >
              <div>
                <RadioGroupItem
                  value="upload"
                  id="upload"
                  className="sr-only"
                />
                <Label
                  htmlFor="upload"
                  className={`block p-6 border rounded-lg cursor-pointer transition-colors ${
                    metadataMethod === "upload"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        metadataMethod === "upload"
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {metadataMethod === "upload" && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                    <span className="font-semibold">Upload Metadata XML</span>
                  </div>
                  {metadataMethod === "upload" && (
                    <Button variant="outline" size="sm" className="w-full" disabled={!canEdit}>
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                  )}
                </Label>
              </div>

              <div>
                <RadioGroupItem value="url" id="url" className="sr-only" />
                <Label
                  htmlFor="url"
                  className={`block p-6 border rounded-lg cursor-pointer transition-colors ${
                    metadataMethod === "url"
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div
                      className={`w-4 h-4 rounded-full border-2 ${
                        metadataMethod === "url"
                          ? "border-blue-500 bg-blue-500"
                          : "border-gray-300"
                      }`}
                    >
                      {metadataMethod === "url" && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                      )}
                    </div>
                    <span className="font-semibold">Enter Metadata URL</span>
                  </div>
                  {metadataMethod === "url" && (
                    <div className="flex space-x-3">
                      <Input
                        placeholder="https://your-idp.com/saml/metadata"
                        value={metadataUrl}
                        onChange={(e) => setMetadataUrl(e.target.value)}
                        className="flex-1"
                        disabled={!canEdit}
                      />
                      <Button variant="outline" size="sm" disabled={!canEdit}>
                        Fetch Metadata
                      </Button>
                    </div>
                  )}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Manual Configuration */}
          <div className="space-y-8 pt-6">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">
                Manual Configuration
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Configure your Identity Provider settings manually.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <Label
                  htmlFor="sso-url"
                  className="text-sm font-medium text-gray-700"
                >
                  IdP Single Sign-On URL
                </Label>
                <Input
                  id="sso-url"
                  value={ssoUrl}
                  onChange={(e) => setSsoUrl(e.target.value)}
                  placeholder="https://your-idp.com/saml/sso"
                  disabled={!canEdit}
                />
              </div>
              <div className="space-y-3">
                <Label
                  htmlFor="issuer-id"
                  className="text-sm font-medium text-gray-700"
                >
                  IdP Issuer / Entity ID
                </Label>
                <Input
                  id="issuer-id"
                  value={issuerId}
                  onChange={(e) => setIssuerId(e.target.value)}
                  placeholder="http://www.okta.com/your_app_id"
                  disabled={!canEdit}
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label
                htmlFor="certificate"
                className="text-sm font-medium text-gray-700"
              >
                X.509 Certificate (Public Key)
              </Label>
              <Textarea
                id="certificate"
                value={certificate}
                onChange={(e) => setCertificate(e.target.value)}
                placeholder="Paste your IdP's public certificate here..."
                rows={5}
                disabled={!canEdit}
              />
            </div>
          </div>

          {/* Service Provider Details */}
          <div className="space-y-8 pt-6">
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-gray-900">
                Service Provider (SP) Details for your IdP
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Use these URLs when configuring WorkflowGuard in your Identity
                Provider.
              </p>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  SP Entity ID / Audience URI
                </Label>
                <div className="flex items-center space-x-3">
                  <Input
                    value="https://www.workflowguard.pro/saml/metadata"
                    readOnly
                    className="bg-gray-50"
                    disabled={!canEdit}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        "https://www.workflowguard.pro/saml/metadata",
                      )
                    }
                    disabled={!canEdit}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  SP Assertion Consumer Service (ACS) URL
                </Label>
                <div className="flex items-center space-x-3">
                  <Input
                    value="https://www.workflowguard.pro/saml/acs"
                    readOnly
                    className="bg-gray-50"
                    disabled={!canEdit}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard("https://www.workflowguard.pro/saml/acs")
                    }
                    disabled={!canEdit}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-sm font-medium text-gray-700">
                  SP Single Logout URL (Optional)
                </Label>
                <div className="flex items-center space-x-3">
                  <Input
                    value="https://www.workflowguard.pro/saml/slo"
                    readOnly
                    className="bg-gray-50"
                    disabled={!canEdit}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard("https://www.workflowguard.pro/saml/slo")
                    }
                    disabled={!canEdit}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Just-in-Time User Provisioning */}
          <div className="space-y-8 pt-6">
            <div className="flex items-center justify-between py-6 border-t border-gray-100">
              <div className="space-y-2">
                <h3 className="text-base font-semibold text-gray-900">
                  Just-in-Time User Provisioning
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  Automatically create WorkflowGuard user accounts when a user
                  logs in via SSO for the first time.
                </p>
              </div>
              <Switch
                checked={justInTimeEnabled}
                onCheckedChange={setJustInTimeEnabled}
                className="data-[state=checked]:bg-blue-500"
                disabled={!canEdit}
              />
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-5">
                <h4 className="text-sm font-semibold text-gray-900">
                  WorkflowGuard Field
                </h4>
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 py-1">Email</div>
                  <div className="text-sm text-gray-700 py-1">First Name</div>
                  <div className="text-sm text-gray-700 py-1">Last Name</div>
                  <div className="text-sm text-gray-700 py-1">Default Role</div>
                </div>
              </div>
              <div className="space-y-5">
                <h4 className="text-sm font-semibold text-gray-900">
                  SAML Attribute Name
                </h4>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600 py-1">email</div>
                  <div className="text-sm text-gray-600 py-1">firstName</div>
                  <div className="text-sm text-gray-600 py-1">lastName</div>
                  <div className="text-sm text-gray-600 py-1">Viewer</div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-4 pt-10 mt-8 border-t border-gray-200">
            <Button variant="outline" size="default">
              Cancel
            </Button>
            <Button variant="outline" size="default">
              Test SSO Connection
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleSave} disabled={saving || !canEdit}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SsoConfiguration;
