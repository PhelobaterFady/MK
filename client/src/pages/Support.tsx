import React, { useState } from 'react';
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

const Support: React.FC = () => {
  const { userProfile } = useAuth();
  const { toast } = useToast();
  const [ticketForm, setTicketForm] = useState({
    category: '',
    subject: '',
    orderId: '',
    description: '',
    priority: 'medium'
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!ticketForm.category || !ticketForm.subject || !ticketForm.description) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setSubmitting(true);
    
    try {
      // TODO: Submit to Firebase and trigger email notification
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
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

  // Mock tickets data
  const tickets = [
    {
      id: 'ST-2024-0891',
      subject: 'Payment not credited to wallet',
      category: 'Payment & Wallet',
      status: 'resolved',
      priority: 'medium',
      date: '2024-12-14',
      lastUpdatedBy: 'Admin Sarah',
      preview: 'I made a payment of $500 yesterday but it hasn\'t been credited to my wallet yet. My transaction ID is...'
    },
    {
      id: 'ST-2024-0887',
      subject: 'Account verification issues',
      category: 'Account Issues',
      status: 'in_progress',
      priority: 'high',
      date: '2024-12-12',
      lastUpdatedBy: 'You',
      preview: 'Unable to complete account verification. The system keeps rejecting my documents even though...'
    }
  ];

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

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Support Center</h2>
          <p className="text-muted-foreground">Get help with your account, orders, and platform issues</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Create Ticket Form */}
          <div className="lg:col-span-2">
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

          {/* Quick Actions & Info */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-primary/20 text-primary border-primary/30"
                  data-testid="check-order-status-button"
                >
                  <i className="fas fa-search mr-2"></i>
                  Check Order Status
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-green-500/20 text-green-400 border-green-500/30"
                  data-testid="wallet-help-button"
                >
                  <i className="fas fa-wallet mr-2"></i>
                  Wallet Help
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-purple-500/20 text-purple-400 border-purple-500/30"
                  data-testid="account-recovery-button"
                >
                  <i className="fas fa-key mr-2"></i>
                  Account Recovery
                </Button>
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <i className="fas fa-envelope text-primary"></i>
                  <div>
                    <p className="font-medium">Email Support</p>
                    <p className="text-sm text-muted-foreground">support@gamevault.com</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fas fa-clock text-primary"></i>
                  <div>
                    <p className="font-medium">Response Time</p>
                    <p className="text-sm text-muted-foreground">Within 24 hours</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <i className="fas fa-headset text-primary"></i>
                  <div>
                    <p className="font-medium">Live Chat</p>
                    <p className="text-sm text-muted-foreground">Monday - Friday, 9 AM - 6 PM</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Common Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <a href="#" className="block text-sm text-primary hover:text-primary/80 transition-colors">
                  How does the escrow system work?
                </a>
                <a href="#" className="block text-sm text-primary hover:text-primary/80 transition-colors">
                  How to level up my account?
                </a>
                <a href="#" className="block text-sm text-primary hover:text-primary/80 transition-colors">
                  Wallet top-up fees explained
                </a>
                <a href="#" className="block text-sm text-primary hover:text-primary/80 transition-colors">
                  Account safety guidelines
                </a>
                <a href="#" className="block text-sm text-primary hover:text-primary/80 transition-colors">
                  How to report suspicious activity
                </a>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* My Tickets */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-border">
                {tickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    className="py-6 hover:bg-muted/30 transition-colors"
                    data-testid={`ticket-${ticket.id}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold mb-1">{ticket.subject}</h4>
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <span>Ticket #{ticket.id}</span>
                          <span>{ticket.category}</span>
                          <span>{ticket.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge className={`text-sm font-medium ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={`text-xs ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {ticket.preview}
                    </p>
                    <div className="flex items-center space-x-4">
                      <Button
                        variant="outline"
                        size="sm"
                        data-testid={`view-ticket-${ticket.id}`}
                      >
                        <i className="fas fa-eye mr-1"></i>
                        View Details
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Last updated by <strong>{ticket.lastUpdatedBy}</strong>
                        {ticket.lastUpdatedBy === 'You' && ' • 2 hours ago'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Support;
