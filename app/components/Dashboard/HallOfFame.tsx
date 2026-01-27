import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const hallOfFame = [
  { name: 'Alex Rivera', rank: 1, score: '12,450', avatar: '/avatars/alex.jpg', time: '14:32' },
  { name: 'Jordan Lee', rank: 2, score: '11,890', avatar: '/avatars/jordan.jpg', time: '14:28' },
  { name: 'Sam Kim', rank: 3, score: '10,950', avatar: '/avatars/sam.jpg', time: '14:25' },
];

export default function HallOfFame() {
  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm col-span-1 lg:col-span-full h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Crown className="h-7 w-7 text-yellow-400" />
          The Hall of Fame
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-700/50">
          {hallOfFame.map((player) => (
            <div key={player.name} className="flex items-center p-6 gap-4 hover:bg-slate-800/30 transition-colors">
              <div className="flex-shrink-0">
                <Badge variant="secondary" className={`text-lg font-bold ${player.rank === 1 ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' : 'bg-slate-500/20 text-slate-300'} min-w-[32px] h-[32px]`}>
                  #{player.rank}
                </Badge>
              </div>
              <Avatar className="h-12 w-12">
                <AvatarImage src={player.avatar} alt={player.name} />
                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold">{player.name[0]}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-semibold truncate">{player.name}</p>
                <p className="text-2xl font-bold text-blue-400">{player.score}</p>
              </div>
              <span className="text-sm text-slate-400">{player.time}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
