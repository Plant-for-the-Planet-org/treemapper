'use client'

import React, { useState, useEffect } from 'react';
import { Check, X, Loader, Edit2 } from 'lucide-react';
import { Button, Input, Textarea } from './ui';

interface EditableFieldProps {
  value: string;
  onSave: (value: string) => Promise<void>;
  type?: 'text' | 'textarea' | 'number' | 'date';
  placeholder?: string;
  className?: string;
  displayValue?: string | null;
  label?: string;
  required?: boolean;
}

export const EditableField = ({
  value,
  onSave,
  type = 'text',
  placeholder = '',
  className = '',
  displayValue = null,
  label = '',
  required = false
}: EditableFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = async () => {
    if (required && !editValue.trim()) {
      alert('This field is required');
      return;
    }

    setIsLoading(true);
    try {
      await onSave(editValue);
      setIsEditing(false);
    } catch (error) {
      console.error('Save failed:', error);
      alert('Save failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="space-y-2">
        {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
        <div className="flex items-start gap-2">
          {type === 'textarea' ? (
            <Textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className={className}
              rows={3}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : type === 'number' ? (
            <Input
              type="number"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className={className}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : type === 'date' ? (
            <Input
              type="date"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={className}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          ) : (
            <Input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder={placeholder}
              className={className}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          )}
          <div className="flex gap-1 flex-shrink-0">
            <Button size="sm" variant="primary" onClick={handleSave} disabled={isLoading}>
              {isLoading ? <Loader className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
            <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isLoading}>
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group">
      {label && <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'} flex-1`}>
          {displayValue || value || placeholder || 'Not set'}
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
        >
          <Edit2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

interface NonEditableFieldProps {
  value: string;
  onSave?: (value: string) => Promise<void>;
  type?: 'text' | 'textarea' | 'number' | 'date';
  placeholder?: string;
  className?: string;
  displayValue?: string | null;
  label?: string;
  required?: boolean;
}

export const NonEditableField = ({
  value,
  placeholder = '',
  displayValue = null,
  label = '',
}: NonEditableFieldProps) => {
  return (
    <div className="group">
      {label && <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>}
      <div className="flex items-center gap-2">
        <span className={`text-sm ${value ? 'text-gray-900' : 'text-gray-400'} flex-1`}>
          {displayValue || value || placeholder || 'Not set'}
        </span>
      </div>
    </div>
  );
};
