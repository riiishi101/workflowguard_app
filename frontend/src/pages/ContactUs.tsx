import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";
import ContentPageHeader from "@/components/ContentPageHeader";
import PageSection from "@/components/PageSection";
import Footer from "@/components/Footer";
import { LAYOUT, TYPOGRAPHY, COLORS } from "@/lib/layout-constants";
import { Mail, MessageCircle, Clock, CheckCircle } from "lucide-react";
import { ApiService } from "@/lib/api";
import { ContactFormSchema, type ContactFormData } from "@/types/contact.schemas";

const ContactUs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<ContactFormData>>({
    fullName: "",
    email: "",
    subject: "",
    message: "",
    priority: "medium",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSendMessage = async () => {
    const result = ContactFormSchema.safeParse(formData);

    if (!result.success) {
      const errorMessages = result.error.errors.map((e) => e.message).join("\n");
      toast({
        title: "Invalid Information",
        description: errorMessages,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await ApiService.createSupportTicket(result.data);
      
      toast({
        title: "Ticket Created Successfully!",
        description: response.message || "Your support ticket has been created.",
      });

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        subject: "",
        message: "",
        priority: "medium",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create support ticket. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`${LAYOUT.pageMinHeight} ${LAYOUT.pageBackground} ${LAYOUT.pageLayout}`}>
      <ContentPageHeader />

      <main className={`${LAYOUT.maxWidth} mx-auto ${LAYOUT.containerPadding} ${LAYOUT.contentSpacing} flex-1`}>
        <div className={TYPOGRAPHY.sectionMargin}>
          <h1 className={`${TYPOGRAPHY.pageTitle} ${TYPOGRAPHY.titleMargin}`}>
            Contact Us
          </h1>
          <p className={TYPOGRAPHY.pageDescription}>
            Have questions, feedback, or need assistance? Reach out to the
            WorkflowGuard team through the options below. We're here to help!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <PageSection title="Send Us a Message" variant="card">
            <div className="space-y-6">
              <div>
                <Label htmlFor="full-name" className="text-sm font-medium text-gray-700">
                  Full Name *
                </Label>
                <Input
                  id="full-name"
                  placeholder="Your Full Name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Email Address *
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
                <Label htmlFor="subject" className="text-sm font-medium text-gray-700">
                  Subject *
                </Label>
                <Input
                  id="subject"
                  placeholder="Brief description of your issue"
                  value={formData.subject}
                  onChange={(e) => handleInputChange("subject", e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleInputChange("category", value)}
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
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Priority
                </Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange("priority", value)}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                  Message *
                </Label>
                <Textarea
                  id="message"
                  placeholder="Please describe your issue or question in detail..."
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                  className="mt-1 min-h-[120px]"
                />
              </div>

              <Button
                onClick={handleSendMessage}
                disabled={isSubmitting}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-medium"
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </PageSection>

          {/* Contact Information */}
          <div className="space-y-8">
            <PageSection title="Contact Information" variant="card">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Email Support</h3>
                    <p className="text-gray-600 text-sm">
                      <a href="mailto:contact@workflowguard.pro" className="text-blue-500 hover:text-blue-600">
                        contact@workflowguard.pro
                      </a>
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      We typically respond within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Support Ticket System</h3>
                    <p className="text-gray-600 text-sm">
                      Create a support ticket for detailed assistance
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Track your issues and get updates
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Response Times</h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>General inquiries: 24 hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Technical issues: 12 hours</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Urgent issues: 4 hours</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </PageSection>

            <PageSection title="Before You Contact Us" variant="card">
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Check Our Documentation</h4>
                  <p>
                    Many questions can be answered by checking our{" "}
                    <button
                      onClick={() => navigate("/help-support")}
                      className="text-blue-500 hover:text-blue-600 underline"
                    >
                      help documentation
                    </button>
                    .
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Include Details</h4>
                  <p>
                    When contacting us, please include:
                  </p>
                  <ul className="list-disc pl-5 mt-2 space-y-1">
                    <li>Your HubSpot portal ID</li>
                    <li>Steps to reproduce the issue</li>
                    <li>Screenshots if applicable</li>
                    <li>Error messages you're seeing</li>
                  </ul>
                </div>
              </div>
            </PageSection>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ContactUs;
