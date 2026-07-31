import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const StatCard = ({ label, value, icon: Icon, trend, trendLabel }) => (
  <div className="bg-white rounded-2xl border border-border p-5 soft-shadow hover:soft-shadow-lg transition-shadow duration-300">
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {Icon && (
        <span className="w-9 h-9 rounded-xl bg-primary/10 grid place-items-center shrink-0">
          <Icon className="w-4.5 h-4.5 text-primary" />
        </span>
      )}
    </div>
    <p className="text-2xl font-black tracking-tight">{value}</p>
    {typeof trend === 'number' && (
      <p className={`flex items-center gap-1 text-xs font-medium mt-2 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
        {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
        {Math.abs(trend)}% {trendLabel || 'vs last period'}
      </p>
    )}
  </div>
);

export default StatCard;
