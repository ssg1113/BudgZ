import React from 'react';
import {
  Utensils,
  Car,
  Briefcase,
  BookOpen,
  ShoppingBag,
  Receipt,
  Film,
  Activity,
  MoreHorizontal,
  Tag,
  TrendingUp,
  PlusCircle,
  Home,
  Coffee,
  Plane,
  Gift,
  Heart,
  Smartphone,
  Shield,
  Zap,
  type LucideProps
} from 'lucide-react';

export const iconMap: Record<string, React.FC<LucideProps>> = {
  Utensils,
  Car,
  Briefcase,
  BookOpen,
  ShoppingBag,
  Receipt,
  Film,
  Activity,
  MoreHorizontal,
  Tag,
  TrendingUp,
  PlusCircle,
  Home,
  Coffee,
  Plane,
  Gift,
  Heart,
  Smartphone,
  Shield,
  Zap
};

export const CategoryIcon: React.FC<{ name: string; className?: string; size?: number }> = ({
  name,
  className = '',
  size = 18
}) => {
  const IconComponent = iconMap[name] || Tag;
  return <IconComponent size={size} className={className} />;
};
