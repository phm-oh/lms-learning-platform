// File: StatusBadge.jsx
// Path: frontend/src/components/admin/StatusBadge.jsx

import React from 'react';
import { CheckCircle, XCircle, Clock, Ban, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status, size = 'sm' }) => {
  const statusConfig = {
    active: {
      label: 'ใช้งาน',
      icon: CheckCircle,
      className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    pending: {
      label: 'รอการอนุมัติ',
      icon: Clock,
      className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    suspended: {
      label: 'ระงับการใช้งาน',
      icon: AlertCircle,
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    banned: {
      label: 'ถูกแบน',
      icon: Ban,
      className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    rejected: {
      label: 'ถูกปฏิเสธ',
      icon: XCircle,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      iconColor: 'text-gray-600 dark:text-gray-400'
    },
    inactive: {
      label: 'ไม่ใช้งาน',
      icon: XCircle,
      className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
      iconColor: 'text-gray-600 dark:text-gray-400'
    }
  };

  const config = statusConfig[status] || statusConfig.inactive;
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 14 : size === 'md' ? 16 : 18;

  return (
    <span className={`
      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium
      ${config.className}
    `}>
      <Icon size={iconSize} className={config.iconColor} />
      {config.label}
    </span>
  );
};

export default StatusBadge;



