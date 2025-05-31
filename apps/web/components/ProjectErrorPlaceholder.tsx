import { AlertTriangle, RefreshCw, Mail, Zap } from 'lucide-react';

export default function ErrorLoadingProject({ onRefresh }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8">
      {/* Icon Container with Animation */}
      <div className="relative mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-2xl flex items-center justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-red-600" />
        </div>
        
        {/* Decorative warning indicators */}
        <Zap className="w-5 h-5 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
        <Zap className="w-4 h-4 text-orange-500 absolute -bottom-1 -left-2 animate-pulse" style={{animationDelay: '0.5s'}} />
      </div>

      {/* Main Message */}
      <div className="text-center max-w-md">
        <h3 className="text-2xl font-semibold text-gray-800 mb-3">
          Error loading project
        </h3>
        
        <p className="text-gray-600 mb-6 leading-relaxed">
          Something went wrong while loading your project data. Please try refreshing the page.
        </p>

        {/* Refresh Button */}
        <button 
          onClick={onRefresh}
          className="inline-flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200 font-medium mb-6"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh Page
        </button>

        {/* Contact Support Message */}
        <div className="text-sm text-gray-500 border-t pt-6 mt-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Mail className="w-4 h-4" />
            <span className="font-medium">Still having issues?</span>
          </div>
          <p>
            If this problem persists, please{' '}
            <a 
              href="mailto:support@yourapp.com" 
              className="text-blue-600 hover:text-blue-800 underline font-medium"
            >
              contact us
            </a>
            {' '}for assistance.
          </p>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-50 rounded-full blur-3xl opacity-30"></div>
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-30"></div>
      </div>
    </div>
  );
}