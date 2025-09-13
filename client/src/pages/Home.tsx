import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';

const Home: React.FC = () => {

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('/src/Public/fc26.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60"></div>
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-blue-800/40 to-slate-900/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Title - Simple and Clean */}
          <h1 className="text-6xl md:text-8xl font-black mb-8 bg-gradient-to-r from-blue-400 via-blue-500 to-cyan-400 bg-clip-text text-transparent animate-fade-in-up">
            Monly King
          </h1>
            
          {/* Subtitle */}
          <p className="text-2xl md:text-3xl text-white mb-12 font-light animate-fade-in-up delay-300">
            FC 26 Marketplace
          </p>
            
          {/* Enter Button */}
          <div className="animate-fade-in-up delay-500">
            <Link href="/marketplace">
              <Button
                size="lg"
                className="gaming-button bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-12 py-4 text-xl font-bold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105"
              >
                <i className="fas fa-store mr-3 text-2xl"></i>
                Enter Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
