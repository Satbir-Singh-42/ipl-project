import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Player, supabaseService } from '@/services/supabaseService';
import { formatIndianNumber } from '@/lib/utils';

interface PlayerDetailsModalProps {
  player: Player | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PlayerDetailsModal: React.FC<PlayerDetailsModalProps> = ({ 
  player, 
  isOpen, 
  onClose 
}) => {
  if (!player) return null;

  const hasImage = player.images && player.images.trim() !== '';
  
  // Get team-specific colors if player is sold - only for the circle
  const teamCircleGradient = player.status === 'sold' && player.team 
    ? supabaseService.getTeamGradient(player.team)
    : 'bg-white/5';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[280px] sm:w-[320px] md:w-[400px] lg:w-[480px] xl:w-[600px] 2xl:w-[700px] max-h-[95vh] sm:max-h-[90vh] mx-auto bg-[#0f1629] border border-white/20 rounded-2xl overflow-hidden p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="sr-only">
          <DialogTitle>{player.name} Details</DialogTitle>
          <DialogDescription>Player information and statistics</DialogDescription>
        </DialogHeader>

        
        {/* Player Details Content */}
        <div className="flex flex-col p-4 sm:p-5 md:p-6 xl:p-5 text-center space-y-3 sm:space-y-3 md:space-y-3">
          {/* Player Name */}
          <motion.div 
            className="flex-shrink-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-3xl xl:text-3xl font-bold text-white" data-testid="text-player-name">
              {player.name}
            </h2>
            
            {/* Country and Role */}
            <p className="text-sm sm:text-base md:text-base text-white/60 mt-1" data-testid="text-player-info">
              {player.nation} • {player.role}{player.overseas ? ' • OVERSEAS' : ''}
            </p>
          </motion.div>

          {/* Player Image */}
          <motion.div 
            className="flex justify-center flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className={`relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 lg:w-36 lg:h-36 xl:w-36 xl:h-36 overflow-hidden rounded-full ${teamCircleGradient} border-2 border-white/20 shadow-lg`}>
              {hasImage ? (
                <img
                  src={player.images}
                  alt={player.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    // Fallback to initials if image fails to load
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              <div className={`${hasImage ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center text-white font-bold text-2xl sm:text-3xl md:text-4xl`}>
                {player.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
              </div>
            </div>
          </motion.div>

          {/* Stats Grid */}
          <motion.div 
            className="grid grid-cols-2 gap-2 sm:gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            {/* Age */}
            <div className="text-center bg-white/5 rounded-xl p-2 sm:p-3 border border-white/10">
              <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Age</p>
              <p className="text-white text-lg sm:text-xl md:text-2xl font-bold mt-1">{player.age || 'N/A'}</p>
            </div>
            
            {/* Matches */}
            <div className="text-center bg-white/5 rounded-xl p-2 sm:p-3 border border-white/10">
              <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Matches</p>
              <p className="text-white text-lg sm:text-xl md:text-2xl font-bold mt-1">{player.t20Matches || 'N/A'}</p>
            </div>
          </motion.div>

          {/* Price and Points Grid */}
          <motion.div 
            className="grid grid-cols-2 gap-2 sm:gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            {/* Base Price */}
            <div className="bg-white/5 rounded-xl p-2 sm:p-3 text-center border border-white/10">
              <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Base Price</p>
              <p className="text-white text-lg sm:text-xl md:text-2xl font-bold mt-1" data-testid="text-base-price">
                ₹{formatIndianNumber(player.basePrice)}
              </p>
            </div>

            {/* Points */}
            <div className="bg-white/5 rounded-xl p-2 sm:p-3 text-center border border-white/10">
              <p className="text-white/50 text-xs uppercase tracking-wider font-medium">Points</p>
              <p className="text-white text-lg sm:text-xl md:text-2xl font-bold mt-1" data-testid="text-points">
                {player.points || 0}
              </p>
            </div>
          </motion.div>

          {/* Final Bid Price if sold */}
          {player.status === 'sold' && player.soldPrice > 0 && (
            <div className="bg-white/10 rounded-xl border border-white/20 p-3 sm:p-4 text-center">
              <p className="text-white text-base sm:text-lg md:text-xl font-bold mb-1" data-testid="text-sold-price">
                Sold for: ₹{formatIndianNumber(player.soldPrice)}
              </p>
              <p className="text-white/90 text-sm sm:text-base font-semibold" data-testid="text-team">
                {player.team}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};