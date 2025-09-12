import React from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main>
        {children}
      </main>
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <i className="fas fa-gamepad text-primary text-2xl"></i>
                <span className="text-xl font-bold text-foreground">Monlyking</span>
              </div>
              <p className="text-muted-foreground mb-4">The trusted marketplace for buying and selling premium gaming accounts securely.</p>
              <div className="flex space-x-3">
                <a href="#" className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center hover:bg-primary/30 transition-colors">
                  <i className="fab fa-twitter text-primary"></i>
                </a>
                <a href="#" className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center hover:bg-primary/30 transition-colors">
                  <i className="fab fa-discord text-primary"></i>
                </a>
                <a href="#" className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center hover:bg-primary/30 transition-colors">
                  <i className="fab fa-reddit text-primary"></i>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Games</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">FIFA 24</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Valorant</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">League of Legends</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">PUBG</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Call of Duty</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Safety Guidelines</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Report Issue</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Community</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Acceptable Use</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">DMCA</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground">&copy; 2024 Monlyking. All rights reserved.</p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              <div className="flex items-center space-x-2">
                <i className="fas fa-shield-check text-green-400"></i>
                <span className="text-sm text-muted-foreground">Secure Transactions</span>
              </div>
              <div className="flex items-center space-x-2">
                <i className="fas fa-clock text-primary"></i>
                <span className="text-sm text-muted-foreground">24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
