'use client';

import { DocPage } from '@/components/doc-page';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  subject: string;
  category: string;
  message: string;
  files: File[];
}

export default function ContactSupportPage() {
  const t = useTranslations('pages.contactSupport');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: '',
    files: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const maxFiles = 5;
    const maxSize = 10 * 1024 * 1024; // 10MB per file

    if (files.length + formData.files.length > maxFiles) {
      setErrorMessage(t('maxFilesError', { max: maxFiles }));
      return;
    }

    const validFiles = files.filter((file) => {
      if (file.size > maxSize) {
        setErrorMessage(t('fileSizeError', { maxSize: '10MB' }));
        return false;
      }
      return true;
    });

    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...validFiles],
    }));
    setErrorMessage('');
  };

  const removeFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('subject', formData.subject);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('message', formData.message);

      formData.files.forEach((file, index) => {
        formDataToSend.append(`file_${index}`, file);
      });

      const response = await fetch('/api/contact-support', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        throw new Error(t('submitError'));
      }

      setSubmitStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        category: '',
        message: '',
        files: [],
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : t('submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DocPage
      title={t('title')}
      description={t('description')}
      pageId="contact-support"
    >
      <div className="mb-8">
        <p className="text-lg text-muted-foreground mb-4">{t('intro')}</p>
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
          <p className="text-sm text-muted-foreground">{t('responseTime')}</p>
        </div>
      </div>

      {submitStatus === 'success' && (
        <div className="mb-6 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-1">
                {t('successTitle')}
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                {t('successMessage')}
              </p>
            </div>
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-900 dark:text-red-100 mb-1">
                {t('errorTitle')}
              </h3>
              <p className="text-sm text-red-800 dark:text-red-200">
                {errorMessage || t('errorMessage')}
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              {t('nameLabel')} <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('namePlaceholder')}
              className="w-full"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              {t('emailLabel')} <span className="text-red-500">*</span>
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('emailPlaceholder')}
              className="w-full"
            />
          </div>
        </div>

        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-2">
            {t('categoryLabel')} <span className="text-red-500">*</span>
          </label>
          <Select
            id="category"
            name="category"
            required
            value={formData.category}
            onChange={handleInputChange}
            className="w-full"
          >
            <option value="">{t('categoryPlaceholder')}</option>
            <option value="technical">{t('categoryTechnical')}</option>
            <option value="account">{t('categoryAccount')}</option>
            <option value="feature">{t('categoryFeature')}</option>
            <option value="bug">{t('categoryBug')}</option>
            <option value="general">{t('categoryGeneral')}</option>
            <option value="other">{t('categoryOther')}</option>
          </Select>
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-2">
            {t('subjectLabel')} <span className="text-red-500">*</span>
          </label>
          <Input
            id="subject"
            name="subject"
            type="text"
            required
            value={formData.subject}
            onChange={handleInputChange}
            placeholder={t('subjectPlaceholder')}
            className="w-full"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            {t('messageLabel')} <span className="text-red-500">*</span>
          </label>
          <Textarea
            id="message"
            name="message"
            required
            value={formData.message}
            onChange={handleInputChange}
            placeholder={t('messagePlaceholder')}
            rows={8}
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">{t('messageHint')}</p>
        </div>

        {/* <div>
          <label htmlFor="files" className="block text-sm font-medium mb-2">
            {t('filesLabel')}
          </label>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              ref={fileInputRef}
              id="files"
              name="files"
              type="file"
              multiple
              onChange={handleFileChange}
              accept="image/*,.pdf,.doc,.docx,.txt"
              className="hidden"
            />
            <label
              htmlFor="files"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {t('filesPlaceholder')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('filesHint')}
              </span>
            </label>
          </div>

          {formData.files.length > 0 && (
            <div className="mt-4 space-y-2">
              {formData.files.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${file.lastModified || Date.now()}`}
                  className="flex items-center justify-between p-3 bg-muted rounded-md"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-2 p-1 hover:bg-destructive/10 rounded transition-colors"
                    aria-label={t('removeFile')}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div> */}

        {errorMessage && (
          <div className="p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-800 dark:text-red-200">{errorMessage}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none sm:min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('submitting')}
              </>
            ) : (
              t('submitButton')
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setFormData({
                name: '',
                email: '',
                subject: '',
                category: '',
                message: '',
                files: [],
              });
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
              setSubmitStatus('idle');
              setErrorMessage('');
            }}
            disabled={isSubmitting}
          >
            {t('resetButton')}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('privacyNote')}
        </p>
      </form>

      <div className="mt-12 pt-8 border-t">
        <h2 className="text-xl font-semibold mb-4">{t('alternativeTitle')}</h2>
        <div className="space-y-3">
          <div>
            <strong className="text-sm">{t('emailLabel')}:</strong>{' '}
            <a
              href="mailto:support@plant-for-the-planet.org"
              className="text-primary hover:underline"
            >
              support@plant-for-the-planet.org
            </a>
          </div>
          <div>
            <strong className="text-sm">{t('phoneLabel')}:</strong>{' '}
            <a href="tel:+4988089345" className="text-primary hover:underline">
              +49 (0) 8808 9345
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-4">{t('hoursNote')}</p>
        </div>
      </div>
    </DocPage>
  );
}
