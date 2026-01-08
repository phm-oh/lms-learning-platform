// File: ApproveTeacherModal.jsx
// Path: frontend/src/components/admin/ApproveTeacherModal.jsx

import React, { useState } from 'react';
import { X, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Card from '../ui/Card';

const ApproveTeacherModal = ({ isOpen, onClose, teacher, onApprove, onReject }) => {
  const [action, setAction] = useState(null); // 'approve' or 'reject'
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !teacher) return null;

  const handleSubmit = async () => {
    if (!action) return;
    if (action === 'reject' && !reason.trim()) {
      alert('กรุณาระบุเหตุผลในการปฏิเสธ');
      return;
    }

    setLoading(true);
    try {
      if (action === 'approve') {
        await onApprove(teacher.id, { notes: notes.trim() || undefined });
      } else {
        await onReject(teacher.id, { reason: reason.trim(), notes: notes.trim() || undefined });
      }
      handleClose();
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setAction(null);
    setReason('');
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {action === 'approve' ? 'อนุมัติครูผู้สอน' : action === 'reject' ? 'ปฏิเสธครูผู้สอน' : 'จัดการครูผู้สอน'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={24} className="text-gray-500" />
          </button>
        </div>

        {/* Teacher Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
              {teacher.firstName?.[0]}{teacher.lastName?.[0]}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {teacher.firstName} {teacher.lastName}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{teacher.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                สมัครเมื่อ: {new Date(teacher.createdAt).toLocaleDateString('th-TH')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Selection */}
        {!action && (
          <div className="mb-6 space-y-3">
            <button
              onClick={() => setAction('approve')}
              className="w-full p-4 border-2 border-green-200 dark:border-green-800 rounded-xl hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <CheckCircle className="text-green-600 dark:text-green-400" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">อนุมัติ</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    อนุมัติให้ครูผู้สอนสามารถเข้าสู่ระบบและสร้างหลักสูตรได้
                  </p>
                </div>
              </div>
            </button>

            <button
              onClick={() => setAction('reject')}
              className="w-full p-4 border-2 border-red-200 dark:border-red-800 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <XCircle className="text-red-600 dark:text-red-400" size={24} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">ปฏิเสธ</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    ปฏิเสธการสมัครครูผู้สอน (ต้องระบุเหตุผล)
                  </p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Form */}
        {action && (
          <div className="space-y-4">
            {action === 'reject' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  เหตุผลในการปฏิเสธ <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="ระบุเหตุผลในการปฏิเสธ..."
                  required
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                หมายเหตุ (ไม่บังคับ)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="เพิ่มหมายเหตุเพิ่มเติม..."
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none"
              />
            </div>

            {action === 'approve' && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-green-700 dark:text-green-300">
                    <p className="font-medium mb-1">การอนุมัติจะส่งอีเมลแจ้งเตือนไปยังครูผู้สอน</p>
                    <p>ครูผู้สอนจะสามารถเข้าสู่ระบบและสร้างหลักสูตรได้ทันที</p>
                  </div>
                </div>
              </div>
            )}

            {action === 'reject' && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <div className="flex items-start gap-3">
                  <AlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                  <div className="text-sm text-red-700 dark:text-red-300">
                    <p className="font-medium mb-1">การปฏิเสธจะส่งอีเมลแจ้งเตือนไปยังครูผู้สอน</p>
                    <p>ครูผู้สอนจะไม่สามารถเข้าสู่ระบบได้</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            ยกเลิก
          </Button>
          {action && (
            <Button
              variant={action === 'approve' ? 'primary' : 'danger'}
              onClick={handleSubmit}
              disabled={loading || (action === 'reject' && !reason.trim())}
            >
              {loading ? 'กำลังดำเนินการ...' : action === 'approve' ? 'อนุมัติ' : 'ปฏิเสธ'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ApproveTeacherModal;



