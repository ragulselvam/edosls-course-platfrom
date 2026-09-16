"use client";

import React, { useState } from 'react';
import { AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: React.ReactNode;
  message?: React.ReactNode;
  itemName?: string;
  confirmText?: string;
  isDanger?: boolean;
  type?: 'danger' | 'info' | 'warning';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  message,
  itemName,
  confirmText = 'Confirm',
  isDanger = true,
  type = 'danger',
}: ConfirmModalProps) {
  const [typedValue, setTypedValue] = useState('');
  const [loading, setLoading] = useState(false);

  const requireTypeMatch = !!itemName;
  const isMatch = requireTypeMatch ? typedValue.trim() === itemName.trim() : true;
  const isDangerEffective = type === 'danger' || isDanger;

  const content = message || description;

  const handleConfirm = async () => {
    if (!isMatch) return;
    setLoading(true);
    try {
      await onConfirm();
      onClose();
      setTypedValue('');
    } catch {
      // Handled in caller
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="md">
      <div className="flex items-start gap-4">
        <div
          className={`p-3 rounded-2xl shrink-0 ${
            isDangerEffective
              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
          }`}
        >
          {isDangerEffective ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
        </div>
        <div className="space-y-3 flex-1">
          <h3 className="text-lg font-bold text-white">{title}</h3>
          {content && <div className="text-xs text-slate-300 leading-relaxed">{content}</div>}

          {requireTypeMatch && (
            <div className="space-y-2 pt-2">
              <p className="text-xs text-slate-400 font-medium">
                Type <span className="text-white font-mono font-bold">{itemName}</span> to confirm:
              </p>
              <input
                type="text"
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                placeholder={itemName}
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800 font-medium transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!isMatch || loading}
              className={`px-5 py-2 rounded-xl text-xs font-semibold text-white shadow-lg transition disabled:opacity-50 ${
                isDangerEffective
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20'
              }`}
            >
              {loading ? 'Processing...' : confirmText}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
