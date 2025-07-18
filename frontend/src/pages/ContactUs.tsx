import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HelpCircle, Settings, Mail, MessageCircle, Clock } from "lucide-react";
import apiService from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const ContactUs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSendMessage = async () => {
    setLoading(true);
    try {
      await apiService.sendContactForm({
        name: formData.fullName,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      toast({
        title: 'Message sent!',
        description: 'Thank you for contacting us. We will get back to you soon.',
      });
      setFormData({ fullName: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      toast({
        title: 'Failed to send message',
        description: error?.message || 'Please try again later.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/dashboard">
              <img src="/LogoW.png" alt="WorkflowGuard Logo" style={{ height: 32 }} />
            </Link>
            <span className="font-semibold text-gray-900">WorkflowGuard</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/help" className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              <HelpCircle className="w-4 h-4" />
              Help
            </Link>
            <Link to="/settings" className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-4">
            Contact Us
          </h1>
          <p className="text-sm text-gray-600 leading-relaxed max-w-2xl">
            Have questions, feedback, or need assistance? Reach out to the
            WorkflowGuard team through the options below. We're here to help!
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Contact Form */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Send Us a Message
            </h2>
            <div className="space-y-6">
              <div>
                <Label
                  htmlFor="full-name"
                  className="text-sm font-medium text-gray-700"
                >
                  Full Name
                </Label>
                <Input
                  id="full-name"
                  placeholder="Your Full Name"
                  value={formData.fullName}
                  onChange={(e) =>
                    handleInputChange("fullName", e.target.value)
                  }
                  className="mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor="email"
                  className="text-sm font-medium text-gray-700"
                >
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Your Email Address"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label
                  htmlFor="subject"
                  className="text-sm font-medium text-gray-700"
                >
                  Subject
                </Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => handleInputChange("subject", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Inquiry</SelectItem>
                    <SelectItem value="technical">Technical Support</SelectItem>
                    <SelectItem value="billing">Billing Question</SelectItem>
                    <SelectItem value="feature">Feature Request</SelectItem>
                    <SelectItem value="bug">Bug Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label
                  htmlFor="message"
                  className="text-sm font-medium text-gray-700"
                >
                  Message
                </Label>
                <Textarea
                  id="message"
                  placeholder="Tell us how we can help..."
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  className="mt-1 min-h-[120px] resize-none"
                />
              </div>

              <Button
                onClick={handleSendMessage}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Send Message'}
              </Button>
            </div>
          </div>

          {/* Right Side - Support Options */}
          <div className="space-y-8">
            {/* Email Support */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Email Support
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  For detailed inquiries or attaching files, you can email us
                  directly.
                </p>
                <a
                  href="mailto:contact@workflowguard.pro"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  contact@workflowguard.pro
                </a>
              </div>
            </div>

            {/* Help Center */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Help Center
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Find answers to common questions and comprehensive guides.
                </p>
                <button
                  onClick={() => navigate("/help")}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Browse Articles
                </button>
              </div>
            </div>

            {/* Live Chat Support */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Live Chat Support
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  Chat with our support team in real-time.
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Start Chat
                </button>
              </div>
            </div>

            {/* Business Hours */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">
                  Business Hours
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  Monday - Friday, 9 AM - 5 PM EST
                </p>
                <p className="text-sm text-gray-500">
                  Expected response time: Within 24 hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

    </div>
  );
};

export default ContactUs;