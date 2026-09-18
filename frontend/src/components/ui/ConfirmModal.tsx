"use client";

import React, { useState, useEffect } from 'react';
import { Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title: string;
  description?: React.ReactNode;
  message?: React.ReactNode;
  impactedResources?: string[];
  itemName?: string;
  resourceType?: string;
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
  impactedResources,
  itemName,
  resourceType = 'item name',
  confirmText = 'Delete',
  isDanger = true,
  type = 'danger',
}: ConfirmModalProps) {
  const [typedValue, setTypedValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAllResources, setShowAllResources] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setTypedValue('');
      setLoading(false);
    }
  }, [isOpen]);

  const requireTypeMatch = !!itemName;
  const isMatch = requireTypeMatch ? typedValue.trim() === itemName.trim() : true;
  const isDangerEffective = type === 'danger' || isDanger;

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
      <div className="space-y-4">
        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h3>

        {/* Description */}
        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          {message || description || (
            isDangerEffective
              ? 'This process is irreversible. All resources in the workspace will be deleted, including:'
              : 'Please confirm this action.'
          )}
        </div>

        {/* Impacted Resources List (Matching User Image) */}
        {impactedResources && impactedResources.length > 0 && (
          <div className="space-y-1 text-xs">
            {(showAllResources ? impactedResources : impactedResources.slice(0, 3)).map((item, idx) => (
              <div key={idx} className="font-bold text-slate-900 dark:text-slate-100">
                {item}
              </div>
            ))}
            {impactedResources.length > 3 && (
              <button
                type="button"
                onClick={() => setShowAllResources(!showAllResources)}
                className="text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-1 pt-1 cursor-pointer font-medium"
              >
                {showAllResources ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" /> View less resources
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" /> View all resources
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Confirmation Input Box (Matching User Image) */}
        {requireTypeMatch && (
          <div className="mt-3 p-3.5 rounded-lg border border-red-300 dark:border-rose-900/60 bg-[#fff8f6] dark:bg-rose-950/20 space-y-2">
            <p className="text-xs font-medium text-slate-700 dark:text-rose-200">
              Confirm the deletion by typing the {resourceType} <span className="font-bold text-slate-900 dark:text-white">&lsquo;{itemName}&rsquo;</span>
            </p>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              placeholder={`Type '${itemName}' to confirm`}
              className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-md text-xs font-medium text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-300 dark:border-slate-700 bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!isMatch || loading}
            className={`px-4 py-2 rounded-md text-xs font-semibold text-white transition flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed ${
              !isMatch
                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                : isDangerEffective
                ? 'bg-[#e13219] hover:bg-[#c92a14] shadow-sm'
                : 'bg-blue-600 hover:bg-blue-700 shadow-sm'
            }`}
          >
            {isDangerEffective && <Trash2 className="w-3.5 h-3.5" />}
            <span>{loading ? 'Deleting...' : confirmText}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmModal;
