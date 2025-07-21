// components/MobileDownloadPrompt.tsx
import { Smartphone } from 'lucide-react';

export default function MobileDownloadPrompt() {
  return (
    <div className="min-h-screen w-full flex flex-col relative">
      {/* Backdrop Image - 40% from top */}
      <div 
        className="absolute top-0 left-0 w-full h-2/5 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1441974231531-c6227db76b6e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2560&q=80')"
        }}
      >
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col justify-center items-center px-6 py-8 relative z-10">
        <div className="w-full max-w-sm text-center">
          {/* Logo/Icon */}
          <div className="mb-8">
            <div className="w-24 h-24 bg-white bg-opacity-90 backdrop-blur-sm rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Smartphone className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">TreeMapper</h1>
            <p className="text-white text-opacity-90 text-base drop-shadow">
              For the best mobile experience, please download our app
            </p>
          </div>

          {/* Download Buttons */}
          <div className="space-y-4 mb-2" style={{paddingTop: '3rem'}}>
            {/* App Store Button */}
            <a
              href="https://apps.apple.com/app/treemapper"
              className="flex items-center justify-center w-full bg-black bg-opacity-80 backdrop-blur-sm text-white rounded-2xl py-4 px-6 transition-all hover:bg-opacity-90 hover:scale-105 active:scale-95 shadow-lg"
            >
              <div className="flex items-center space-x-4">
                <img 
                  src="/apple-icon.png" 
                  alt="Apple App Store"
                  className="w-10 h-10"
                  onError={(e) => {
                    // Fallback to SVG if image not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'block';
                  }}
                />
                <svg 
                  className="w-10 h-10 hidden" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  style={{ display: 'none' }}
                >
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </div>
            </a>

            {/* Google Play Button */}
            <a
              href="https://play.google.com/store/apps/details?id=com.treemapper"
              className="flex items-center justify-center w-full bg-black bg-opacity-80 backdrop-blur-sm text-white rounded-2xl py-4 px-6 transition-all hover:bg-opacity-90 hover:scale-105 active:scale-95 shadow-lg"
            >
              <div className="flex items-center space-x-4">
                <img 
                  src="/google-play-icon.png" 
                  alt="Google Play Store"
                  className="w-10 h-10"
                  onError={(e) => {
                    // Fallback to SVG if image not found
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling.style.display = 'block';
                  }}
                />
                <svg 
                  className="w-10 h-10 hidden" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  style={{ display: 'none' }}
                >
                  <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
                </svg>
                <div className="text-left">
                  <div className="text-xs opacity-80">Get it on</div>
                  <div className="text-lg font-semibold">Google Play</div>
                </div>
              </div>
            </a>
          </div>

          {/* Alternative text */}
          <div className="text-sm text-white text-opacity-80 leading-relaxed bg-black bg-opacity-30 backdrop-blur-sm rounded-xl p-4">
            Our dashboard is optimized for desktop and tablet screens. 
            For the best mobile experience, please use our dedicated app.
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white bg-opacity-95 backdrop-blur-sm border-t border-gray-200 px-6 py-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center space-y-4">
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <a 
                href="/imprint" 
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Imprint
              </a>
              <a 
                href="/terms" 
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Terms & Conditions
              </a>
              <a 
                href="/privacy" 
                className="text-gray-600 hover:text-green-600 transition-colors"
              >
                Privacy Policy
              </a>
            </div>
            <div className="text-xs text-gray-500 text-center">
              © 2025 TreeMapper. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}