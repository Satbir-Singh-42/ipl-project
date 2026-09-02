import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Player, supabaseService } from '@/services/supabaseService';
import { PlayerDetailsModal } from './PlayerDetailsModal';
import { Plane } from 'lucide-react';

interface PlayerCardsProps {
  players: Player[];
  title: string;
}

interface GroupedPlayers {
  [role: string]: Player[];
}

// Player Card component
const PlayerCard = ({ player, onClick }: { player: Player; onClick: () => void }) => {
  const hasImage = player.images && player.images.trim() !== '';
  
  // Get team gradient for the player circle
  const teamGradient = player.status === 'sold' && player.team 
    ? supabaseService.getTeamGradient(player.team)
    : 'bg-gray-800';
  
  return (
    <motion.div 
      className="flex flex-col items-center group cursor-pointer" 
      onClick={onClick} 
      data-testid={`card-player-${player.name.replace(/\s+/g, '-').toLowerCase()}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      <div className={`relative w-28 h-28 md:w-36 md:h-36 mb-3 overflow-hidden rounded-lg ${teamGradient} border-2 border-white/20 group-hover:border-white/40 transition-colors shadow-lg`}>
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
        <div className={`${hasImage ? 'hidden' : 'flex'} absolute inset-0 items-center justify-center text-white font-bold text-base md:text-lg`}>
          {player.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
        </div>
      </div>
      <div className="flex items-center justify-center gap-1 max-w-36">
        <span className="text-white text-base md:text-lg font-medium text-center truncate">
          {player.name}
        </span>
        {player.overseas && (
          <Plane className="w-4 h-4 text-blue-400 flex-shrink-0" />
        )}
      </div>
    </motion.div>
  );
};

// Role Section component
const RoleSection = ({ role, players, onPlayerClick }: { role: string; players: Player[]; onPlayerClick: (player: Player) => void }) => {
  if (players.length === 0) return null;
  
  return (
    <div className="mb-6">
      <h3 className="text-lg md:text-xl font-bold text-white mb-4 capitalize">
        {role === 'wicketkeeper' ? 'Wicket Keeper' : 
         role === 'allrounder' ? 'All Rounder' : role}
      </h3>
      <div className="flex flex-wrap gap-8 md:gap-10">
        {players.map((player, index) => (
          <motion.div
            key={`${player.name}-${index}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              duration: 0.4, 
              delay: index * 0.1,
              ease: "easeOut" 
            }}
          >
            <PlayerCard 
              player={player} 
              onClick={() => onPlayerClick(player)}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export const PlayerCards: React.FC<PlayerCardsProps> = ({ players, title }) => {
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlayer(null);
  };
  
  // Group players by role
  const groupedPlayers: GroupedPlayers = players.reduce((acc, player) => {
    const role = player.role?.toLowerCase().trim() || 'other';
    
    // Normalize role names
    let normalizedRole = role;
    if (role.includes('batsman') || role.includes('batter') || role.includes('bat')) {
      normalizedRole = 'batsman';
    } else if (role.includes('bowler') || role.includes('bowl')) {
      normalizedRole = 'bowler';
    } else if (role.includes('allrounder') || role.includes('all-rounder') || role.includes('all rounder') || role === 'ar') {
      normalizedRole = 'allrounder';
    } else if (role.includes('wicketkeeper') || role.includes('wicket-keeper') || role.includes('wicket keeper') || role === 'wk') {
      normalizedRole = 'wicketkeeper';
    }
    
    if (!acc[normalizedRole]) {
      acc[normalizedRole] = [];
    }
    acc[normalizedRole].push(player);
    return acc;
  }, {} as GroupedPlayers);

  // Define role order for consistent display
  const roleOrder = ['batsman', 'wicketkeeper', 'allrounder', 'bowler', 'other'];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Card className="bg-[#0f1629] border-[#1a2332]">
      <CardHeader>
        <CardTitle className="text-white text-xl md:text-2xl">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 md:p-6">
        {players.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No players in this team yet
          </div>
        ) : (
          <div className="space-y-6">
            {roleOrder.map(role => (
              <RoleSection 
                key={role} 
                role={role} 
                players={groupedPlayers[role] || []} 
                onPlayerClick={handlePlayerClick}
              />
            ))}
          </div>
        )}
      </CardContent>
      
      {/* Player Details Modal */}
      <PlayerDetailsModal 
        player={selectedPlayer}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </Card>
    </motion.div>
  );
};