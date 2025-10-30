import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Check,
  X,
  ArrowRight,
  FileText,
  Star,
  Zap,
  Shield,
  Users,
  BarChart3,
  Headphones,
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const PricingPage = () => {
  const plans = [
    {
      name: 'Starter',
      description:
        'Perfect for small businesses getting started with FIRS compliance',
      price: '₦25,000',
      period: 'per month',
      popular: false,
      features: [
        'Up to 500 invoices/month',
        '1 ERP integration',
        'Basic FIRS compliance',
        'Email support',
        'Standard reporting',
        '5 users included',
      ],
      limitations: [
        'No advanced analytics',
        'No custom integrations',
        'No priority support',
      ],
    },
    {
      name: 'Professional',
      description: 'Ideal for growing businesses with higher invoice volumes',
      price: '₦75,000',
      period: 'per month',
      popular: true,
      features: [
        'Up to 2,500 invoices/month',
        '3 ERP integrations',
        'Advanced FIRS compliance',
        'Priority email & chat support',
        'Advanced reporting & analytics',
        '15 users included',
        'Custom workflows',
        'API access',
        'Audit trails',
      ],
      limitations: ['No white-label options', 'No dedicated support'],
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with complex requirements',
      price: 'Custom',
      period: 'contact sales',
      popular: false,
      features: [
        'Unlimited invoices',
        'Unlimited ERP integrations',
        'Full FIRS compliance suite',
        '24/7 dedicated support',
        'Custom reporting & analytics',
        'Unlimited users',
        'White-label options',
        'Custom integrations',
        'SLA guarantees',
        'On-premise deployment',
        'Advanced security features',
        'Training & onboarding',
      ],
      limitations: [],
    },
  ];

  const addOns = [
    {
      name: 'Additional ERP Integration',
      description: 'Connect additional ERP systems',
      price: '₦15,000/month',
    },
    {
      name: 'Extra Users',
      description: 'Additional user licenses',
      price: '₦2,500/user/month',
    },
    {
      name: 'Premium Support',
      description: '24/7 phone and chat support',
      price: '₦20,000/month',
    },
    {
      name: 'Custom Training',
      description: 'Personalized training sessions',
      price: '₦50,000/session',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">Databyte</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link to="/pricing" className="text-foreground font-medium">
              Pricing
            </Link>
            <Link
              to="/about"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              About
            </Link>
            <Link
              to="/docs"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Documentation
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <Link to="/auth/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth/login">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge variant="secondary" className="mb-6">
            💰 Transparent Pricing
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Simple, Transparent
            <span className="text-primary block">Pricing</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Choose the perfect plan for your business. All plans include FIRS
            compliance, ERP integration, and our core features. No hidden fees,
            no surprises.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-base">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">
                      /{plan.period}
                    </span>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="space-y-4 mb-6">
                    <h4 className="font-semibold text-green-600">
                      What's included:
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li
                          key={featureIndex}
                          className="flex items-center text-sm"
                        >
                          <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {plan.limitations.length > 0 && (
                      <>
                        <h4 className="font-semibold text-muted-foreground mt-6">
                          Not included:
                        </h4>
                        <ul className="space-y-2">
                          {plan.limitations.map(
                            (limitation, limitationIndex) => (
                              <li
                                key={limitationIndex}
                                className="flex items-center text-sm text-muted-foreground"
                              >
                                <X className="w-4 h-4 text-muted-foreground mr-2 flex-shrink-0" />
                                {limitation}
                              </li>
                            )
                          )}
                        </ul>
                      </>
                    )}
                  </div>

                  <Link to="/auth/login">
                    <Button
                      className={`w-full ${plan.popular ? 'bg-primary' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.name === 'Enterprise'
                        ? 'Contact Sales'
                        : 'Start Free Trial'}
                      <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Add-ons & Extensions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Enhance your plan with additional features and services tailored
              to your needs.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {addOns.map((addon, index) => (
              <Card key={index} className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        {addon.name}
                      </h3>
                      <p className="text-muted-foreground">
                        {addon.description}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-lg">{addon.price}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-8">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Is there a free trial?
              </h3>
              <p className="text-muted-foreground">
                Yes! We offer a 14-day free trial for all plans. No credit card
                required to start.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-muted-foreground">
                Absolutely. You can upgrade or downgrade your plan at any time.
                Changes take effect immediately.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-muted-foreground">
                We accept bank transfers, credit cards, and direct debit. All
                payments are processed securely.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Is my data secure?</h3>
              <p className="text-muted-foreground">
                Yes. We use bank-level encryption and security protocols. Your
                data is completely isolated and secure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join hundreds of companies already using Databyte for their FIRS
            compliance needs.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/login">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 h-auto"
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link to="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">Databyte</span>
              </Link>
              <p className="text-muted-foreground">
                The leading FIRS e-invoicing compliance platform for Nigerian
                businesses.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link
                    to="/features"
                    className="hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    to="/docs"
                    className="hover:text-foreground transition-colors"
                  >
                    Documentation
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link
                    to="/about"
                    className="hover:text-foreground transition-colors"
                  >
                    About
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:contact@databyte.com"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a
                    href="mailto:support@databyte.com"
                    className="hover:text-foreground transition-colors"
                  >
                    Help Center
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:support@databyte.com"
                    className="hover:text-foreground transition-colors"
                  >
                    Contact Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 Databyte Technologies. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};
