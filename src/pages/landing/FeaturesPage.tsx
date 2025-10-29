import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Zap, 
  Globe, 
  CheckCircle, 
  ArrowRight, 
  BarChart3, 
  FileText, 
  Users,
  Database,
  Clock,
  Lock,
  Smartphone,
  Cloud,
  RefreshCw,
  AlertTriangle,
  TrendingUp
} from "lucide-react";
import { Link } from "react-router-dom";

export const FeaturesPage = () => {
  const features = [
    {
      icon: Zap,
      title: "ERP Integration",
      description: "Seamlessly connect with your existing ERP system",
      details: [
        "Support for Sage 300, X3, Evolution",
        "Microsoft Dynamics 365 & NAV",
        "QuickBooks Desktop & Online",
        "Oracle ERP Cloud",
        "SAP Business One",
        "Custom API integrations"
      ]
    },
    {
      icon: Shield,
      title: "FIRS Compliance",
      description: "Automated e-invoicing compliance with Nigerian tax authority",
      details: [
        "Automatic UBL generation",
        "Digital signature integration",
        "Real-time FIRS validation",
        "IRN generation",
        "QR code creation",
        "Compliance tracking"
      ]
    },
    {
      icon: BarChart3,
      title: "Analytics & Reports",
      description: "Comprehensive insights into your invoice performance",
      details: [
        "Real-time dashboards",
        "Compliance metrics",
        "Revenue analytics",
        "Customer insights",
        "Payment tracking",
        "Custom reports"
      ]
    },
    {
      icon: Globe,
      title: "Multi-tenant SaaS",
      description: "Secure, scalable platform for multiple companies",
      details: [
        "Complete data isolation",
        "Role-based access control",
        "Enterprise security",
        "Scalable infrastructure",
        "Multi-company support",
        "White-label options"
      ]
    },
    {
      icon: Database,
      title: "Data Management",
      description: "Robust data handling and synchronization",
      details: [
        "Real-time sync",
        "Data validation",
        "Backup & recovery",
        "Data migration tools",
        "API access",
        "Export capabilities"
      ]
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Built for teams with advanced permission controls",
      details: [
        "User management",
        "Role-based permissions",
        "Audit trails",
        "Workflow automation",
        "Team notifications",
        "Activity tracking"
      ]
    }
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
            <Link to="/features" className="text-foreground font-medium">
              Features
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/docs" className="text-muted-foreground hover:text-foreground transition-colors">
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
            🚀 Comprehensive Feature Set
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Everything You Need for
            <span className="text-primary block">Invoice Management</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            From ERP integration to FIRS compliance, our platform provides all the tools 
            you need to streamline your invoice management process and ensure regulatory compliance.
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg h-full">
                <CardHeader>
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Additional Features */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Advanced Capabilities
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with enterprise-grade features to handle your most demanding requirements.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-2xl font-bold mb-6">Real-time Processing</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Instant Synchronization</h4>
                    <p className="text-muted-foreground">Real-time data sync between your ERP and our platform</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <RefreshCw className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Automated Processing</h4>
                    <p className="text-muted-foreground">Automatic invoice processing and FIRS submission</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Error Detection</h4>
                    <p className="text-muted-foreground">Proactive error detection and resolution</p>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">Security & Compliance</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Lock className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Enterprise Security</h4>
                    <p className="text-muted-foreground">Bank-level encryption and security protocols</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">FIRS Certified</h4>
                    <p className="text-muted-foreground">Officially certified for FIRS e-invoicing compliance</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Cloud className="w-5 h-5 text-primary mt-1" />
                  <div>
                    <h4 className="font-semibold">Cloud Infrastructure</h4>
                    <p className="text-muted-foreground">Scalable, reliable cloud-based architecture</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Experience These Features?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start your free trial today and see how our platform can transform your invoice management.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/login">
              <Button size="lg" className="text-lg px-8 py-6 h-auto">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6 h-auto">
              Schedule Demo
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
                The leading FIRS e-invoicing compliance platform for Nigerian businesses.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link to="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><a href="mailto:contact@databyte.com" className="hover:text-foreground transition-colors">Contact</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="mailto:support@databyte.com" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="mailto:support@databyte.com" className="hover:text-foreground transition-colors">Contact Support</a></li>
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
