import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, BookOpen, Calendar, Briefcase, Trophy, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<string[]>([]);
  const [stats, setStats] = useState({
    courses: 0,
    enrollments: 0,
    events: 0,
    internships: 0,
    streak: 0,
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setUser(user);

    // Fetch user roles
    const { data: userRoles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    if (userRoles) {
      setRoles(userRoles.map((r) => r.role));
    }

    // Fetch stats based on roles
    await fetchStats(user.id, userRoles?.map((r) => r.role) || []);
    setLoading(false);
  };

  const fetchStats = async (userId: string, userRoles: string[]) => {
    let newStats = { ...stats };

    if (userRoles.includes("student")) {
      const { count: enrollmentCount } = await supabase
        .from("course_enrollments")
        .select("*", { count: "exact", head: true })
        .eq("student_id", userId);
      
      const { data: streakData } = await supabase
        .from("user_streaks")
        .select("current_streak")
        .eq("user_id", userId)
        .single();

      newStats.enrollments = enrollmentCount || 0;
      newStats.streak = streakData?.current_streak || 0;
    }

    if (userRoles.includes("educator")) {
      const { count: courseCount } = await supabase
        .from("courses")
        .select("*", { count: "exact", head: true })
        .eq("educator_id", userId);

      newStats.courses = courseCount || 0;
    }

    if (userRoles.includes("recruiter")) {
      const { count: eventCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("organizer_id", userId);

      const { count: internshipCount } = await supabase
        .from("internships")
        .select("*", { count: "exact", head: true })
        .eq("recruiter_id", userId);

      newStats.events = eventCount || 0;
      newStats.internships = internshipCount || 0;
    }

    setStats(newStats);
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
          <h1 className="text-4xl font-bold mb-2">Welcome back!</h1>
          <p className="text-muted-foreground">Here's what's happening with your learning journey</p>
          <div className="flex gap-2 mt-4">
            {roles.map((role) => (
              <Badge key={role} className="gradient-primary capitalize">
                {role}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {roles.includes("student") && (
            <>
              <Card className="shadow-card transition-smooth hover:shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled Courses</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.enrollments}</div>
                  <p className="text-xs text-muted-foreground">Active enrollments</p>
                </CardContent>
              </Card>

              <Card className="shadow-card transition-smooth hover:shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.streak} days</div>
                  <p className="text-xs text-muted-foreground">Keep it going!</p>
                </CardContent>
              </Card>
            </>
          )}

          {roles.includes("educator") && (
            <Card className="shadow-card transition-smooth hover:shadow-elegant">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">My Courses</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.courses}</div>
                <p className="text-xs text-muted-foreground">Courses created</p>
              </CardContent>
            </Card>
          )}

          {roles.includes("recruiter") && (
            <>
              <Card className="shadow-card transition-smooth hover:shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Events</CardTitle>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.events}</div>
                  <p className="text-xs text-muted-foreground">Active hackathons</p>
                </CardContent>
              </Card>

              <Card className="shadow-card transition-smooth hover:shadow-elegant">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Internships</CardTitle>
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.internships}</div>
                  <p className="text-xs text-muted-foreground">Open positions</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>What would you like to do?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {roles.includes("student") && (
                <Button className="w-full justify-start" variant="outline" onClick={() => navigate("/courses")}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Browse Courses
                </Button>
              )}
              {roles.includes("educator") && (
                <Button className="w-full justify-start gradient-primary" onClick={() => navigate("/courses/create")}>
                  <BookOpen className="mr-2 h-4 w-4" />
                  Create New Course
                </Button>
              )}
              {roles.includes("recruiter") && (
                <>
                  <Button className="w-full justify-start gradient-primary" onClick={() => navigate("/events/create")}>
                    <Trophy className="mr-2 h-4 w-4" />
                    Create Hackathon
                  </Button>
                  <Button className="w-full justify-start gradient-accent" onClick={() => navigate("/internships/create")}>
                    <Briefcase className="mr-2 h-4 w-4" />
                    Post Internship
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
