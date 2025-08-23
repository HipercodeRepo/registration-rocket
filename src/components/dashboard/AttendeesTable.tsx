import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building, MapPin, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getAttendees } from "@/lib/server-actions";
import { Skeleton } from "@/components/ui/skeleton";

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
  const { data: attendeesData, isLoading } = useQuery({
    queryKey: ['attendees'],
    queryFn: () => getAttendees(),
    refetchInterval: 30000,
  });

  const attendees = attendeesData?.data || [];

  if (isLoading) {
    return (
      <Card className="gradient-card shadow-dashboard">
        <CardHeader>
          <CardTitle className="dashboard-subheading">Event Attendees</CardTitle>
          <p className="text-sm text-muted-foreground">
            Enriched attendee profiles with lead scoring
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="gradient-card shadow-dashboard">
      <CardHeader>
        <CardTitle className="dashboard-subheading">Event Attendees</CardTitle>
        <p className="text-sm text-muted-foreground">
          Enriched attendee profiles with lead scoring ({attendees.length} total)
        </p>
      </CardHeader>
      <CardContent>
        {attendees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No attendees registered yet. Use the webhook tester to simulate registrations.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Attendee</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Registered</TableHead>
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
                        <div className="text-sm text-muted-foreground">{attendee.title || 'No title'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{attendee.company || 'No company'}</div>
                        <div className="text-xs text-muted-foreground">
                          {attendee.enrichment?.company_json?.employee_count || 'Unknown'} employees
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {attendee.lead_scores?.score ? (
                      <div className="flex items-center space-x-1">
                        <Star className={`h-4 w-4 ${getScoreColor(attendee.lead_scores.score)}`} />
                        <span className={`font-medium ${getScoreColor(attendee.lead_scores.score)}`}>
                          {attendee.lead_scores.score}/10
                        </span>
                      </div>
                    ) : (
                      <Badge variant="outline">Pending</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(
                      attendee.lead_scores?.notified_at ? 'notified' : 
                      attendee.enrichment ? 'enriched' : 'pending'
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground">
                      {new Date(attendee.registered_at).toLocaleDateString()}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}