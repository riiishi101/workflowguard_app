import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, HelpCircle, Settings } from "lucide-react";

const TermsOfService = () => {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleAcceptAndContinue = () => {
    if (agreed) {
      // Handle acceptance logic here
      navigate(-1); // Go back to previous page
    }
  };

  const sections = [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      content:
        "By accessing and using WorkflowGuard, you accept and agree to be bound by the terms and provision of this agreement.",
    },
    {
      id: "account",
      title: "2. Your WorkflowGuard Account",
      content:
        "You are responsible for maintaining the confidentiality of your account and password and for restricting access to your computer.",
    },
    {
      id: "service",
      title: "3. Service Description",
      content:
        "WorkflowGuard provides workflow monitoring and protection services for HubSpot users to track and manage their automated workflows.",
    },
    {
      id: "obligations",
      title: "4. User Obligations",
      content:
        "Users must comply with all applicable laws and regulations when using WorkflowGuard services and must not use the service for any unlawful purposes.",
    },
    {
      id: "privacy",
      title: "5. Privacy and Data Protection",
      content:
        "We are committed to protecting your privacy and handling your data in accordance with applicable data protection laws and our Privacy Policy.",
    },
    {
      id: "intellectual",
      title: "6. Intellectual Property Rights",
      content:
        "All content, trademarks, and other intellectual property on WorkflowGuard are owned by us or our licensors and are protected by applicable laws.",
    },
    {
      id: "termination",
      title: "7. Termination",
      content:
        "Either party may terminate this agreement at any time. Upon termination, your right to use the service will cease immediately.",
    },
    {
      id: "limitations",
      title: "8. Limitations of Liability",
      content:
        "WorkflowGuard shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the service.",
    },
  ];

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
      <main className="flex-1 max-w-2xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Terms of Service
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Last Updated: July 17, 2025
          </p>
          <p className="text-sm text-gray-600 leading-relaxed max-w-lg mx-auto">
            Please read these Terms of Service carefully before using the
            WorkflowGuard application. By accessing or using our service, you
            agree to be bound by these terms.
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-3 mb-12">
          {sections.map((section) => (
            <Collapsible
              key={section.id}
              open={openSections[section.id] || false}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors border border-gray-200">
                  <span className="text-sm font-medium text-gray-900 text-left">
                    {section.title}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      openSections[section.id] ? "rotate-180" : ""
                    }`}
                  />
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 py-3 text-sm text-gray-600 bg-gray-50 border-l border-r border-b border-gray-200 rounded-b-lg">
                  {section.content}
                </div>
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>

        {/* Agreement Section */}
        <div className="space-y-6">
          <div className="flex items-start gap-3">
            <Checkbox
              id="agree-terms"
              checked={agreed}
              onCheckedChange={(checked) => setAgreed(checked as boolean)}
              className="mt-0.5"
            />
            <label
              htmlFor="agree-terms"
              className="text-sm text-gray-600 cursor-pointer"
            >
              I have read and agree to the Terms of Service
            </label>
          </div>

          <Button
            onClick={handleAcceptAndContinue}
            disabled={!agreed}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Accept and Continue
          </Button>
        </div>
      </main>

   
    </div>
  );
};

export default TermsOfService;