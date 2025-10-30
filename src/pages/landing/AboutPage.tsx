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
import AnimatedCounter from '@/components/ui/animated-counter';
import CursorAnimation from '@/components/ui/cursor-animation';
import { CheckCircle, Users, Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-white">
      <CursorAnimation />
      <Navbar />
      {/* Hero Section */}
      <section
        className="pt-32 pb-20 lg:pt-40 lg:pb-32 bg-cover bg-center bg-no-repeat relative"
        style={{
          backgroundImage:
            'url(https://media.istockphoto.com/id/1451131632/photo/businessman-constantly-working-stock-photo.jpg?s=612x612&w=0&k=20&c=xXwHT62mKPJNkjkBB40mM45EWbxcP9dUmy3CGkjflig=)',
        }}
      >
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-blue-100 text-blue-800 px-4 py-2 text-sm font-medium">
              ABOUT US
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
              Leading E-invoicing Solutions
              <span className="block text-blue-400">
                for Nigerian Businesses
              </span>
            </h1>
            <p className="text-xl text-gray-200 leading-relaxed max-w-3xl mx-auto">
              We are Nigeria's premier e-invoicing platform, dedicated to
              simplifying tax compliance and streamlining business operations
              through innovative technology solutions.
            </p>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-gray-900">
                  Our Mission
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  To empower Nigerian businesses with cutting-edge e-invoicing
                  solutions that ensure 100% FIRS compliance while reducing
                  operational complexity and costs. We believe that technology
                  should simplify, not complicate business processes.
                </p>
              </div>

              <div className="space-y-6">
                <h2 className="text-4xl font-bold text-gray-900">Our Vision</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                  To become the leading digital transformation partner for
                  businesses across Africa, setting the standard for seamless
                  tax compliance and financial technology integration.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                    <Target className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle>Our Values</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Innovation
                      </h4>
                      <p className="text-gray-600 text-sm">
                        Continuously improving our platform with latest
                        technology
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Reliability
                      </h4>
                      <p className="text-gray-600 text-sm">
                        99.9% uptime guarantee for mission-critical operations
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Compliance
                      </h4>
                      <p className="text-gray-600 text-sm">
                        100% adherence to FIRS regulations and requirements
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-1" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Support</h4>
                      <p className="text-gray-600 text-sm">
                        24/7 expert support from our dedicated team
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Impact
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by businesses across Nigeria
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
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

      {/* Team Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Our Leadership Team
            </h2>
            <p className="text-xl text-gray-600">
              Experienced professionals driving innovation in financial
              technology
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <CardTitle>John Adebayo</CardTitle>
                <CardDescription>Chief Executive Officer</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  25+ years in financial technology and tax compliance solutions
                  across Africa.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <CardTitle>Sarah Okafor</CardTitle>
                <CardDescription>Chief Technology Officer</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Expert in enterprise software architecture and API development
                  for financial systems.
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Users className="w-12 h-12 text-gray-400" />
                </div>
                <CardTitle>Michael Eze</CardTitle>
                <CardDescription>Head of Compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Former FIRS official with deep expertise in Nigerian tax
                  regulations and e-invoicing requirements.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center space-y-8 text-white">
            <h2 className="text-4xl font-bold">
              Ready to Transform Your Business?
            </h2>
            <p className="text-xl opacity-90">
              Join hundreds of businesses already using our platform to
              streamline their e-invoicing processes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login">
                <Button className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-medium rounded-lg">
                  Start Free Trial
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-medium rounded-lg"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
