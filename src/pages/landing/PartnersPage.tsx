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
  Building2,
  Handshake,
  Award,
  Users,
  CheckCircle,
  ArrowRight,
  Globe,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const PartnersPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <CursorAnimation />
      <Navbar />
      {/* Hero Section */}
      <section
        className="pt-32 pb-20 lg:pt-40 lg:pb-32 bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage:
            'url(https://t4.ftcdn.net/jpg/03/21/78/39/360_F_321783986_TaMwRq0YqcNk3cC5mtWfWweJ1GrekfC3.jpg)',
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
              OUR PARTNERS
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Strategic Partnerships
              <span className="block text-blue-400">Driving Innovation</span>
            </h1>
            <p className="text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto">
              We collaborate with leading technology companies and ERP providers
              to deliver comprehensive e-invoicing solutions that meet the
              diverse needs of Nigerian businesses.
            </p>
          </div>
        </div>
      </section>

      {/* Technology Partners */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Our Partners
              </h2>
              <p className="text-xl text-gray-600">
                Working with industry leaders to provide the best integration
                experience
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
              <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6">
                <CardContent className="space-y-4">
                  <div className="w-24 h-24 bg-black rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-lg">Sage</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Sage</h3>
                  <Badge className="bg-blue-100 text-blue-800">
                    ERP Systems
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    Official partner for Sage 300 and Sage X3 integrations
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6">
                <CardContent className="space-y-4">
                  <div className="w-24 h-24 bg-red-600 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-sm">
                      Heirs Tech
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Heirs Technologies
                  </h3>
                  <Badge className="bg-blue-100 text-blue-800">
                    Technology
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    Strategic technology partner for enterprise solutions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6">
                <CardContent className="space-y-4">
                  <div className="w-24 h-24 bg-orange-500 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-sm">
                      Cryptware
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Cryptware
                  </h3>
                  <Badge className="bg-blue-100 text-blue-800">
                    Technology
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    Cybersecurity and compliance solutions partner
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6">
                <CardContent className="space-y-4">
                  <div className="w-24 h-24 bg-purple-600 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-sm">Odoo</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Odoo</h3>
                  <Badge className="bg-blue-100 text-blue-800">
                    ERP Systems
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    Official integration partner for Odoo ERP systems
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6">
                <CardContent className="space-y-4">
                  <div className="w-24 h-24 bg-blue-600 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-sm">
                      QuickBooks
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    QuickBooks
                  </h3>
                  <Badge className="bg-green-100 text-green-800">
                    ERP Systems
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    Certified partner for QuickBooks integrations
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6">
                <CardContent className="space-y-4">
                  <div className="w-24 h-24 bg-green-600 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-sm">
                      Microsoft
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Microsoft Dynamics
                  </h3>
                  <Badge className="bg-green-100 text-green-800">
                    ERP Systems
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    Partner for Dynamics 365 and Azure cloud services
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6">
                <CardContent className="space-y-4">
                  <div className="w-24 h-24 bg-blue-500 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-sm">
                      Acumatica
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Acumatica
                  </h3>
                  <Badge className="bg-green-100 text-green-800">
                    ERP Systems
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    Cloud-based ERP software that helps businesses manage
                    accounting, financials, inventory, sales, and customer
                    relationships
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6">
                <CardContent className="space-y-4">
                  <div className="w-24 h-24 bg-gray-700 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-xs">
                      Domain-Plus
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    Domain-Plus INTL
                  </h3>
                  <Badge className="bg-purple-100 text-purple-800">
                    Consulting
                  </Badge>
                  <p className="text-gray-600 text-sm">
                    ERP's consulting and software development
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Implementation Partners */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Implementation Partners
              </h2>
              <p className="text-xl text-gray-600">
                Certified consultants and system integrators
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <CardTitle>TechConsult Nigeria</CardTitle>
                  <CardDescription>
                    ERP Implementation Specialist
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Leading ERP implementation partner with 15+ years experience
                    in Nigerian market.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">
                      5.0 (50+ projects)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Sage Certified
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Microsoft Partner
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                    <Globe className="w-8 h-8 text-green-600" />
                  </div>
                  <CardTitle>Digital Solutions Ltd</CardTitle>
                  <CardDescription>Business Process Automation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Specializing in digital transformation and business process
                    automation solutions.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-gray-300" />
                    <span className="text-sm text-gray-600">
                      4.8 (30+ projects)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        QuickBooks ProAdvisor
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        API Integration Expert
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                    <Award className="w-8 h-8 text-purple-600" />
                  </div>
                  <CardTitle>Enterprise Systems</CardTitle>
                  <CardDescription>Large Enterprise Solutions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm">
                    Focused on large enterprise implementations and complex
                    system integrations.
                  </p>
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">
                      5.0 (25+ projects)
                    </span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Oracle Certified
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">SAP Partner</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Partner Benefits */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Partner Benefits
              </h2>
              <p className="text-xl text-gray-600">
                Why leading companies choose to partner with us
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Handshake className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Revenue Sharing
                    </h3>
                    <p className="text-gray-600">
                      Competitive revenue sharing model with attractive margins
                      for certified partners.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Training & Certification
                    </h3>
                    <p className="text-gray-600">
                      Comprehensive training programs and certification for your
                      technical teams.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Dedicated Support
                    </h3>
                    <p className="text-gray-600">
                      Priority technical support and dedicated partner success
                      manager.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Globe className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Market Access
                    </h3>
                    <p className="text-gray-600">
                      Access to our extensive customer base and co-marketing
                      opportunities.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      White Label Solutions
                    </h3>
                    <p className="text-gray-600">
                      Customizable white-label solutions to enhance your service
                      offerings.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-yellow-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Early Access
                    </h3>
                    <p className="text-gray-600">
                      Early access to new features and beta programs for
                      competitive advantage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8 text-white">
            <h2 className="text-4xl font-bold">Become a Partner</h2>
            <p className="text-xl opacity-90">
              Join our growing network of certified partners and help businesses
              across Nigeria achieve seamless e-invoicing compliance.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-medium rounded-lg">
                Apply Now
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-medium rounded-lg"
              >
                Partner Portal
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PartnersPage;
