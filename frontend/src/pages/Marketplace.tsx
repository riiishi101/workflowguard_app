import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Shield, RotateCcw, FileText, ArrowRight, Loader2, AlertTriangle } from "lucide-react";
import TopNavigation from "@/components/TopNavigation";
import WorkflowGuardLogo from "@/components/WorkflowGuardLogo";
import { useToast } from "@/hooks/use-toast";
import apiService from "@/services/api";
import { useAuth } from "@/components/AuthContext";

interface MarketplaceInstallData {
  portalId: string;
  userId?: string;
  planId?: string;
  installType?: 'marketplace' | 'direct';
}

const Marketplace = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, login } = useAuth();
  
  const [installData, setInstallData] = useState<MarketplaceInstallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'loading' | 'welcome' | 'connecting' | 'onboarding' | 'complete'>('loading');

  useEffect(() => {
    const initializeInstallation = async () => {
      try {
        setLoading(true);
        
        // Extract marketplace parameters
        const portalId = searchParams.get('portalId');
        const userId = searchParams.get('userId');
        const planId = searchParams.get('planId') || 'professional';
        const installType = searchParams.get('installType') || 'marketplace';
        
        if (!portalId) {
          throw new Error('Missing portal ID from HubSpot installation');
        }

        setInstallData({
          portalId,
          userId: userId || undefined,
          planId,
          installType: installType as 'marketplace' | 'direct'
        });

        // Check if user already exists for this portal
        try {
          const existingUser = await apiService.findOrCreateUserByPortalId(portalId);
          if (existingUser) {
            // User exists, log them in
            login(existingUser, 'marketplace-token');
            setStep('onboarding');
          } else {
            // New user, start welcome flow
            setStep('welcome');
          }
        } catch (userError) {
          // New user, start welcome flow
          setStep('welcome');
        }

      } catch (err: any) {
        setError(err.message || 'Failed to initialize installation');
        setStep('welcome');
      } finally {
        setLoading(false);
      }
    };

    initializeInstallation();
  }, [searchParams, login]);

  const handleStartSetup = async () => {
    if (!installData) return;
    
    setStep('connecting');
    
    try {
      // Initiate HubSpot OAuth for the specific portal
      const oauthUrl = `${import.meta.env.VITE_API_URL}/auth/hubspot?portalId=${installData.portalId}&installType=marketplace`;
      window.location.href = oauthUrl;
    } catch (err: any) {
      setError(err.message || 'Failed to start HubSpot connection');
      setStep('welcome');
    }
  };

  const handleSkipToDashboard = () => {
    navigate('/dashboard');
  };

  const handleCompleteOnboarding = () => {
    navigate('/select-workflows');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <TopNavigation />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Setting up WorkflowGuard...
            </h2>
            <p className="text-gray-600">
              We're configuring your account for the best experience.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <TopNavigation />
        <main className="max-w-4xl mx-auto px-6 py-12">
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopNavigation />
      
      <main className="max-w-4xl mx-auto px-6 py-12">
        {step === 'welcome' && (
          <div className="text-center space-y-8">
            <div className="flex justify-center">
              <WorkflowGuardLogo />
            </div>
            
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to WorkflowGuard!
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Your HubSpot workflow protection system is ready to be set up. 
                Let's get you started with automatic version control and rollback capabilities.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-blue-500" />
                  </div>
                  <CardTitle className="text-lg">Automatic Protection</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Every workflow change is automatically saved with version control
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <RotateCcw className="w-6 h-6 text-green-500" />
                  </div>
                  <CardTitle className="text-lg">Instant Rollback</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Restore any previous version with one click
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText className="w-6 h-6 text-purple-500" />
                  </div>
                  <CardTitle className="text-lg">Complete History</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">
                    Track all changes and modifications with detailed audit logs
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3">
                Professional Plan Trial
              </h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>21-day free trial with Professional features</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Up to 500 workflows monitored</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>90 days of version history</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Priority support included</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Button 
                onClick={handleStartSetup}
                size="lg"
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3"
              >
                Start Setup
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                onClick={handleSkipToDashboard}
                variant="outline"
                size="lg"
              >
                Skip to Dashboard
              </Button>
            </div>
          </div>
        )}

        {step === 'connecting' && (
          <div className="text-center space-y-6">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Connecting to HubSpot...
            </h2>
            <p className="text-gray-600">
              Please complete the authorization in the new window.
            </p>
            <Progress value={50} className="max-w-md mx-auto" />
          </div>
        )}

        {step === 'onboarding' && (
          <div className="text-center space-y-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Setup Complete!
            </h2>
            <p className="text-gray-600">
              Your WorkflowGuard account is ready. Let's select which workflows you'd like to protect.
            </p>
            <Button 
              onClick={handleCompleteOnboarding}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Select Workflows
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-6">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
            <h2 className="text-2xl font-semibold text-gray-900">
              Installation Complete!
            </h2>
            <p className="text-gray-600">
              WorkflowGuard is now protecting your HubSpot workflows.
            </p>
            <Button 
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Go to Dashboard
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Marketplace; 