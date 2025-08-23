import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Users, Mail, Trash2, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SalesRep {
  id: string;
  name: string;
  email: string;
  active: boolean;
  created_at: string;
}

const SalesRepManager = () => {
  const [salesReps, setSalesReps] = useState<SalesRep[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRep, setNewRep] = useState({ name: '', email: '' });
  const { toast } = useToast();

  useEffect(() => {
    fetchSalesReps();
  }, []);

  const fetchSalesReps = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data, error } = await supabase
        .from('sales_reps')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSalesReps(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching sales reps",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAddRep = async () => {
    try {
      setLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { error } = await supabase
        .from('sales_reps')
        .insert({
          user_id: session.user.id,
          name: newRep.name,
          email: newRep.email,
          active: true
        });

      if (error) throw error;

      toast({
        title: "Sales rep added",
        description: `${newRep.name} has been added to your team`,
      });

      setNewRep({ name: '', email: '' });
      setDialogOpen(false);
      fetchSalesReps();
    } catch (error: any) {
      toast({
        title: "Error adding sales rep",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (repId: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('sales_reps')
        .update({ active: !active })
        .eq('id', repId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Sales rep has been ${!active ? 'activated' : 'deactivated'}`,
      });

      fetchSalesReps();
    } catch (error: any) {
      toast({
        title: "Error updating status",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDeleteRep = async (repId: string) => {
    try {
      const { error } = await supabase
        .from('sales_reps')
        .delete()
        .eq('id', repId);

      if (error) throw error;

      toast({
        title: "Sales rep removed",
        description: "Sales rep has been removed from your team",
      });

      fetchSalesReps();
    } catch (error: any) {
      toast({
        title: "Error removing sales rep",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sales Team Management
            </CardTitle>
            <CardDescription>
              Manage your sales representatives for lead assignment and outreach
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Sales Rep
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Sales Representative</DialogTitle>
                <DialogDescription>
                  Add a member to your sales team for lead assignment
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="rep-name">Full Name</Label>
                  <Input
                    id="rep-name"
                    placeholder="Enter full name"
                    value={newRep.name}
                    onChange={(e) => setNewRep({ ...newRep, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rep-email">Email Address</Label>
                  <Input
                    id="rep-email"
                    type="email"
                    placeholder="Enter email address"
                    value={newRep.email}
                    onChange={(e) => setNewRep({ ...newRep, email: e.target.value })}
                  />
                </div>
                <Button
                  onClick={handleAddRep}
                  disabled={loading || !newRep.name || !newRep.email}
                  className="w-full"
                >
                  {loading ? "Adding..." : "Add Sales Rep"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {salesReps.length === 0 ? (
          <div className="text-center py-8">
            <UserPlus className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Sales Reps Added</h3>
            <p className="text-muted-foreground mb-4">
              Add sales team members to assign leads for outreach
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Sales Rep
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesReps.map((rep) => (
                <TableRow key={rep.id}>
                  <TableCell className="font-medium">{rep.name}</TableCell>
                  <TableCell className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {rep.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rep.active ? "default" : "secondary"}>
                      {rep.active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(rep.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleActive(rep.id, rep.active)}
                      >
                        {rep.active ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteRep(rep.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
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
};

export default SalesRepManager;