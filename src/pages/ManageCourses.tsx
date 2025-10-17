import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";

const ManageCourses = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    duration_hours: "",
    thumbnail_url: "",
    video_url: "",
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

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== "educator") {
      toast.error("Access denied. Educators only.");
      navigate("/dashboard");
      return;
    }

    setUser(user);
    fetchCourses(user.id);
  };

  const fetchCourses = async (userId: string) => {
    const { data, error} = await supabase
      .from("courses")
      .select("*")
      .eq("educator_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to fetch courses");
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const courseData = {
      title: formData.title,
      description: formData.description,
      difficulty: formData.difficulty,
      duration_hours: parseInt(formData.duration_hours),
      thumbnail_url: formData.thumbnail_url || null,
      video_url: formData.video_url || null,
      educator_id: user.id,
    };

    if (editingCourse) {
      const { error } = await supabase
        .from("courses")
        .update(courseData)
        .eq("id", editingCourse.id);

      if (error) {
        toast.error("Failed to update course");
      } else {
        toast.success("Course updated successfully");
        fetchCourses(user.id);
        resetForm();
      }
    } else {
      const { error } = await supabase
        .from("courses")
        .insert(courseData);

      if (error) {
        toast.error("Failed to create course");
      } else {
        toast.success("Course created successfully");
        fetchCourses(user.id);
        resetForm();
      }
    }
  };

  const handleEdit = (course: any) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      difficulty: course.difficulty || "beginner",
      duration_hours: course.duration_hours.toString(),
      thumbnail_url: course.thumbnail_url || "",
      video_url: course.video_url || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (courseId: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    const { error } = await supabase
      .from("courses")
      .delete()
      .eq("id", courseId);

    if (error) {
      toast.error("Failed to delete course");
    } else {
      toast.success("Course deleted successfully");
      fetchCourses(user.id);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      difficulty: "beginner",
      duration_hours: "",
      thumbnail_url: "",
      video_url: "",
    });
    setEditingCourse(null);
    setDialogOpen(false);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Manage Courses</h1>
            <p className="text-muted-foreground">Create and manage your courses</p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary" onClick={resetForm}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add New Course
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingCourse ? "Edit Course" : "Create New Course"}</DialogTitle>
                <DialogDescription>
                  Fill in the course details below
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="title">Course Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="difficulty">Difficulty *</Label>
                    <Select value={formData.difficulty} onValueChange={(value: "beginner" | "intermediate" | "advanced") => setFormData({ ...formData, difficulty: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="duration">Duration (hours) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_hours}
                      onChange={(e) => setFormData({ ...formData, duration_hours: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="thumbnail">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData({ ...formData, thumbnail_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label htmlFor="video">Video URL</Label>
                  <Input
                    id="video"
                    value={formData.video_url}
                    onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                    placeholder="https://youtube.com/... or https://vimeo.com/..."
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" className="gradient-primary">
                    {editingCourse ? "Update Course" : "Create Course"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card key={course.id} className="shadow-card transition-smooth hover:shadow-elegant">
              <CardHeader>
                {course.thumbnail_url && (
                  <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                    <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-xl">{course.title}</CardTitle>
                  <Badge variant={course.is_active ? "default" : "secondary"}>
                    {course.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-3">{course.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="capitalize">{course.difficulty}</span>
                  </div>
                  <div className="text-muted-foreground">
                    {course.duration_hours} hours
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => handleEdit(course)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button variant="destructive" onClick={() => handleDelete(course.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {courses.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
            <p className="text-muted-foreground mb-4">Create your first course to get started</p>
            <Button className="gradient-primary" onClick={() => setDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Create Course
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageCourses;
