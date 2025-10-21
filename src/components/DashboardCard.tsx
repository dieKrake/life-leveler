"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  gradient: string;
  borderColor: string;
  textColor: string;
  progress?: {
    current: number;
    max: number;
    color: string;
  };
}

export default function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  borderColor,
  textColor,
  progress,
}: DashboardCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`${gradient} backdrop-blur-sm border ${borderColor} rounded-xl p-4 transition-all duration-200 hover:shadow-lg`}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-6 h-6 ${textColor}`} />
        <span className={`${textColor.replace('400', '100')} font-medium`}>{title}</span>
      </div>
      
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      
      {subtitle && (
        <div className={`text-xs ${textColor.replace('400', '200')}`}>
          {subtitle}
        </div>
      )}
      
      {progress && (
        <div className="mt-2">
          <div className="w-full bg-slate-900/30 rounded-full h-2">
            <div 
              className={`${progress.color} h-2 rounded-full transition-all duration-500`}
              style={{ width: `${(progress.current / progress.max) * 100}%` }}
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
