import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Trophy, Briefcase, Users, TrendingUp, Award } from "lucide-react";
import heroImage from "@/assets/hero-education.jpg";
import Navbar from "@/components/Navbar";

const Index = () => {
  const features = [
    {
      icon: BookOpen,
      title: "World-Class Courses",
      description: "Learn from industry experts with video-based courses covering every skill",
    },
    {
      icon: Trophy,
      title: "Hackathons & Events",
      description: "Compete in exciting hackathons and showcase your skills to recruiters",
    },
    {
      icon: Briefcase,
      title: "Internship Opportunities",
      description: "Apply directly to top companies and kickstart your career",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your learning journey with streaks, certificates, and achievements",
    },
  ];

  const stats = [
    { label: "Active Learners", value: "50K+" },
    { label: "Courses Available", value: "1,000+" },
    { label: "Companies Hiring", value: "500+" },
    { label: "Success Rate", value: "95%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero" />
        <div className="container mx-auto px-4 py-20 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="inline-block">
                <Badge className="gradient-accent text-white px-4 py-1 text-sm">
                  <Award className="w-4 h-4 mr-2 inline" />
                  #1 Learning Platform
                </Badge>
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                Transform Your Career with{" "}
                <span className="gradient-primary bg-clip-text text-transparent">
                  CareerForge
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">
                Master new skills, compete in hackathons, and land your dream internship—all in one powerful platform.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/auth">
                  <Button size="lg" className="gradient-primary shadow-elegant text-lg px-8">
                    Get Started Free
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Explore Courses
                  </Button>
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 shadow-glow rounded-3xl" />
              <img 
                src={heroImage} 
                alt="Students learning together" 
                className="rounded-3xl shadow-elegant w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold gradient-primary bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything You Need to <span className="gradient-primary bg-clip-text text-transparent">Succeed</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed for students, educators, and recruiters
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-card transition-smooth hover:shadow-elegant hover:-translate-y-1 border-0">
                <CardHeader>
                  <div className="p-3 rounded-xl gradient-primary w-fit mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 gradient-hero">
        <div className="container mx-auto px-4">
          <Card className="border-0 shadow-elegant max-w-4xl mx-auto">
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-6 text-primary" />
              <h2 className="text-4xl font-bold mb-4">Ready to Start Your Journey?</h2>
              <p className="text-xl text-muted-foreground mb-8">
                Join thousands of learners achieving their career goals
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link to="/auth">
                  <Button size="lg" className="gradient-primary text-lg px-8">
                    Sign Up Now
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="lg" variant="outline" className="text-lg px-8">
                    Sign In
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 rounded-lg gradient-primary">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl">CareerForge</span>
              </div>
              <p className="text-muted-foreground">
                Empowering learners worldwide with quality education and career opportunities.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Platform</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link to="/courses" className="hover:text-primary">Courses</Link></li>
                <li><Link to="/events" className="hover:text-primary">Hackathons</Link></li>
                <li><Link to="/internships" className="hover:text-primary">Internships</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">About Us</a></li>
                <li><a href="#" className="hover:text-primary">Contact</a></li>
                <li><a href="#" className="hover:text-primary">Careers</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li><a href="#" className="hover:text-primary">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 CareerForge LMS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Badge component for the hero
const Badge = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${className}`}>
      {children}
    </span>
  );
};

export default Index;
