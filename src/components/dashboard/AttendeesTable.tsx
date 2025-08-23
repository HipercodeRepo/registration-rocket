import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building, MapPin, Star } from "lucide-react";

const attendees = [
  {
    id: 1,
    name: "Sarah Chen",
    email: "sarah.chen@techcorp.com",
    title: "VP Engineering",
    company: "TechCorp",
    score: 9,
    status: "enriched",
    location: "San Francisco, CA",
    companySize: "500-1000"
  },
  {
    id: 2,
    name: "Marcus Rodriguez",
    email: "m.rodriguez@startup.ai",
    title: "Founder & CEO",  
    company: "Startup AI",
    score: 10,
    status: "notified",
    location: "Austin, TX",
    companySize: "1-50"
  },
  {
    id: 3,
    name: "Emily Thompson",
    email: "emily@designstudio.com",
    title: "Creative Director",
    company: "Design Studio",
    score: 6,
    status: "enriched",
    location: "New York, NY", 
    companySize: "50-100"
  },
  {
    id: 4,
    name: "David Kim",
    email: "david.kim@enterprise.com",
    title: "CTO",
    company: "Enterprise Solutions",
    score: 8,
    status: "enriched",
    location: "Seattle, WA",
    companySize: "1000+"
  }
];

function getScoreColor(score: number) {
  if (score >= 9) return "text-dashboard-success";
  if (score >= 7) return "text-dashboard-warning";
  return "text-muted-foreground";
}

function getStatusBadge(status: string) {
  switch (status) {
    case "notified":
      return <Badge className="bg-dashboard-success/10 text-dashboard-success hover:bg-dashboard-success/20">Notified</Badge>;
    case "enriched":
      return <Badge variant="secondary">Enriched</Badge>;
    default:
      return <Badge variant="outline">Pending</Badge>;
  }
}

export function AttendeesTable() {
  return (
    <Card className="gradient-card shadow-dashboard">
      <CardHeader>
        <CardTitle className="dashboard-subheading">Event Attendees</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enriched attendee profiles with lead scoring
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Attendee</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {attendees.map((attendee) => (
              <TableRow key={attendee.id} className="hover:bg-secondary/50 transition-dashboard">
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {attendee.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{attendee.name}</div>
                      <div className="text-sm text-muted-foreground">{attendee.title}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Building className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <div className="font-medium">{attendee.company}</div>
                      <div className="text-xs text-muted-foreground">{attendee.companySize} employees</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1">
                    <Star className={`h-4 w-4 ${getScoreColor(attendee.score)}`} />
                    <span className={`font-medium ${getScoreColor(attendee.score)}`}>
                      {attendee.score}/10
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {getStatusBadge(attendee.status)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{attendee.location}</span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}