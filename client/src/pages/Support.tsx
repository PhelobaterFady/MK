import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { database } from '../lib/firebase';
import { ref, push, onValue, off, get } from 'firebase/database';

const Support: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const { toast } = useToast();
  const [ticketForm, setTicketForm] = useState({
    category: '',
    subject: '',
    orderId: '',
    description: '',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);
  const [userTickets, setUserTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  // Load user's support tickets
  useEffect(() => {
    if (!currentUser?.uid) {
      setUserTickets([]);
      setLoadingTickets(false);
      return;
    }

    const loadUserTickets = async () => {
      try {
        setLoadingTickets(true);
        const ticketsRef = ref(database, 'supportTickets');
        const snapshot = await get(ticketsRef);
        
        if (!snapshot.exists()) {
          setUserTickets([]);
          setLoadingTickets(false);
          return;
        }

        const ticketsData = snapshot.val();
        const userTicketsList = Object.entries(ticketsData)
          .filter(([_, ticket]: [string, any]) => ticket.userId === currentUser.uid)
          .map(([id, ticket]: [string, any]) => ({
            id,
            ...ticket
          }))
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setUserTickets(userTicketsList);
      } catch (error) {
        console.error('Error loading user tickets:', error);
      } finally {
        setLoadingTickets(false);
      }
    };

    loadUserTickets();

    // Listen for real-time updates
    const ticketsRef = ref(database, 'supportTickets');
    const unsubscribe = onValue(ticketsRef, () => {
      loadUserTickets();
    });

    return () => {
      off(ticketsRef, 'value', unsubscribe);
    };
  }, [currentUser?.uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (loading) {
      toast({
        title: "Please wait",
        description: "Loading user data...",
        variant: "destructive"
      });
      return;
    }
    
    if (!ticketForm.category || !ticketForm.subject || !ticketForm.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!currentUser?.uid) {
      toast({
        title: "Error",
        description: "Please log in to submit a support ticket.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const supportTicket = {
        userId: currentUser.uid,
        subject: ticketForm.subject,
        message: ticketForm.description,
        category: ticketForm.category,
        orderId: ticketForm.orderId || null,
        priority: ticketForm.priority,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      console.log('Submitting support ticket:', supportTicket); // Debug log

      const ticketsRef = ref(database, 'supportTickets');
      const result = await push(ticketsRef, supportTicket);
      
      console.log('Support ticket saved with key:', result.key); // Debug log
      
      toast({
        title: "Success",
        description: "Support ticket submitted successfully! We'll respond within 24 hours."
      });
      
      setTicketForm({
        category: '',
        subject: '',
        orderId: '',
        description: '',
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error submitting support ticket:', error);
      toast({
        title: "Error",
        description: "Failed to submit ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setTicketForm(prev => ({ ...prev, [field]: value }));
  };


  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved': return 'bg-green-500/20 text-green-400';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-400';
      case 'open': return 'bg-blue-500/20 text-blue-400';
      case 'closed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-green-500/20 text-green-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Support Center</h2>
          <p className="text-muted-foreground">Get help with your account, orders, and platform issues</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Create Ticket Form */}
          <div>
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                    <i className="fas fa-ticket-alt text-primary"></i>
                  </div>
                  <CardTitle>Create Support Ticket</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select 
                      value={ticketForm.category} 
                      onValueChange={(value) => handleInputChange('category', value)}
                    >
                      <SelectTrigger data-testid="category-select">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="account">Account Issues</SelectItem>
                        <SelectItem value="payment">Payment & Wallet</SelectItem>
                        <SelectItem value="order">Order Problems</SelectItem>
                        <SelectItem value="technical">Technical Issues</SelectItem>
                        <SelectItem value="security">Security Concerns</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="Brief description of your issue"
                      maxLength={100}
                      value={ticketForm.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      data-testid="subject-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="orderId">Order ID (if applicable)</Label>
                    <Input
                      id="orderId"
                      placeholder="#GV-2024-001847"
                      value={ticketForm.orderId}
                      onChange={(e) => handleInputChange('orderId', e.target.value)}
                      data-testid="order-id-input"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed information about your issue..."
                      maxLength={1000}
                      className="h-32"
                      value={ticketForm.description}
                      onChange={(e) => handleInputChange('description', e.target.value)}
                      data-testid="description-textarea"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Please be as specific as possible to help us resolve your issue quickly.
                    </p>
                  </div>

                  <div>
                    <Label>Priority Level</Label>
                    <RadioGroup 
                      value={ticketForm.priority} 
                      onValueChange={(value) => handleInputChange('priority', value)}
                      className="grid grid-cols-3 gap-3 mt-2"
                    >
                      <div className="flex items-center space-x-2 bg-input border border-border rounded-lg p-3 cursor-pointer hover:bg-input/80 transition-colors">
                        <RadioGroupItem value="low" id="low" />
                        <div className="flex-1">
                          <Label htmlFor="low" className="font-medium text-green-400 cursor-pointer">Low</Label>
                          <p className="text-xs text-muted-foreground">General questions</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-input border border-border rounded-lg p-3 cursor-pointer hover:bg-input/80 transition-colors">
                        <RadioGroupItem value="medium" id="medium" />
                        <div className="flex-1">
                          <Label htmlFor="medium" className="font-medium text-yellow-400 cursor-pointer">Medium</Label>
                          <p className="text-xs text-muted-foreground">Order issues</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-input border border-border rounded-lg p-3 cursor-pointer hover:bg-input/80 transition-colors">
                        <RadioGroupItem value="high" id="high" />
                        <div className="flex-1">
                          <Label htmlFor="high" className="font-medium text-red-400 cursor-pointer">High</Label>
                          <p className="text-xs text-muted-foreground">Urgent problems</p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full gradient-primary" 
                    disabled={submitting}
                    data-testid="submit-ticket-button"
                  >
                    {submitting ? (
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                    ) : (
                      <i className="fas fa-paper-plane mr-2"></i>
                    )}
                    Submit Ticket
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* My Tickets */}
          <div className="space-y-6">
            <Card className="h-fit w-full">
              <CardHeader className="pb-4 px-6">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <i className="fas fa-history text-white text-lg"></i>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">My Support Tickets</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{userTickets.length} ticket{userTickets.length !== 1 ? 's' : ''}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0 px-6">
                {loadingTickets ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    <span className="ml-3 text-muted-foreground">Loading tickets...</span>
                  </div>
                ) : userTickets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-ticket-alt text-2xl"></i>
                    </div>
                    <h3 className="font-semibold text-lg mb-2">No support tickets found</h3>
                    <p className="text-sm">Your support tickets will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {userTickets.map((ticket) => (
                      <div 
                        key={ticket.id} 
                        className="p-6 bg-muted/30 rounded-xl border border-border hover:bg-muted/50 transition-all duration-200 w-full"
                        data-testid={`ticket-${ticket.id}`}
                      >
                        <div className="flex flex-col space-y-4 mb-6">
                          <div className="flex items-start justify-between">
                            <h4 className="font-bold text-xl mb-2 flex-1">{ticket.subject}</h4>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 mb-4">
                            <Badge className={`px-4 py-2 text-sm font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                              {ticket.status.replace('_', ' ').split(' ').map((word: string) => 
                                word.charAt(0).toUpperCase() + word.slice(1)
                              ).join(' ')}
                            </Badge>
                            <Badge className={`px-4 py-2 text-sm font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                              {ticket.priority.charAt(0).toUpperCase() + ticket.priority.slice(1)}
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
                            <span className="flex items-center space-x-2">
                              <i className="fas fa-hashtag text-xs"></i>
                              <span>#{ticket.id.slice(-8)}</span>
                            </span>
                            <span className="flex items-center space-x-2">
                              <i className="fas fa-tag text-xs"></i>
                              <span className="capitalize">{ticket.category}</span>
                            </span>
                            <span className="flex items-center space-x-2">
                              <i className="fas fa-calendar text-xs"></i>
                              <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                            </span>
                          </div>
                        </div>
                      
                        <div className="mb-6">
                          <div className="flex items-center space-x-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                              <i className="fas fa-user text-white text-base"></i>
                            </div>
                            <p className="text-base font-bold text-blue-600">
                              Your Message
                            </p>
                          </div>
                          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border-l-4 border-blue-500 p-6 rounded-r-xl shadow-sm">
                            <p className="text-base text-gray-800 leading-relaxed mb-4">{ticket.message}</p>
                            <div className="flex items-center space-x-2 pt-4 border-t border-blue-200">
                              <i className="fas fa-clock text-blue-500 text-sm"></i>
                              <p className="text-sm text-blue-600 font-medium">
                                Sent on {new Date(ticket.createdAt).toLocaleDateString()} at {new Date(ticket.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {ticket.adminResponse && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                                <i className="fas fa-user-shield text-white text-base"></i>
                              </div>
                              <p className="text-base font-bold text-green-600">
                                Admin Response
                              </p>
                            </div>
                            <div className="bg-gradient-to-r from-green-50 to-green-100 border-l-4 border-green-500 p-6 rounded-r-xl shadow-sm">
                              <p className="text-base text-gray-800 leading-relaxed mb-4">{ticket.adminResponse}</p>
                              {ticket.updatedAt && (
                                <div className="flex items-center space-x-2 pt-4 border-t border-green-200">
                                  <i className="fas fa-clock text-green-500 text-sm"></i>
                                  <p className="text-sm text-green-600 font-medium">
                                    Responded on {new Date(ticket.updatedAt).toLocaleDateString()} at {new Date(ticket.updatedAt).toLocaleTimeString()}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {ticket.orderId && (
                          <div className="mb-6">
                            <div className="flex items-center space-x-3 bg-purple-50 border border-purple-200 px-5 py-4 rounded-xl">
                              <i className="fas fa-shopping-cart text-purple-500 text-base"></i>
                              <p className="text-base text-purple-600 font-medium">
                                Related Order: <span className="font-mono bg-purple-100 px-3 py-1 rounded text-sm ml-2">{ticket.orderId}</span>
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-6 border-t border-border">
                          <span className="text-sm text-muted-foreground">
                            Created {new Date(ticket.createdAt).toLocaleString()}
                          </span>
                          {ticket.adminNotes && (
                            <div className="flex items-center space-x-2 bg-orange-50 border border-orange-200 px-4 py-2 rounded-full">
                              <i className="fas fa-sticky-note text-orange-500 text-sm"></i>
                              <span className="text-sm text-orange-600 font-medium">
                                Admin Notes Available
                              </span>
                            </div>
                          )}
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;