import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useIPLData } from '@/hooks/useIPLData';
import { LoadingPage } from '@/components/LoadingPage';
import { supabaseService, type Team } from '@/services/supabaseService';
import { ArrowLeft } from 'lucide-react';
import { formatIndianNumber } from '@/lib/utils';

// Team Logo component
const TeamLogo = ({ logo, name, className = "" }: { logo: string; name: string; className?: string }) => {
  const isImageLogo = logo.startsWith('/') || logo.startsWith('http');
  
  if (isImageLogo) {
    return (
      <div
        className={`w-full h-full aspect-square bg-cover bg-center ${className}`}
        style={{ backgroundImage: `url(${logo})` }}
      />
    );
  } else {
    // Display team initials instead of ?? if logo is missing
    const displayText = logo === '??' ? supabaseService.getTeamInitials(name) : logo;
    const teamGradient = supabaseService.getTeamGradient(name);
    return (
      <div className={`w-full h-full aspect-square flex items-center justify-center text-2xl font-bold text-white ${teamGradient} ${className}`}>
        {displayText}
      </div>
    );
  }
};

export const TeamsListing = () => {
  const [teamConfigs, setTeamConfigs] = useState<Team[]>([]);
  const [, setLocation] = useLocation();
  const { teamStats, isLoading, error } = useIPLData();

  useEffect(() => {
    supabaseService.getTeamConfigs().then(setTeamConfigs);
  }, []);

  const handleTeamClick = (teamId: string) => {
    setLocation(`/team/${teamId}`);
  };

  if (isLoading) {
    return <LoadingPage />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0f1629] p-4 md:p-6">
        <div className="flex items-center justify-center h-96">
          <div className="text-red-400 text-lg">Error loading teams: {error.message}</div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="min-h-screen bg-[#0f1629] p-3 md:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-4 md:mb-6">
          <Button 
            data-testid="button-back-overview"
            variant="outline" 
            size="sm" 
            className="bg-[#1a2332] border-[#2a3441] text-gray-300 hover:bg-[#1a2332] hover:text-gray-300 hover:border-[#2a3441] text-xs md:text-sm"
            onClick={() => setLocation('/')}
          >
            <ArrowLeft className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
            Back to Overview
          </Button>
        </div>

        {/* Page Title */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">IPL Teams</h1>
          <p className="text-gray-300 text-sm md:text-base">Select a team to view their dashboard</p>
        </div>

        {/* Teams Grid */}
        {teamConfigs.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <div className="text-wwwiplt-2-0comwhite text-lg">Loading teams...</div>
          </div>
        ) : (
          <main className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-4 sm:gap-6 content-start">
            {teamConfigs.map((teamConfig: Team, index) => {
              const teamStat = teamStats?.find(stat => stat.teamId === teamConfig.id);
              return (
                <motion.div
                  key={teamConfig.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: index * 0.1,
                    ease: "easeOut" 
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className={`h-full min-w-0 flex flex-col items-center gap-6 p-3 rounded-3xl overflow-hidden border-2 border-solid ${teamConfig.borderColor} ${teamConfig.bgGradient} cursor-pointer hover:ring-2 hover:ring-white/20 transition-all duration-200`}
                    onClick={() => handleTeamClick(teamConfig.id)}
                  >
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex w-20 h-20 items-center justify-center rounded-full overflow-hidden border-2 border-white/20">
                      <TeamLogo logo={teamConfig.logo} name={teamConfig.name} />
                    </div>
                    <div className="text-center">
                      <span className="[font-family:'Work_Sans',Helvetica] font-semibold text-white text-sm tracking-[0] leading-5">
                        {teamConfig.name}
                      </span>
                    </div>
                  </div>

                  <CardContent className="flex flex-col items-start w-full bg-wwwiplt20comblack-3 p-0 flex-1">
                    <div className="flex flex-col items-start pb-3 w-full border-b border-solid border-[#ffffff1a]">
                      <div className="flex flex-col items-center py-2 w-full">
                        <span className="[font-family:'Work_Sans',Helvetica] font-normal text-wwwiplt-2-0comwhite text-sm text-center tracking-[0] leading-6">
                          Funds Remaining
                        </span>
                      </div>

                      <div className="flex flex-col items-center w-full">
                        <span className="[font-family:'Work_Sans',Helvetica] font-bold text-wwwiplt-2-0comwhite text-lg text-center tracking-[0] leading-7">
                          {teamStat ? `₹${formatIndianNumber(teamStat.fundsRemaining)}` : '₹0'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-stretch justify-center w-full flex-1">
                      <div className="pr-2 border-r border-solid border-[#ffffff1a] flex flex-col justify-between flex-1">
                        <div className="flex flex-col items-center py-2 w-full">
                          <span className="[font-family:'Work_Sans',Helvetica] font-normal text-wwwiplt-2-0comwhite text-sm text-center tracking-[0] leading-6">
                            Overseas Players
                          </span>
                        </div>

                        <div className="flex flex-col items-center w-full">
                          <span className="[font-family:'Work_Sans',Helvetica] font-bold text-wwwiplt-2-0comwhite text-lg text-center tracking-[0] leading-7">
                            {teamStat?.overseasCount || 0}
                          </span>
                        </div>
                      </div>

                      <div className="pl-2 flex flex-col justify-between flex-1">
                        <div className="flex flex-col items-center py-2 w-full">
                          <span className="[font-family:'Work_Sans',Helvetica] font-normal text-wwwiplt-2-0comwhite text-sm text-center tracking-[0] leading-6">
                            Total Players
                          </span>
                        </div>

                        <div className="flex flex-col items-center w-full">
                          <span className="[font-family:'Work_Sans',Helvetica] font-bold text-wwwiplt-2-0comwhite text-lg text-center tracking-[0] leading-7">
                            {teamStat?.playersCount || 0}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </main>
        )}
      </div>
    </motion.div>
  );
};