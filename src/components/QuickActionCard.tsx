"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  href: string;
  gradient: string;
  delay?: number;
}

export default function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  gradient,
  delay = 0,
}: QuickActionCardProps) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        whileHover={{ scale: 1.05, y: -5 }}
        whileTap={{ scale: 0.95 }}
        className={`bg-gradient-to-r ${gradient} p-6 rounded-xl text-white cursor-pointer transition-all duration-200 hover:shadow-xl group`}
      >
        <motion.div
          whileHover={{ rotate: 10 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform duration-200" />
        </motion.div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        {description && (
          <p className="text-sm opacity-90">{description}</p>
        )}
      </motion.div>
    </Link>
  );
}
