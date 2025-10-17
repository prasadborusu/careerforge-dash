import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Clock, Play, Search, TrendingUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

const Courses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [enrolledCourses, setEnrolledCourses] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
    fetchCourses();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      fetchEnrollments(user.id);
    }
  };

  const fetchEnrollments = async (userId: string) => {
    const { data } = await supabase
      .from("course_enrollments")
      .select("course_id")
      .eq("student_id", userId);

    if (data) {
      setEnrolledCourses(new Set(data.map(e => e.course_id)));
    }
  };

  const fetchCourses = async () => {
    const { data, error } = await supabase
      .from("courses")
      .select(`
        *,
        profiles:educator_id (full_name)
      `)
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch courses");
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleEnroll = async (courseId: string) => {
    if (!user) {
      toast.error("Please sign in to enroll");
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("course_enrollments")
      .insert({
        course_id: courseId,
        student_id: user.id,
      });

    if (error) {
      toast.error("Failed to enroll in course");
    } else {
      toast.success("Successfully enrolled!");
      setEnrolledCourses(prev => new Set(prev).add(courseId));
      
      // Update streak
      const today = new Date().toISOString().split('T')[0];
      const { data: streak } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (streak) {
        const lastActivity = new Date(streak.last_activity_date);
        const currentDate = new Date(today);
        const diffDays = Math.floor((currentDate.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

        let newStreak = streak.current_streak;
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1;
        }

        await supabase
          .from("user_streaks")
          .update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak.longest_streak),
            last_activity_date: today,
          })
          .eq("user_id", user.id);
      } else {
        await supabase
          .from("user_streaks")
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today,
          });
      }
    }
  };

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === "all" || course.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner": return "bg-green-500";
      case "intermediate": return "bg-yellow-500";
      case "advanced": return "bg-red-500";
      default: return "bg-gray-500";
    }
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
          <h1 className="text-4xl font-bold mb-2">Explore Courses</h1>
          <p className="text-muted-foreground">Discover world-class courses from expert educators</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="Difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Courses Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <Card key={course.id} className="shadow-card transition-smooth hover:shadow-elegant flex flex-col">
              <CardHeader>
                {course.thumbnail_url && (
                  <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <Badge className={`${getDifficultyColor(course.difficulty)} text-white capitalize`}>
                    {course.difficulty}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-2">{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration_hours}h</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.profiles?.full_name || "Instructor"}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full gradient-primary" 
                  onClick={() => navigate(`/courses/${course.id}`)}
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  View Course
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {filteredCourses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Courses;
