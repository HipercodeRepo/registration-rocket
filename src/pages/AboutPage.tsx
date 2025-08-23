import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ArrowLeft, BarChart3, Users, Target, Zap, Award, Lightbulb, Rocket } from "lucide-react";

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Event Intelligence
            </span>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </Link>
            <ThemeToggle />
            <Link to="/auth">
              <Button variant="outline">Sign In</Button>
            </Link>
          </nav>

          <div className="md:hidden">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/80 bg-clip-text text-transparent">
              About Event Intelligence
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Built for AgentJam 2025, Event Intelligence Agent represents the future of automated event management. 
              We transform how organizations understand, engage with, and convert event attendees into valuable business opportunities.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Empowering event organizers with AI-driven insights that turn every registration into actionable intelligence.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Precision Targeting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Identify and prioritize high-value prospects with AI-powered lead scoring that considers seniority, company size, and industry relevance.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Real-time Action</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Enable immediate follow-up with instant notifications to sales teams when qualified leads register for your events.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Data-Driven ROI</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Measure and optimize event performance with comprehensive analytics, expense tracking, and cost-per-lead calculations.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology Stack */}
      <section className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-y border-border/40">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold">Powered by Cutting-Edge Technology</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Built with modern technologies and integrations for maximum reliability and scalability.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <Lightbulb className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">AI Enrichment</h3>
                <p className="text-sm text-muted-foreground">SixtyFour & MixRank APIs</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Event Integration</h3>
                <p className="text-sm text-muted-foreground">Luma API</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Financial Data</h3>
                <p className="text-sm text-muted-foreground">Brex API</p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center mx-auto">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold">Notifications</h3>
                <p className="text-sm text-muted-foreground">Pylon Integration</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          <div className="space-y-4">
            <h2 className="text-3xl font-bold">Built for AgentJam 2025</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Event Intelligence Agent was created as part of AgentJam 2025, demonstrating the power of autonomous agents 
              in transforming traditional business processes through intelligent automation.
            </p>
          </div>

          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-2xl p-8 border border-primary/20">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center mx-auto">
                <BarChart3 className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-bold">Innovation Through Automation</h3>
              <p className="text-muted-foreground max-w-xl mx-auto">
                This project showcases how autonomous agents can eliminate manual processes, 
                provide real-time intelligence, and create seamless integrations across multiple platforms.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Ready to Get Started?</h2>
          <p className="text-muted-foreground text-lg">
            Experience the future of event management with intelligent automation and real-time insights.
          </p>
          <Link to="/auth">
            <Button size="lg" className="group">
              Try Event Intelligence
              <BarChart3 className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;