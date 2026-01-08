// File: Settings.jsx
// Path: frontend/src/pages/admin/Settings.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Server,
  Database,
  HardDrive,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Upload,
  RefreshCw,
  Power,
  FileText,
  Shield,
  ArrowLeft,
  Save,
  Trash2,
  Eye,
  Filter
} from 'lucide-react';
import { Card, Button, Input } from '../../components/ui';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import adminService from '../../services/adminService';

const AdminSettings = () => {
  const navigate = useNavigate();
  
  // System Health
  const [healthData, setHealthData] = useState(null);
  const [healthLoading, setHealthLoading] = useState(false);
  
  // Maintenance Mode
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [maintenanceDuration, setMaintenanceDuration] = useState('30 minutes');
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  
  // Backup
  const [backupType, setBackupType] = useState('full');
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupHistory, setBackupHistory] = useState([]);
  
  // System Logs
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilter, setLogFilter] = useState('');
  const [logsPage, setLogsPage] = useState(1);
  const [logsPagination, setLogsPagination] = useState(null);
  
  // Active Tab
  const [activeTab, setActiveTab] = useState('health');

  useEffect(() => {
    fetchSystemHealth();
    fetchSystemLogs();
  }, [logsPage, logFilter]);

  const fetchSystemHealth = async () => {
    try {
      setHealthLoading(true);
      const response = await adminService.getSystemHealth();
      const data = response.data || response;
      setHealthData(data);
    } catch (err) {
      console.error('Fetch health error:', err);
    } finally {
      setHealthLoading(false);
    }
  };

  const fetchSystemLogs = async () => {
    try {
      setLogsLoading(true);
      const params = {
        page: logsPage,
        limit: 50,
        ...(logFilter && { level: logFilter })
      };
      const response = await adminService.getSystemLogs(params);
      const data = response.data || response;
      setLogs(data.logs || []);
      setLogsPagination(data.pagination);
    } catch (err) {
      console.error('Fetch logs error:', err);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleToggleMaintenance = async () => {
    if (!maintenanceMode && !confirm('คุณต้องการเปิดโหมดบำรุงรักษาใช่หรือไม่? ผู้ใช้จะไม่สามารถเข้าถึงระบบได้')) {
      return;
    }

    try {
      setMaintenanceLoading(true);
      const response = await adminService.toggleMaintenance({
        enabled: !maintenanceMode,
        message: maintenanceMessage || 'ระบบอยู่ระหว่างการปรับปรุง กรุณาลองใหม่ภายหลัง',
        estimatedDuration: maintenanceDuration
      });
      setMaintenanceMode(!maintenanceMode);
      alert(response.message || 'อัปเดตสถานะบำรุงรักษาเรียบร้อย');
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการอัปเดต');
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    if (!confirm(`คุณต้องการสร้าง backup ประเภท "${backupType}" ใช่หรือไม่?`)) {
      return;
    }

    try {
      setBackupLoading(true);
      const response = await adminService.createBackup({ type: backupType });
      const data = response.data || response;
      const backup = data.backup || {};
      
      const message = `สร้าง backup เรียบร้อย!\n\n` +
        `ID: ${backup.id}\n` +
        `ประเภท: ${backup.type}\n` +
        `ตำแหน่ง: ${backup.backupDir || backup.location || 'ไม่ระบุ'}\n\n` +
        `หมายเหตุ: ไฟล์ backup ถูกเก็บไว้ที่โฟลเดอร์ backups ในโปรเจกต์`;
      
      alert(message);
      
      // Add to backup history
      if (backup.id) {
        setBackupHistory(prev => [backup, ...prev]);
      }
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการสร้าง backup');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!confirm('คุณต้องการส่งออกข้อมูลใช่หรือไม่?')) {
      return;
    }

    try {
      const response = await adminService.exportData();
      alert('ส่งออกข้อมูลเรียบร้อย');
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการส่งออกข้อมูล');
    }
  };

  const getHealthStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'error':
        return <XCircle className="text-red-500" size={20} />;
      default:
        return <Clock className="text-gray-500" size={20} />;
    }
  };

  const getLogLevelColor = (level) => {
    switch (level) {
      case 'error':
        return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'warn':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'info':
        return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      default:
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800';
    }
  };

  const formatUptime = (seconds) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days} วัน ${hours} ชั่วโมง ${minutes} นาที`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('th-TH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const tabs = [
    { id: 'health', label: 'สถานะระบบ', icon: Activity },
    { id: 'maintenance', label: 'โหมดบำรุงรักษา', icon: Power },
    { id: 'backup', label: 'สำรองข้อมูล', icon: Database },
    { id: 'logs', label: 'บันทึกระบบ', icon: FileText }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin/dashboard')}>
            <ArrowLeft size={20} className="mr-2" /> กลับ
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              ตั้งค่าระบบ
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              จัดการการตั้งค่าระบบ, บำรุงรักษา, และสำรองข้อมูล
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card className="p-0">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {/* System Health Tab */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  สถานะระบบ
                </h2>
                <Button variant="outline" size="sm" onClick={fetchSystemHealth} disabled={healthLoading}>
                  <RefreshCw size={16} className={`mr-2 ${healthLoading ? 'animate-spin' : ''}`} />
                  รีเฟรช
                </Button>
              </div>

              {healthLoading ? (
                <div className="flex items-center justify-center py-12">
                  <LoadingSpinner />
                </div>
              ) : healthData ? (
                <>
                  {/* Overall Status */}
                  <Card className="p-6 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">สถานะโดยรวม</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {healthData.status === 'healthy' ? 'ระบบทำงานปกติ' : 'มีปัญหา'}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          Uptime: {formatUptime(healthData.uptime || 0)}
                        </p>
                      </div>
                      {getHealthStatusIcon(healthData.status)}
                    </div>
                  </Card>

                  {/* Health Checks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {healthData.checks && Object.entries(healthData.checks).map(([key, check]) => (
                      <Card key={key} className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                            {key === 'database' && <Database className="text-blue-500" size={24} />}
                            {key === 'email' && <Upload className="text-green-500" size={24} />}
                            {key === 'storage' && <HardDrive className="text-purple-500" size={24} />}
                            {key === 'memory' && <Server className="text-orange-500" size={24} />}
                            <h3 className="font-semibold text-gray-900 dark:text-white capitalize">
                              {key === 'database' ? 'ฐานข้อมูล' : 
                               key === 'email' ? 'อีเมล' :
                               key === 'storage' ? 'ที่เก็บข้อมูล' :
                               key === 'memory' ? 'หน่วยความจำ' : key}
                            </h3>
                          </div>
                          {getHealthStatusIcon(check.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {check.message || '-'}
                        </p>
                        {check.percentage && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-gray-600 dark:text-gray-400">การใช้</span>
                              <span className="font-medium">{check.percentage}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  check.percentage < 70 ? 'bg-green-500' :
                                  check.percentage < 90 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${check.percentage}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {/* Performance Metrics */}
                  {healthData.performance && (
                    <Card className="p-6">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                        ประสิทธิภาพระบบ
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">เวลาตอบสนองเฉลี่ย</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {healthData.performance.averageResponseTime || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">คำขอต่อนาที</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {healthData.performance.requestsPerMinute?.toLocaleString() || '-'}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">อัตราข้อผิดพลาด</p>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {healthData.performance.errorRate || '-'}
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              ) : (
                <Card className="p-12 text-center">
                  <AlertTriangle className="mx-auto mb-4 text-gray-400" size={48} />
                  <p className="text-gray-500 dark:text-gray-400">ไม่สามารถโหลดข้อมูลสถานะระบบได้</p>
                </Card>
              )}
            </div>
          )}

          {/* Maintenance Mode Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                โหมดบำรุงรักษา
              </h2>

              <Card className="p-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                        สถานะโหมดบำรุงรักษา
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        เมื่อเปิดใช้งาน ผู้ใช้จะไม่สามารถเข้าถึงระบบได้
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        maintenanceMode
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {maintenanceMode ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ข้อความแจ้งเตือน
                      </label>
                      <Input
                        type="text"
                        value={maintenanceMessage}
                        onChange={(e) => setMaintenanceMessage(e.target.value)}
                        placeholder="ระบบอยู่ระหว่างการปรับปรุง กรุณาลองใหม่ภายหลัง"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        ระยะเวลาที่คาดการณ์
                      </label>
                      <Input
                        type="text"
                        value={maintenanceDuration}
                        onChange={(e) => setMaintenanceDuration(e.target.value)}
                        placeholder="30 minutes"
                        className="w-full"
                      />
                    </div>

                    <Button
                      variant={maintenanceMode ? "outline" : "primary"}
                      onClick={handleToggleMaintenance}
                      disabled={maintenanceLoading}
                      className="w-full"
                    >
                      {maintenanceLoading ? (
                        <>
                          <RefreshCw size={18} className="mr-2 animate-spin" />
                          กำลังอัปเดต...
                        </>
                      ) : (
                        <>
                          <Power size={18} className="mr-2" />
                          {maintenanceMode ? 'ปิดโหมดบำรุงรักษา' : 'เปิดโหมดบำรุงรักษา'}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Backup Tab */}
          {activeTab === 'backup' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                สำรองข้อมูล
              </h2>

              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ประเภทการสำรองข้อมูล
                    </label>
                    <select
                      value={backupType}
                      onChange={(e) => setBackupType(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                    >
                      <option value="full">Full Backup (ทั้งหมด)</option>
                      <option value="database">Database Only (ฐานข้อมูลเท่านั้น)</option>
                      <option value="files">Files Only (ไฟล์เท่านั้น)</option>
                    </select>
                  </div>

                  <Button
                    variant="primary"
                    onClick={handleCreateBackup}
                    disabled={backupLoading}
                    className="w-full"
                  >
                    {backupLoading ? (
                      <>
                        <RefreshCw size={18} className="mr-2 animate-spin" />
                        กำลังสร้าง backup...
                      </>
                    ) : (
                      <>
                        <Database size={18} className="mr-2" />
                        สร้าง Backup
                      </>
                    )}
                  </Button>

                  <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                      ประวัติการสำรองข้อมูล
                    </h3>
                    {backupHistory.length > 0 ? (
                      <div className="space-y-2">
                        {backupHistory.map((backup) => (
                          <div key={backup.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{backup.type}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {formatDate(backup.createdAt)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600 dark:text-gray-400">{backup.size}</span>
                              <Button variant="outline" size="sm">
                                <Download size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                        ยังไม่มีประวัติการสำรองข้อมูล
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* System Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  บันทึกระบบ
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={logFilter}
                    onChange={(e) => {
                      setLogFilter(e.target.value);
                      setLogsPage(1);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">ทุกระดับ</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                  <Button variant="outline" size="sm" onClick={fetchSystemLogs} disabled={logsLoading}>
                    <RefreshCw size={16} className={`${logsLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          เวลา
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          ระดับ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          ข้อความ
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                          ผู้ใช้/IP
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {logsLoading ? (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <LoadingSpinner />
                          </td>
                        </tr>
                      ) : logs.length > 0 ? (
                        logs.map((log, index) => (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(log.timestamp)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getLogLevelColor(log.level)}`}>
                                {log.level?.toUpperCase() || 'INFO'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                              {log.message || '-'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                              {log.userEmail ? (
                                <div>
                                  <p>{log.userEmail}</p>
                                  {log.ip && <p className="text-xs">{log.ip}</p>}
                                </div>
                              ) : (
                                log.ip || '-'
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-6 py-12 text-center">
                            <FileText className="mx-auto mb-4 text-gray-400" size={48} />
                            <p className="text-gray-500 dark:text-gray-400">ไม่พบบันทึกระบบ</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {logsPagination && logsPagination.totalPages > 1 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      หน้า {logsPage} จาก {logsPagination.totalPages}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogsPage(logsPage - 1)}
                        disabled={!logsPagination.hasPrev || logsLoading}
                      >
                        ก่อนหน้า
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLogsPage(logsPage + 1)}
                        disabled={!logsPagination.hasNext || logsLoading}
                      >
                        ถัดไป
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminSettings;

