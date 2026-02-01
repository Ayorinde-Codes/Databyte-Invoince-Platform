import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AnimatedCounter from '@/components/ui/animated-counter';
import {
  CheckCircle,
  BarChart3,
  Award,
  Play,
  Menu,
  X,
  Search,
  Briefcase,
  Target,
  ArrowRight,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const updateMousePosition = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', updateMousePosition);
    return () => window.removeEventListener('mousemove', updateMousePosition);
  }, []);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated cursor follower */}
      <div
        className="fixed w-4 h-4 bg-blue-500 rounded-full pointer-events-none z-50 transition-all duration-100 ease-out opacity-60"
        style={{
          left: mousePosition.x - 8,
          top: mousePosition.y - 8,
          transform: 'scale(0.8)',
        }}
      />

      {/* Navigation */}
      <nav className="relative z-40 bg-white border-b border-gray-100 sticky top-0">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img 
                src="/logo.png" 
                alt="Databytes Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-2xl font-bold text-gray-900">Databytes</span>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-10">
              <a
                href="/"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Home
              </a>
              <Link
                to="/about"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                About
              </Link>
              <Link
                to="/partners"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Partners
              </Link>
              <Link
                to="/contact"
                className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              >
                Contact
              </Link>
              <div className="flex items-center space-x-4">
                <Link to="/auth/login">
                  <Button
                    variant="outline"
                    className="border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2.5 rounded-lg font-medium transition-all duration-200"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/auth/register">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden py-6 border-t border-gray-100 bg-white">
              <div className="flex flex-col space-y-6">
                <a
                  href="/"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Home
                </a>
                <Link
                  to="/about"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  About
                </Link>
                <Link
                  to="/partners"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Partners
                </Link>
                <Link
                  to="/contact"
                  className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Contact
                </Link>
                <div className="flex flex-col space-y-3 pt-4">
                  <Link to="/auth/login">
                    <Button
                      variant="outline"
                      className="w-full border-gray-300 text-gray-700 hover:bg-gray-50 font-medium"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/auth/register">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Content */}
            <div className="space-y-8">
              <div className="space-y-6">
                <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
                  FIRS COMPLIANCE SERVICES
                </Badge>
                <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Professional E-invoicing
                  <span className="block text-blue-600">
                    and Tax Compliance
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
                  Complete guide to integrating your ERP systems with FIRS
                  e-invoicing. Streamline your business operations with our
                  comprehensive API solutions.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium rounded-lg transition-all duration-200">
                  <Play className="mr-2 w-5 h-5" />
                  OUR SERVICES
                </Button>
                <Button
                  variant="outline"
                  className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-medium rounded-lg transition-all duration-200"
                >
                  Watch The Video
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-8 pt-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">25</div>
                  <div className="text-sm text-gray-600">
                    Years of Experience in Finance Advisory
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Professional Image Placeholder */}
            <div className="relative">
              <div className="bg-gray-200 rounded-2xl overflow-hidden shadow-2xl">
                {/* Professional business person image placeholder */}
                <div className=" bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center">
                  <div className="text-center text-gray-600">
                    {/* <Briefcase className="w-16 h-16 mx-auto mb-4" /> */}
                    {/* <p className="text-lg font-medium">Professional Business Image</p>
                    <p className="text-sm">Replace with actual photo</p> */}
                    <img src="https://media.istockphoto.com/id/1444934349/photo/hardworking-young-adult-businessman-checking-the-company-budget-in-the-files.jpg?s=612x612&w=0&k=20&c=VnRiH5TQ-q6Stp7dARIQxvfpu-NGqQX55CpZRQaEzPA=" />
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Award className="w-8 h-8 text-white" />
              </div>

              <div className="absolute -bottom-6 -left-6 w-20 h-20 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
            <div className="text-center space-y-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-4xl font-bold text-blue-600">
                <AnimatedCounter end={500} suffix="+" />
              </div>
              <div className="text-gray-600 font-medium">Happy Clients</div>
            </div>
            <div className="text-center space-y-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-4xl font-bold text-green-600">
                <AnimatedCounter end={99.9} suffix="%" decimals={1} />
              </div>
              <div className="text-gray-600 font-medium">Uptime</div>
            </div>
            <div className="text-center space-y-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowRight className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-4xl font-bold text-purple-600">
                ₦<AnimatedCounter end={50} suffix="B+" />
              </div>
              <div className="text-gray-600 font-medium">Processed</div>
            </div>
            <div className="text-center space-y-4 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-4xl font-bold text-orange-600">24/7</div>
              <div className="text-gray-600 font-medium">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* About Our Platform Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center space-y-8 mb-16">
              <h2 className="text-4xl font-bold text-gray-900">
                About Our Platform
              </h2>
              <p className="text-xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                We are Nigeria's leading e-invoicing platform, providing
                comprehensive FIRS compliance solutions for businesses of all
                sizes. Our platform seamlessly integrates with major ERP systems
                to streamline your invoicing and tax compliance processes.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-4 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  ERP Integration
                </h3>
                <p className="text-gray-600">
                  Seamless integration with Sage, QuickBooks, Dynamics, and more
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-4 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  FIRS Compliance
                </h3>
                <p className="text-gray-600">
                  100% compliant with Nigerian tax regulations and requirements
                </p>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-8 text-center space-y-4 hover:shadow-xl transition-shadow">
                <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                  <Award className="w-8 h-8 text-purple-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Expert Support
                </h3>
                <p className="text-gray-600">
                  24/7 technical support from our team of tax compliance experts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Partners Section */}
      <section id="partners" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold text-gray-900">Our Partners</h2>
            <p className="text-xl text-gray-600">
              We work with leading technology partners to provide the best
              solutions for your business
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16">
              <div className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6 bg-white rounded-xl">
                <div className="w-24 h-24 bg-black rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-lg">Sage</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Sage</h3>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block">
                  ERP Systems
                </div>
              </div>

              <div className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6 bg-white rounded-xl">
                <div className="w-24 h-24 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-sm">
                    Heirs Tech
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Heirs Technologies
                </h3>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block">
                  Technology
                </div>
              </div>

              <div className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6 bg-white rounded-xl">
                <div className="w-24 h-24 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-sm">
                    Cryptware
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Cryptware
                </h3>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block">
                  Technology
                </div>
              </div>

              <div className="border-0 shadow-lg text-center hover:shadow-xl transition-shadow p-6 bg-white rounded-xl">
                <div className="w-24 h-24 bg-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-white font-bold text-sm">Odoo</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Odoo</h3>
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-medium mt-2 inline-block">
                  ERP Systems
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-4xl font-bold">Get In Touch</h2>
            <p className="text-xl text-gray-300">
              Ready to streamline your e-invoicing process? Contact our team
              today.
            </p>

            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Email Us</h3>
                <p className="text-gray-300">support@databytesintegratedservices.com</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Call Us</h3>
                <p className="text-gray-300">+234 123 456 7890</p>
              </div>
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold">Visit Us</h3>
                <p className="text-gray-300">Lagos, Nigeria</p>
              </div>
            </div>

            <div className="mt-16">
              <Link to="/auth/register">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-medium rounded-lg">
                  Start Your Free Trial
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-12">
        <div className="container mx-auto px-6">
          <div className="text-center text-gray-400">
            <p>&copy; 2024 E-invoicing Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
