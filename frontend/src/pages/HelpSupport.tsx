import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot,
  BookOpen,
  MessageCircle,
  MessageSquare,
  Video,
  Mail,
  Phone,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap,
  Star,
  GraduationCap,
  Brain,
  Wrench,
  Shield,
  Settings,
  UserCheck,
  Headphones
} from 'lucide-react';
import MainAppLayout from '@/components/MainAppLayout';
import ContentSection from '@/components/ContentSection';
import Footer from '@/components/Footer';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/lib/api';
import { DiagnoseIssueSchema } from '@/types/help-support.schemas';

const HelpSupport = () => {
  const { toast } = useToast();
  const [issueDescription, setIssueDescription] = useState('');
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  const handleDiagnoseIssue = async () => {
    const result = DiagnoseIssueSchema.safeParse({ issueDescription });

    if (!result.success) {
      toast({
        title: "Invalid Input",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsDiagnosing(true);
    try {
      const response = await ApiService.diagnoseIssue(result.data.issueDescription);
      toast({
        title: "Issue Diagnosed",
        description: response.message || "AI has analyzed your issue and provided a solution.",
      });
    } catch (error: any) {
      toast({
        title: "Diagnosis Failed",
        description: error.response?.data?.message || "Failed to diagnose the issue. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleAutoFix = async (issueType: string) => {
    try {
      let response;
      switch (issueType) {
        case 'rollback':
          response = await ApiService.fixRollbackIssue();
          break;
        case 'sync':
          response = await ApiService.fixSyncIssue();
          break;
        case 'auth':
          response = await ApiService.fixAuthIssue();
          break;
        case 'data':
          response = await ApiService.fixDataIssue();
          break;
        case 'performance':
          response = await ApiService.optimizePerformance();
          break;
        default:
          response = await ApiService.diagnoseIssue(`Fix ${issueType} issue`);
      }
      
      toast({
        title: "Auto-Fix Applied",
        description: response.message || "The issue has been automatically resolved.",
      });
    } catch (error: any) {
      toast({
        title: "Auto-Fix Failed",
        description: error.response?.data?.message || "Failed to automatically fix the issue.",
        variant: "destructive",
      });
    }
  };

  const commonIssues = [
    {
      id: 'rollback',
      title: 'Cannot rollback workflow to previous version',
      description: 'Automated rollback validation and recovery',
      severity: 'Critical',
      severityColor: 'bg-red-500',
      canAutoFix: true
    },
    {
      id: 'sync',
      title: 'Workflows not syncing from HubSpot',
      description: 'API-based sync monitoring and retry',
      severity: 'High',
      severityColor: 'bg-orange-500',
      canAutoFix: true
    },
    {
      id: 'data',
      title: 'Version history not loading or missing',
      description: 'Automated data integrity checks and recovery',
      severity: 'High',
      severityColor: 'bg-orange-500',
      canAutoFix: true
    },
    {
      id: 'auth',
      title: 'Authentication problems or locked account',
      description: 'Automated auth validation and recovery',
      severity: 'Critical',
      severityColor: 'bg-red-500',
      canAutoFix: true
    },
    {
      id: 'performance',
      title: 'App loading slowly or timeout errors',
      description: 'Performance optimization and caching',
      severity: 'Medium',
      severityColor: 'bg-yellow-500',
      canAutoFix: true
    }
  ];

  const supportTiers = [
    {
      title: 'Starter Support',
      badge: 'Free',
      badgeColor: 'bg-gray-100 text-gray-700',
      features: [
        { icon: Mail, text: 'Email Support' },
        { icon: Clock, text: '24-48 hour response' },
        { icon: BookOpen, text: 'Knowledge Base' },
        { icon: Bot, text: 'AI Support Assistant' }
      ]
    },
    {
      title: 'Professional Support',
      badge: 'Priority',
      badgeColor: 'bg-blue-500 text-white',
      features: [
        { icon: MessageCircle, text: 'WhatsApp Chat (Business Hours)' },
        { icon: MessageSquare, text: 'WhatsApp Support' },
        { icon: Clock, text: '4-8 hour response' },
        { icon: AlertTriangle, text: 'Emergency After-Hours' }
      ]
    },
    {
      title: 'Enterprise Support',
      badge: '24/7',
      badgeColor: 'bg-purple-500 text-white',
      features: [
        { icon: MessageSquare, text: '24/7 WhatsApp Support' },
        { icon: Star, text: 'Dedicated Support Manager' },
        { icon: Zap, text: '1-2 hour critical response' },
        { icon: GraduationCap, text: 'Custom Training Sessions' }
      ]
    }
  ];

  return (
    <MainAppLayout 
      title="Help & Support"
      description="Get help with WorkflowGuard and find answers to common questions."
    >
      <ContentSection>
        <div className="max-w-7xl mx-auto space-y-8">
          {/* AI Support Assistant */}
          <Card className="bg-white rounded-2xl shadow-md border border-gray-100">
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="bg-blue-600 rounded-full flex items-center justify-center w-12 h-12">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">AI Support Assistant</h3>
                  <p className="text-gray-600 text-sm">Our AI assistant can automatically diagnose and fix most common issues.</p>
                </div>
              </div>
              <div className="mt-6">
                <input
                  type="text"
                  placeholder='Describe your problem and get instant help!\nExample: "Cannot rollback workflow to previous version"'
                  value={issueDescription}
                  onChange={e => setIssueDescription(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 bg-gray-50 placeholder-gray-400"
                />
                <div className="mt-4 flex">
                  <Button
                    onClick={handleDiagnoseIssue}
                    disabled={isDiagnosing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium shadow-none"
                  >
                    {isDiagnosing ? 'Diagnosing...' : 'Diagnose Issue'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Common Issues & Solutions */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Common Issues & Solutions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {commonIssues.map((issue) => (
                <Card key={issue.id} className="hover:shadow-md transition-all duration-200">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex gap-2">
                        <Badge className={`${issue.severityColor} text-white text-xs font-medium`}>
                          {issue.severity}
                        </Badge>
                        {issue.canAutoFix && (
                          <Badge className="bg-green-100 text-green-700 text-xs font-medium">
                            Auto-Fix
                          </Badge>
                        )}
                      </div>
                    </div>
                    <h4 className="font-semibold text-gray-900 mb-2">{issue.title}</h4>
                    <p className="text-sm text-gray-600 mb-4">{issue.description}</p>
                    <div className="flex justify-end">
                      <Button 
                        variant="ghost" 
                        onClick={() => handleAutoFix(issue.id)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        Try Fix
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>



          {/* Support Tiers */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Support Tiers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {supportTiers.map((tier, index) => (
                <Card key={index} className="hover:shadow-md transition-all duration-200 relative">
                  {tier.badge && (
                    <div className={`absolute -top-3 right-4 ${tier.badgeColor} px-3 py-1 rounded-full text-xs font-medium`}>
                      {tier.badge}
                    </div>
                  )}
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{tier.title}</h3>
                    <div className="space-y-3">
                      {tier.features.map((feature, featureIndex) => (
                        <div key={featureIndex} className="flex items-center gap-3">
                          <feature.icon className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-700">{feature.text}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email Support */}
              <Card className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="bg-blue-600 p-3 rounded-lg w-fit mb-4">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Email Support</h3>
                  <a 
                    href="mailto:contact@workflowguard.pro" 
                    className="text-blue-600 font-medium mb-2 hover:underline block"
                  >
                    contact@workflowguard.pro
                  </a>
                  <p className="text-sm text-gray-600">Available 24/7 for all users</p>
                </CardContent>
              </Card>

              {/* Live Chat Support */}
              <Card className="hover:shadow-md transition-all duration-200">
                <CardContent className="p-6">
                  <div className="bg-green-600 p-3 rounded-lg w-fit mb-4">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Live Chat</h3>
                  <a 
                    href="https://wa.me/message/R74K5JOOYVURD1" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium"
                  >
                    Start Live Chat
                  </a>
                  <p className="text-sm text-gray-600 mt-2">Professional & Enterprise plans only</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </ContentSection>
    </MainAppLayout>
  );
};

export default HelpSupport;
