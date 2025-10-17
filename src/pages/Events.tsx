import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Trophy, Loader2, Clock } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const Events = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    checkAuth();
    fetchEvents();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    
    if (user) {
      fetchRegistrations(user.id);
    }
  };

  const fetchRegistrations = async (userId: string) => {
    const { data } = await supabase
      .from("event_registrations")
      .select("event_id")
      .eq("student_id", userId);

    if (data) {
      setRegisteredEvents(new Set(data.map(r => r.event_id)));
    }
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        profiles:organizer_id (full_name)
      `)
      .eq("is_active", true)
      .order("start_date", { ascending: true });

    if (error) {
      toast.error("Failed to fetch events");
    } else {
      setEvents(data || []);
    }
    setLoading(false);
  };

  const handleRegister = async (eventId: string) => {
    if (!user) {
      toast.error("Please sign in to register");
      navigate("/auth");
      return;
    }

    const { error } = await supabase
      .from("event_registrations")
      .insert({
        event_id: eventId,
        student_id: user.id,
      });

    if (error) {
      toast.error("Failed to register for event");
    } else {
      toast.success("Successfully registered!");
      setRegisteredEvents(prev => new Set(prev).add(eventId));
    }
  };

  const isEventUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
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
          <h1 className="text-4xl font-bold mb-2">Hackathons & Events</h1>
          <p className="text-muted-foreground">Compete, collaborate, and showcase your skills</p>
        </div>

        {/* Events Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event.id} className="shadow-card transition-smooth hover:shadow-elegant flex flex-col">
              <CardHeader>
                {event.banner_url && (
                  <div className="w-full h-48 mb-4 rounded-lg overflow-hidden bg-gradient-primary">
                    <img src={event.banner_url} alt={event.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <CardTitle className="text-xl">{event.title}</CardTitle>
                  <Badge className={isEventUpcoming(event.start_date) ? "gradient-accent text-white" : "bg-muted"}>
                    {isEventUpcoming(event.start_date) ? "Upcoming" : "Ongoing"}
                  </Badge>
                </div>
                <CardDescription className="line-clamp-3">{event.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(new Date(event.start_date), "MMM dd, yyyy")}</span>
                  <span className="text-muted-foreground">-</span>
                  <span>{format(new Date(event.end_date), "MMM dd, yyyy")}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span>Registration deadline: {format(new Date(event.registration_deadline), "MMM dd, yyyy")}</span>
                </div>
                {event.max_participants && (
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-muted-foreground" />
                    <span>Max {event.max_participants} participants</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Organized by {event.profiles?.full_name || "Organizer"}</span>
                </div>
              </CardContent>
              <CardFooter>
                {registeredEvents.has(event.id) ? (
                  <Button className="w-full gradient-primary" disabled>
                    <Trophy className="mr-2 h-4 w-4" />
                    Registered
                  </Button>
                ) : (
                  <Button 
                    className="w-full gradient-accent" 
                    onClick={() => handleRegister(event.id)}
                  >
                    <Trophy className="mr-2 h-4 w-4" />
                    Register Now
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {events.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No events available</h3>
            <p className="text-muted-foreground">Check back soon for upcoming hackathons and competitions</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Events;
