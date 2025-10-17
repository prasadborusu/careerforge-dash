import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Award, Loader2, Play } from "lucide-react";
import { toast } from "sonner";

const CourseView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);
  const [instructor, setInstructor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchCourse();
  }, [id]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user && id) {
      const { data } = await supabase
        .from("course_enrollments")
        .select("id")
        .eq("course_id", id)
        .eq("student_id", user.id)
        .single();
      
      setEnrolled(!!data);
    }
  };

  const fetchCourse = async () => {
    if (!id) return;

    const { data: courseData, error } = await supabase
      .from("courses")
      .select(`
        *,
        profiles:instructor_id (full_name)
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast.error("Course not found");
      navigate("/courses");
    } else {
      setCourse(courseData);
      setInstructor(courseData.profiles);
    }
    setLoading(false);
  };

  const handleEnroll = async () => {
    if (!user) {
      toast.error("Please sign in to enroll");
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("course_enrollments")
      .insert({
        course_id: id,
        student_id: user.id,
      });

    if (error) {
      toast.error("Failed to enroll in course");
    } else {
      toast.success("Successfully enrolled!");
      setEnrolled(true);
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = url.includes("youtu.be") 
        ? url.split("youtu.be/")[1]?.split("?")[0]
        : url.split("v=")[1]?.split("&")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Vimeo
    if (url.includes("vimeo.com")) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }
    
    return url;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) {
    return null;
  }

  const embedUrl = getVideoEmbedUrl(course.video_url);

  return (
    <div className="min-h-screen bg-background">
      <Navbar user={user} />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Course Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="capitalize">{course.difficulty}</Badge>
              {course.category && <Badge variant="outline">{course.category}</Badge>}
            </div>
            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{course.description}</p>
            
            <div className="flex items-center gap-6 text-sm text-muted-foreground mb-6">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>Instructor: {instructor?.full_name || "Anonymous"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{course.duration_hours} hours</span>
              </div>
            </div>

            {!enrolled ? (
              <Button className="gradient-primary" size="lg" onClick={handleEnroll}>
                <BookOpen className="mr-2 h-5 w-5" />
                Enroll Now
              </Button>
            ) : (
              <Badge className="gradient-accent text-white" variant="outline">
                <Award className="mr-2 h-4 w-4" />
                Enrolled
              </Badge>
            )}
          </div>

          {/* Video Player */}
          {enrolled && embedUrl && (
            <Card className="mb-8 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  Course Video
                </CardTitle>
                <CardDescription>Watch the full course content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                  <iframe
                    src={embedUrl}
                    title={course.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Course Thumbnail */}
          {!enrolled && course.thumbnail_url && (
            <Card className="mb-8 shadow-card">
              <CardContent className="p-0">
                <div className="aspect-video w-full rounded-lg overflow-hidden bg-muted">
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                </div>
              </CardContent>
            </Card>
          )}

          {/* Course Details */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>About this course</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">What you'll learn</h3>
                <p className="text-muted-foreground">{course.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Course Information</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration: {course.duration_hours} hours
                  </li>
                  <li className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    Level: <span className="capitalize">{course.difficulty}</span>
                  </li>
                  {course.category && (
                    <li className="flex items-center gap-2">
                      <Award className="w-4 h-4" />
                      Category: {course.category}
                    </li>
                  )}
                </ul>
              </div>

              {!enrolled && (
                <div className="pt-4 border-t">
                  <Button className="gradient-primary w-full" size="lg" onClick={handleEnroll}>
                    <BookOpen className="mr-2 h-5 w-5" />
                    Enroll in this Course
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseView;
