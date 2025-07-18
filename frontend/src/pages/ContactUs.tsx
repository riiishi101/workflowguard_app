import { useState, useEffect } from "react";
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
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    subject: false,
    message: false,
  });
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [success, setSuccess] = useState(false);

  // Auto-dismiss success message after 7 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 7000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Hide success message if user navigates away
  useEffect(() => {
    return () => setSuccess(false);
  }, []);

  // Validation logic
  const validate = (field: string, value: string) => {
    let error = '';
    if (!value.trim()) {
      error = 'This field is required.';
    } else if (field === 'email') {
      // Simple email regex
      if (!/^\S+@\S+\.\S+$/.test(value)) {
        error = 'Please enter a valid email address.';
      }
    }
    setErrors((prev) => ({ ...prev, [field]: error }));
    return error;
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (touched[field as keyof typeof touched]) {
      validate(field, value);
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate(field, formData[field as keyof typeof formData]);
  };

  const isFormValid =
    formData.fullName.trim() &&
    formData.email.trim() &&
    /^\S+@\S+\.\S+$/.test(formData.email) &&
    formData.subject.trim() &&
    formData.message.trim() &&
    !errors.fullName &&
    !errors.email &&
    !errors.subject &&
    !errors.message;

  const handleSendMessage = async () => {
    setLoading(true);
    try {
      await apiService.sendContactForm({
        name: formData.fullName,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });
      setSuccess(true); // Show success banner
      toast({
        title: 'Message sent!',
        description: 'Thank you for contacting us. We will get back to you soon.',
      });
      setFormData({ fullName: '', email: '', subject: '', message: '' });
      setTouched({ fullName: false, email: false, subject: false, message: false });
      setErrors({ fullName: '', email: '', subject: '', message: '' });
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
            <button onClick={() => navigate('/dashboard')} className="flex items-center gap-2 group" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
              <img src="/LogoW.png" alt="WorkflowGuard Logo" style={{ height: 32 }} />
              <span className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">WorkflowGuard</span>
            </button>
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
            {success && (
              <div className="mb-6 p-4 rounded bg-green-50 border border-green-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2l4-4"/></svg>
                  <span className="text-green-700 font-medium">Message sent successfully!</span>
                </div>
                <button onClick={() => setSuccess(false)} className="text-green-700 hover:text-green-900 text-lg font-bold px-2">×</button>
              </div>
            )}
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
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  onBlur={() => handleBlur("fullName")}
                  className={`mt-1 ${touched.fullName && errors.fullName ? 'border-red-500' : ''}`}
                />
                {touched.fullName && errors.fullName && (
                  <div className="text-xs text-red-500 mt-1">{errors.fullName}</div>
                )}
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
                  onBlur={() => handleBlur("email")}
                  className={`mt-1 ${touched.email && errors.email ? 'border-red-500' : ''}`}
                />
                {touched.email && errors.email && (
                  <div className="text-xs text-red-500 mt-1">{errors.email}</div>
                )}
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
                  onValueChange={(value) => { handleInputChange("subject", value); handleBlur("subject"); }}
                >
                  <SelectTrigger className={`mt-1 ${touched.subject && errors.subject ? 'border-red-500' : ''}`}>
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
                {touched.subject && errors.subject && (
                  <div className="text-xs text-red-500 mt-1">{errors.subject}</div>
                )}
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
                  onBlur={() => handleBlur("message")}
                  className={`mt-1 min-h-[120px] resize-none ${touched.message && errors.message ? 'border-red-500' : ''}`}
                />
                {touched.message && errors.message && (
                  <div className="text-xs text-red-500 mt-1">{errors.message}</div>
                )}
              </div>

              <Button
                onClick={handleSendMessage}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3"
                disabled={loading || !isFormValid}
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