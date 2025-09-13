import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { database } from '@/lib/firebase';
import { ref, onValue, off, get, update, push } from 'firebase/database';
import { getUser } from '@/services/firebase-api';

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  updatedAt?: string;
  adminResponse?: string;
  adminNotes?: string;
}

const SupportTickets: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved' | 'closed'>('all');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    const loadTickets = async () => {
      try {
        setLoading(true);
        const ticketsRef = ref(database, 'supportTickets');
        const snapshot = await get(ticketsRef);
        
        console.log('Support tickets snapshot:', snapshot.exists()); // Debug log
        
        if (!snapshot.exists()) {
          console.log('No support tickets found in database'); // Debug log
          setTickets([]);
          setLoading(false);
          return;
        }

        const ticketsData = snapshot.val();
        console.log('Support tickets data:', ticketsData); // Debug log
        
        const ticketsList: SupportTicket[] = Object.entries(ticketsData).map(([id, data]: [string, any]) => ({
          id,
          ...data
        }));

        console.log('Processed tickets list:', ticketsList); // Debug log

        // Sort by creation date (newest first)
        ticketsList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setTickets(ticketsList);
      } catch (error) {
        console.error('Error loading support tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTickets();

    // Listen for real-time updates
    const ticketsRef = ref(database, 'supportTickets');
    const unsubscribe = onValue(ticketsRef, () => {
      loadTickets();
    });

    return () => {
      off(ticketsRef);
    };
  }, []);

  const handleStatusChange = async (ticketId: string, status: string) => {
    try {
      const ticketRef = ref(database, `supportTickets/${ticketId}`);
      await update(ticketRef, {
        status,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating ticket status:', error);
    }
  };

  const handleAdminResponse = async () => {
    if (!selectedTicket || !adminResponse.trim()) return;

    try {
      const ticketRef = ref(database, `supportTickets/${selectedTicket.id}`);
      await update(ticketRef, {
        adminResponse: adminResponse.trim(),
        status: 'in_progress',
        updatedAt: new Date().toISOString()
      });

      // Send response as a message to user's chat
      const chatRoomId = `admin-support_${selectedTicket.userId}`;
      const messageRef = ref(database, `chats/${chatRoomId}/messages`);
      const newMessageRef = push(messageRef);
      
      const messageData = {
        senderId: 'admin-support',
        senderName: 'Monlyking Support',
        content: `Support Response: ${adminResponse.trim()}`,
        timestamp: Date.now(),
        type: 'text'
      };

      await push(messageRef, messageData);
      
      setAdminResponse('');
      setSelectedTicket(null);
    } catch (error) {
      console.error('Error sending admin response:', error);
    }
  };

  const handleAdminNotes = async () => {
    if (!selectedTicket || !adminNotes.trim()) return;

    try {
      const ticketRef = ref(database, `supportTickets/${selectedTicket.id}`);
      await update(ticketRef, {
        adminNotes: adminNotes.trim(),
        updatedAt: new Date().toISOString()
      });

      setAdminNotes('');
    } catch (error) {
      console.error('Error updating admin notes:', error);
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.message.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'in_progress':
        return <Badge variant="default" className="bg-blue-500">In Progress</Badge>;
      case 'resolved':
        return <Badge variant="default" className="bg-green-500">Resolved</Badge>;
      case 'closed':
        return <Badge variant="destructive">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'low':
        return <Badge variant="outline">Low</Badge>;
      case 'medium':
        return <Badge variant="default">Medium</Badge>;
      case 'high':
        return <Badge variant="default" className="bg-orange-500">High</Badge>;
      case 'urgent':
        return <Badge variant="destructive">Urgent</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Support Tickets ({tickets.length} total)</CardTitle>
          <p className="text-sm text-muted-foreground">
            {tickets.filter(t => t.status === 'pending').length} pending, 
            {tickets.filter(t => t.status === 'in_progress').length} in progress, 
            {tickets.filter(t => t.status === 'resolved').length} resolved
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-4">
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-border rounded-md bg-background"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card>
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            {filteredTickets.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <i className="fas fa-ticket-alt text-4xl mb-4"></i>
                <p className="text-lg font-semibold mb-2">No support tickets found</p>
                <p className="text-sm">No tickets match your current filters.</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {filteredTickets.map((ticket) => (
                  <Card key={ticket.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{ticket.subject}</h3>
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-3">
                            <div>
                              <strong>User ID:</strong> {ticket.userId}
                            </div>
                            <div>
                              <strong>Date:</strong> {new Date(ticket.createdAt).toLocaleDateString()}
                            </div>
                          </div>

                          <div className="text-sm mb-3">
                            <strong>Message:</strong>
                            <p className="text-muted-foreground mt-1">{ticket.message}</p>
                          </div>

                          {ticket.adminResponse && (
                            <div className="text-sm mb-3">
                              <strong>Admin Response:</strong>
                              <p className="text-muted-foreground mt-1">{ticket.adminResponse}</p>
                            </div>
                          )}

                          {ticket.adminNotes && (
                            <div className="text-sm mb-3">
                              <strong>Admin Notes:</strong>
                              <p className="text-muted-foreground mt-1">{ticket.adminNotes}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <i className="fas fa-reply mr-1"></i>
                            Respond
                          </Button>
                          <select
                            value={ticket.status}
                            onChange={(e) => handleStatusChange(ticket.id, e.target.value)}
                            className="px-2 py-1 text-xs border border-border rounded bg-background"
                          >
                            <option value="pending">Pending</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Response Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl mx-4">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Respond to Ticket</CardTitle>
              <Button variant="ghost" onClick={() => setSelectedTicket(null)}>
                <i className="fas fa-times"></i>
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                <strong>Subject:</strong> {selectedTicket.subject}
              </div>
              <div>
                <strong>Message:</strong>
                <p className="text-muted-foreground mt-1">{selectedTicket.message}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium">Admin Response</label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Enter your response to the user..."
                  className="mt-1"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Admin Notes (Internal)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Internal notes about this ticket..."
                  className="mt-1"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button onClick={handleAdminResponse} disabled={!adminResponse.trim()}>
                  <i className="fas fa-paper-plane mr-1"></i>
                  Send Response
                </Button>
                <Button variant="outline" onClick={handleAdminNotes} disabled={!adminNotes.trim()}>
                  <i className="fas fa-sticky-note mr-1"></i>
                  Save Notes
                </Button>
                <Button variant="ghost" onClick={() => setSelectedTicket(null)}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SupportTickets;
