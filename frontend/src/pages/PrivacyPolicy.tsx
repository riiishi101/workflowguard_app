import { useNavigate } from "react-router-dom";
import { HelpCircle, Settings } from "lucide-react";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-sm flex items-center justify-center">
                <svg
                  className="w-2 h-2 text-blue-500"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              </div>
            </div>
            <span className="font-semibold text-gray-900">WorkflowGuard</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              <HelpCircle className="w-4 h-4" />
              Help
            </button>
            <button className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
        {/* Title Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-sm text-gray-500 mb-6">
            Last Updated: July 17, 2025
          </p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Your privacy is critically important to us. This Privacy Policy
            explains how WorkflowGuard collects, uses, discloses, and protects
            information about you.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-sm text-gray-600 leading-relaxed">
          {/* 1. Introduction */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              1. Introduction
            </h2>
            <p>
              This Privacy Policy describes our policies and procedures on the
              collection, use, and disclosure of your information when you use
              the Service and tells you about your privacy rights and how the
              law protects you.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              2. Information We Collect
            </h2>

            {/* 2.1 Information You Provide to Us */}
            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                2.1 Information You Provide to Us
              </h3>
              <p className="mb-3">
                While using our Service, we may ask you to provide us with
                certain personally identifiable information that can be used to
                contact or identify you ("Personal Data").
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Email address</li>
                <li>First name and last name</li>
                <li>Usage data</li>
                <li>Account preferences</li>
              </ul>
            </div>

            {/* 2.2 Information We Collect Automatically */}
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">
                2.2 Information We Collect Automatically
              </h3>
              <p className="mb-3">
                When you access or use our Service, we automatically collect
                certain information.
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Device information</li>
                <li>IP address</li>
                <li>Browser type</li>
                <li>Operating system</li>
                <li>Access times</li>
              </ul>
            </div>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              3. How We Use Your Information
            </h2>
            <p className="mb-3">
              We use the collected data for various purposes:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          {/* 4. Data Security */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              4. Data Security
            </h2>
            <p>
              The security of your data is important to us, but remember that no
              method of transmission over the Internet or method of electronic
              storage is 100% secure. While we strive to use commercially
              acceptable means to protect your Personal Data, we cannot
              guarantee its absolute security.
            </p>
          </section>

          {/* 5. Your Data Rights */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              5. Your Data Rights
            </h2>
            <p className="mb-3">
              Under certain circumstances, you have rights under data protection
              laws in relation to your personal data:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>The right to access your personal data</li>
              <li>The right to correct your personal data</li>
              <li>The right to delete your personal data</li>
              <li>The right to restrict processing of your personal data</li>
              <li>The right to data portability</li>
            </ul>
          </section>

          {/* 6. Contact Us */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              6. Contact Us
            </h2>
            <p className="mb-3">
              If you have any questions about this Privacy Policy, please
              contact us:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>By email: privacy@workflowguard.com</li>
              <li>
                By visiting this page on our website:
                https://workflowguard.com/contact
              </li>
            </ul>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            © 2025 WorkflowGuard. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate("/terms-of-service")}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Terms of Service
            </button>
            <button
              onClick={() => navigate("/contact")}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              Contact Us
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;