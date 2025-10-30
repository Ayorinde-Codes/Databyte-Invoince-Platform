import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/layout/Navbar';
import CursorAnimation from '@/components/ui/cursor-animation';
import {
  Code,
  FileText,
  Download,
  ExternalLink,
  Copy,
  CheckCircle,
  Book,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const APIDocsPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <CursorAnimation />
      <Navbar />
      {/* Hero Section */}
      <section className="pt-32 pb-20 lg:pt-40 lg:pb-32 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
              API DOCUMENTATION
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
              Complete API Documentation
              <span className="block text-blue-600">for ERP Integration</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
              Comprehensive guides and API references for integrating your ERP
              systems with FIRS e-invoicing platform. Get started in minutes
              with our detailed documentation.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium rounded-lg">
                <Download className="mr-2 w-5 h-5" />
                Download SDK
              </Button>
              <Button
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-medium rounded-lg"
              >
                <ExternalLink className="mr-2 w-5 h-5" />
                View on GitHub
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start Guide */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Quick Start Guide
              </h2>
              <p className="text-xl text-gray-600">
                Get up and running with our API in just a few steps
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>1. Get API Keys</CardTitle>
                  <CardDescription>
                    Register and obtain your API credentials
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Sign up for an account and generate your API keys from the
                    developer dashboard.
                  </p>
                  <Button variant="outline" size="sm">
                    Get Started
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <Code className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle>2. Install SDK</CardTitle>
                  <CardDescription>
                    Choose your preferred programming language
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    We support Node.js, Python, PHP, C#, and Java SDKs for easy
                    integration.
                  </p>
                  <Button variant="outline" size="sm">
                    View SDKs
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                    <Zap className="w-6 h-6 text-purple-600" />
                  </div>
                  <CardTitle>3. Make First Call</CardTitle>
                  <CardDescription>
                    Test your integration with a simple API call
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm mb-4">
                    Send your first invoice and receive confirmation from FIRS
                    within seconds.
                  </p>
                  <Button variant="outline" size="sm">
                    Try Now
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ERP Integration Guides */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                ERP Integration Guides
              </h2>
              <p className="text-xl text-gray-600">
                Step-by-step guides for popular ERP systems
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Sage 300 Integration */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Sage 300 Integration Guide
                    </h3>
                    <Badge className="bg-green-100 text-green-800">
                      Sage 300
                    </Badge>
                  </div>
                  <CardDescription>
                    Complete guide to integrating Sage 300 with FIRS
                    e-invoicing.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      API Endpoints
                    </h4>
                    <p className="text-gray-600 text-sm">
                      Core endpoints for Sage 300
                    </p>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          POST
                        </Badge>
                        <code className="text-sm font-mono text-gray-700">
                          /sage_300/AP/invoiceBatches
                        </code>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <h5 className="font-semibold text-gray-900 text-sm mb-2">
                        Fetch AP Invoice Batches
                      </h5>
                      <p className="text-gray-600 text-xs">
                        Retrieve all Accounts Payable invoice batches.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          POST
                        </Badge>
                        <code className="text-sm font-mono text-gray-700">
                          /sage_300/AR/invoiceBatches
                        </code>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <h5 className="font-semibold text-gray-900 text-sm mb-2">
                        Fetch AR Invoice Batches
                      </h5>
                      <p className="text-gray-600 text-xs">
                        Retrieve all Accounts Receivable invoice batches.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          POST
                        </Badge>
                        <code className="text-sm font-mono text-gray-700">
                          /sage_300/AP/invoiceBatches/:id
                        </code>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <h5 className="font-semibold text-gray-900 text-sm mb-2">
                        Fetch AP Invoices by Batch ID
                      </h5>
                      <p className="text-gray-600 text-xs">
                        Retrieve all AP invoices within a specific batch.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          POST
                        </Badge>
                        <code className="text-sm font-mono text-gray-700">
                          /sage_300/AR/invoiceBatches/:id
                        </code>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <h5 className="font-semibold text-gray-900 text-sm mb-2">
                        Fetch AR Invoices by Batch ID
                      </h5>
                      <p className="text-gray-600 text-xs">
                        Retrieve all AR invoices within a specific batch.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          POST
                        </Badge>
                        <code className="text-sm font-mono text-gray-700">
                          /sage_300/&#123;account_type&#125;/firs_invoice/:batchId/:invoiceId
                        </code>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <h5 className="font-semibold text-gray-900 text-sm mb-2">
                        Fetch FIRS Invoice
                      </h5>
                      <p className="text-gray-600 text-xs">
                        Prepare a specific invoice type (AP/AR) for FIRS
                        submission.
                      </p>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          POST
                        </Badge>
                        <code className="text-sm font-mono text-gray-700">
                          /api/sage_300/&#123;account_type&#125;/&#123;invoiceId&#125;
                        </code>
                        <Button variant="ghost" size="sm" className="p-1">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <h5 className="font-semibold text-gray-900 text-sm mb-2">
                        Save Submitted Invoice
                      </h5>
                      <p className="text-gray-600 text-xs">
                        Save an AP/AR invoice after successful FIRS submission.
                        invoiceId format: BatchNumber-EntryNumber
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Code Examples
                    </h4>
                    <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                      <div className="flex space-x-4 mb-4">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          NODEJS
                        </Badge>
                        <Badge className="bg-blue-100 text-blue-800 text-xs">
                          PYTHON
                        </Badge>
                        <Badge className="bg-orange-100 text-orange-800 text-xs">
                          CURL
                        </Badge>
                      </div>
                      <pre className="text-green-400 text-sm">
                        {`const res = await fetch("/sage_300/AP/invoiceBatches", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer <accessToken>"
  },
  body: JSON.stringify({
    server: "sage300-server",
    company: "demo-company",
    username: "admin",
    password: "password"
  })
});`}
                      </pre>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold text-gray-900">
                        Error Handling
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg">
                          <Badge className="bg-red-100 text-red-800 text-xs">
                            400
                          </Badge>
                          <span className="text-sm text-gray-700">
                            Bad Request - Invalid request format
                          </span>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                          <Badge className="bg-orange-100 text-orange-800 text-xs">
                            401
                          </Badge>
                          <span className="text-sm text-gray-700">
                            Unauthorized - Invalid credentials
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Book className="mr-2 w-4 h-4" />
                      Full Guide
                    </Button>
                    <Button variant="outline">
                      <Download className="mr-2 w-4 h-4" />
                      Download PDF
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* QuickBooks Integration */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-gray-900">
                      QuickBooks Integration
                    </h3>
                    <Badge className="bg-blue-100 text-blue-800">
                      QuickBooks
                    </Badge>
                  </div>
                  <CardDescription>
                    Seamless integration with QuickBooks Online and Desktop
                    versions.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      Key Features
                    </h4>

                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-gray-900 text-sm">
                            Real-time Sync
                          </h5>
                          <p className="text-gray-600 text-xs">
                            Automatic synchronization of invoice data
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-gray-900 text-sm">
                            Tax Calculation
                          </h5>
                          <p className="text-gray-600 text-xs">
                            Automatic VAT and tax calculations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                        <div>
                          <h5 className="font-semibold text-gray-900 text-sm">
                            FIRS Compliance
                          </h5>
                          <p className="text-gray-600 text-xs">
                            100% compliant invoice generation
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Book className="mr-2 w-4 h-4" />
                      View Guide
                    </Button>
                    <Button variant="outline">
                      <Code className="mr-2 w-4 h-4" />
                      Code Examples
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* API Reference */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold text-gray-900">
              Need More Help?
            </h2>
            <p className="text-xl text-gray-600">
              Our technical team is here to help you with your integration
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                  <Book className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Documentation
                </h3>
                <p className="text-gray-600">
                  Comprehensive API reference and guides
                </p>
                <Button variant="outline">Browse Docs</Button>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
                  <Code className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Code Examples
                </h3>
                <p className="text-gray-600">
                  Ready-to-use code snippets and samples
                </p>
                <Button variant="outline">View Examples</Button>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                  <Zap className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Support</h3>
                <p className="text-gray-600">
                  24/7 technical support from our experts
                </p>
                <Button variant="outline">Contact Support</Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default APIDocsPage;
