import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { getLevelInfo, getProgressToNextLevel, formatTransactionValue } from '@/utils/levelSystem';

interface LevelProgressProps {
  level: number;
  totalTransactionValue: number;
  className?: string;
}

const LevelProgress: React.FC<LevelProgressProps> = ({ level, totalTransactionValue, className = '' }) => {
  const levelInfo = getLevelInfo(level);
  const progress = getProgressToNextLevel(level, totalTransactionValue);

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge className={`${levelInfo.color} text-white`}>
              {levelInfo.rank}
            </Badge>
            <span className="font-semibold">Level {level}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {formatTransactionValue(totalTransactionValue)} total
          </div>
        </div>
        
        {level < 250 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress to Level {level + 1}</span>
              <span>{progress.progress.toFixed(1)}%</span>
            </div>
            <Progress value={progress.progress} className="h-2" />
            <div className="text-xs text-muted-foreground">
              {formatTransactionValue(progress.currentLevelTransactions)} / {formatTransactionValue(progress.nextLevelRequired)} 
              ({formatTransactionValue(progress.remaining)} remaining)
            </div>
          </div>
        )}
        
        {level >= 250 && (
          <div className="text-center text-sm text-muted-foreground">
            <i className="fas fa-crown text-yellow-500 mr-1"></i>
            Maximum Level Reached!
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default LevelProgress;
