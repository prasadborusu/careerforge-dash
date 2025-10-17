import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit, Trash2, Loader2, Trophy, Briefcase, Calendar } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const ManageEvents = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [internships, setInternships] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [internshipDialogOpen, setInternshipDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [editingInternship, setEditingInternship] = useState<any>(null);
  
  const [eventFormData, setEventFormData] = useState({
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    registration_deadline: "",
    max_participants: "",
    banner_url: "",
  });

  const [internshipFormData, setInternshipFormData] = useState({
    title: "",
    company_name: "",
    description: "",
    duration_months: "",
    stipend: "",
    location: "",
    application_deadline: "",
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

    if (roleData?.role !== "recruiter") {
      toast.error("Access denied. Recruiters only.");
      navigate("/dashboard");
      return;
    }

    setUser(user);
    fetchData(user.id);
  };

  const fetchData = async (userId: string) => {
    const [eventsRes, internshipsRes] = await Promise.all([
      supabase.from("events").select("*").eq("organizer_id", userId).order("created_at", { ascending: false }),
      supabase.from("internships").select("*").eq("recruiter_id", userId).order("created_at", { ascending: false })
    ]);

    if (eventsRes.error) toast.error("Failed to fetch events");
    else setEvents(eventsRes.data || []);

    if (internshipsRes.error) toast.error("Failed to fetch internships");
    else setInternships(internshipsRes.data || []);

    setLoading(false);
  };

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      ...eventFormData,
      max_participants: eventFormData.max_participants ? parseInt(eventFormData.max_participants) : null,
      organizer_id: user.id,
    };

    if (editingEvent) {
      const { error } = await supabase.from("events").update(data).eq("id", editingEvent.id);
      if (error) toast.error("Failed to update event");
      else {
        toast.success("Event updated successfully");
        fetchData(user.id);
        resetEventForm();
      }
    } else {
      const { error } = await supabase.from("events").insert(data);
      if (error) toast.error("Failed to create event");
      else {
        toast.success("Event created successfully");
        fetchData(user.id);
        resetEventForm();
      }
    }
  };

  const handleInternshipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      title: internshipFormData.title,
      company_name: internshipFormData.company_name,
      description: internshipFormData.description,
      duration_months: internshipFormData.duration_months ? parseInt(internshipFormData.duration_months) : null,
      stipend: internshipFormData.stipend || null,
      location: internshipFormData.location || null,
      application_deadline: internshipFormData.application_deadline,
      recruiter_id: user.id,
    };

    if (editingInternship) {
      const { error } = await supabase.from("internships").update(data).eq("id", editingInternship.id);
      if (error) toast.error("Failed to update internship");
      else {
        toast.success("Internship updated successfully");
        fetchData(user.id);
        resetInternshipForm();
      }
    } else {
      const { error } = await supabase.from("internships").insert(data);
      if (error) toast.error("Failed to create internship");
      else {
        toast.success("Internship created successfully");
        fetchData(user.id);
        resetInternshipForm();
      }
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!confirm("Are you sure you want to delete this event?")) return;
    const { error } = await supabase.from("events").delete().eq("id", eventId);
    if (error) toast.error("Failed to delete event");
    else {
      toast.success("Event deleted successfully");
      fetchData(user.id);
    }
  };

  const handleDeleteInternship = async (internshipId: string) => {
    if (!confirm("Are you sure you want to delete this internship?")) return;
    const { error } = await supabase.from("internships").delete().eq("id", internshipId);
    if (error) toast.error("Failed to delete internship");
    else {
      toast.success("Internship deleted successfully");
      fetchData(user.id);
    }
  };

  const resetEventForm = () => {
    setEventFormData({
      title: "",
      description: "",
      start_date: "",
      end_date: "",
      registration_deadline: "",
      max_participants: "",
      banner_url: "",
    });
    setEditingEvent(null);
    setDialogOpen(false);
  };

  const resetInternshipForm = () => {
    setInternshipFormData({
      title: "",
      company_name: "",
      description: "",
      duration_months: "",
      stipend: "",
      location: "",
      application_deadline: "",
    });
    setEditingInternship(null);
    setInternshipDialogOpen(false);
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
          <h1 className="text-4xl font-bold mb-2">Manage Events & Internships</h1>
          <p className="text-muted-foreground">Create and manage hackathons, events, and internship opportunities</p>
        </div>

        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="internships">Internships</TabsTrigger>
          </TabsList>

          <TabsContent value="events">
            <div className="mb-6">
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary" onClick={resetEventForm}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Event
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{editingEvent ? "Edit Event" : "Create New Event"}</DialogTitle>
                    <DialogDescription>Fill in the event details</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleEventSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="event-title">Event Title *</Label>
                      <Input
                        id="event-title"
                        value={eventFormData.title}
                        onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="event-description">Description *</Label>
                      <Textarea
                        id="event-description"
                        value={eventFormData.description}
                        onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                        rows={4}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="start-date">Start Date *</Label>
                        <Input
                          id="start-date"
                          type="date"
                          value={eventFormData.start_date}
                          onChange={(e) => setEventFormData({ ...eventFormData, start_date: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="end-date">End Date *</Label>
                        <Input
                          id="end-date"
                          type="date"
                          value={eventFormData.end_date}
                          onChange={(e) => setEventFormData({ ...eventFormData, end_date: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="registration-deadline">Registration Deadline *</Label>
                        <Input
                          id="registration-deadline"
                          type="date"
                          value={eventFormData.registration_deadline}
                          onChange={(e) => setEventFormData({ ...eventFormData, registration_deadline: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="max-participants">Max Participants</Label>
                        <Input
                          id="max-participants"
                          type="number"
                          value={eventFormData.max_participants}
                          onChange={(e) => setEventFormData({ ...eventFormData, max_participants: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="banner">Banner URL</Label>
                      <Input
                        id="banner"
                        value={eventFormData.banner_url}
                        onChange={(e) => setEventFormData({ ...eventFormData, banner_url: e.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={resetEventForm}>Cancel</Button>
                      <Button type="submit" className="gradient-primary">
                        {editingEvent ? "Update Event" : "Create Event"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Card key={event.id} className="shadow-card transition-smooth hover:shadow-elegant">
                  <CardHeader>
                    {event.banner_url && (
                      <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-muted">
                        <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-xl">{event.title}</CardTitle>
                      <Badge variant={event.is_active ? "default" : "secondary"}>
                        {event.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <CardDescription className="line-clamp-2">{event.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>{format(new Date(event.start_date), "MMM dd")} - {format(new Date(event.end_date), "MMM dd, yyyy")}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => {
                      setEditingEvent(event);
                      setEventFormData({
                        title: event.title,
                        description: event.description,
                        start_date: event.start_date,
                        end_date: event.end_date,
                        registration_deadline: event.registration_deadline,
                        max_participants: event.max_participants?.toString() || "",
                        banner_url: event.banner_url || "",
                      });
                      setDialogOpen(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteEvent(event.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {events.length === 0 && (
              <div className="text-center py-12">
                <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">Create your first event to get started</p>
                <Button className="gradient-primary" onClick={() => setDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Event
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="internships">
            <div className="mb-6">
              <Dialog open={internshipDialogOpen} onOpenChange={setInternshipDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gradient-primary" onClick={resetInternshipForm}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add New Internship
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingInternship ? "Edit Internship" : "Create New Internship"}</DialogTitle>
                    <DialogDescription>Fill in the internship details</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleInternshipSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="internship-title">Position Title *</Label>
                      <Input
                        id="internship-title"
                        value={internshipFormData.title}
                        onChange={(e) => setInternshipFormData({ ...internshipFormData, title: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">Company Name *</Label>
                      <Input
                        id="company"
                        value={internshipFormData.company_name}
                        onChange={(e) => setInternshipFormData({ ...internshipFormData, company_name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="internship-description">Description *</Label>
                      <Textarea
                        id="internship-description"
                        value={internshipFormData.description}
                        onChange={(e) => setInternshipFormData({ ...internshipFormData, description: e.target.value })}
                        rows={4}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Duration (months) *</Label>
                        <Input
                          id="duration"
                          type="number"
                          value={internshipFormData.duration_months}
                          onChange={(e) => setInternshipFormData({ ...internshipFormData, duration_months: e.target.value })}
                          placeholder="e.g., 3"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="stipend">Stipend</Label>
                        <Input
                          id="stipend"
                          value={internshipFormData.stipend}
                          onChange={(e) => setInternshipFormData({ ...internshipFormData, stipend: e.target.value })}
                          placeholder="e.g., ₹15,000/month"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="location">Location *</Label>
                        <Input
                          id="location"
                          value={internshipFormData.location}
                          onChange={(e) => setInternshipFormData({ ...internshipFormData, location: e.target.value })}
                          placeholder="Remote / City"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="deadline">Application Deadline *</Label>
                        <Input
                          id="deadline"
                          type="date"
                          value={internshipFormData.application_deadline}
                          onChange={(e) => setInternshipFormData({ ...internshipFormData, application_deadline: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={resetInternshipForm}>Cancel</Button>
                      <Button type="submit" className="gradient-primary">
                        {editingInternship ? "Update Internship" : "Create Internship"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {internships.map((internship) => (
                <Card key={internship.id} className="shadow-card transition-smooth hover:shadow-elegant">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-xl">{internship.title}</CardTitle>
                      <Badge variant={internship.is_active ? "default" : "secondary"}>
                        {internship.is_active ? "Active" : "Closed"}
                      </Badge>
                    </div>
                    <CardDescription>{internship.company_name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Briefcase className="w-4 h-4 text-muted-foreground" />
                        <span>{internship.duration_months} months • {internship.location}</span>
                      </div>
                      {internship.stipend && (
                        <div className="text-accent font-semibold">{internship.stipend}</div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => {
                      setEditingInternship(internship);
                      setInternshipFormData({
                        title: internship.title,
                        company_name: internship.company_name,
                        description: internship.description,
                        duration_months: internship.duration_months?.toString() || "",
                        stipend: internship.stipend || "",
                        location: internship.location || "",
                        application_deadline: internship.application_deadline,
                      });
                      setInternshipDialogOpen(true);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button variant="destructive" onClick={() => handleDeleteInternship(internship.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>

            {internships.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No internships yet</h3>
                <p className="text-muted-foreground mb-4">Create your first internship posting to get started</p>
                <Button className="gradient-primary" onClick={() => setInternshipDialogOpen(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Internship
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ManageEvents;
