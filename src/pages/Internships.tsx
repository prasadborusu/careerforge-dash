import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Clock, DollarSign, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Internships = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [appliedInternships, setAppliedInternships] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
    fetchInternships();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      fetchApplications(user.id);
    }
  };

  const fetchApplications = async (userId: string) => {
    const { data } = await supabase
      .from("internship_applications")
      .select("internship_id")
      .eq("student_id", userId);

    if (data) {
      setAppliedInternships(new Set(data.map(a => a.internship_id)));
    }
  };

  const fetchInternships = async () => {
    const { data, error } = await supabase
      .from("internships")
      .select(`
        *,
        profiles:recruiter_id (full_name)
      `)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch internships");
    } else {
      setInternships(data || []);
    }
    setLoading(false);
  };

  const handleApply = async (internshipId: string) => {
    if (!user) {
      toast.error("Please sign in to apply");
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("internship_applications")
      .insert({
        internship_id: internshipId,
        student_id: user.id,
      });

    if (error) {
      toast.error("Failed to apply for internship");
    } else {
      toast.success("Application submitted successfully!");
      setAppliedInternships(prev => new Set(prev).add(internshipId));
    }
  };

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Internship Opportunities</h1>
          <p className="text-muted-foreground">Launch your career with top companies</p>
        </div>

        {/* Internships Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {internships.map((internship) => (
            <Card key={internship.id} className="shadow-card transition-smooth hover:shadow-elegant flex flex-col">
              <CardHeader>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-xl">{internship.title}</CardTitle>
                  <Badge className={!isDeadlinePassed(internship.application_deadline) ? "bg-success text-white" : "bg-muted"}>
                    {!isDeadlinePassed(internship.application_deadline) ? "Open" : "Closed"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-lg">{internship.company_name}</span>
                </div>
                <CardDescription className="line-clamp-3">{internship.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                {internship.location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span>{internship.location}</span>
                  </div>
                )}
                {internship.duration_months && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span>{internship.duration_months} months</span>
                  </div>
                )}
                {internship.stipend && (
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign className="w-4 h-4 text-muted-foreground" />
                    <span>{internship.stipend}</span>
                  </div>
                )}
                <div className="text-sm text-muted-foreground">
                  Apply by: {format(new Date(internship.application_deadline), "MMM dd, yyyy")}
                </div>
              </CardContent>
              <CardFooter>
                {appliedInternships.has(internship.id) ? (
                  <Button className="w-full gradient-primary" disabled>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Applied
                  </Button>
                ) : isDeadlinePassed(internship.application_deadline) ? (
                  <Button className="w-full" disabled>
                    Application Closed
                  </Button>
                ) : (
                  <Button 
                    className="w-full gradient-accent" 
                    onClick={() => handleApply(internship.id)}
                  >
                    <Briefcase className="mr-2 h-4 w-4" />
                    Apply Now
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {internships.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No internships available</h3>
            <p className="text-muted-foreground">Check back soon for new opportunities</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Internships;
