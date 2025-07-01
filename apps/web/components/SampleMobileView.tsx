import { Smartphone, Download, MapPin, Leaf, BarChart3, Settings, User, Home, Plus, Search, Bell, Menu } from 'lucide-react';
import { useState } from 'react';

export default function TreeMapperMobileUI() {
  const [activeTab, setActiveTab] = useState('home');
  const [showMenu, setShowMenu] = useState(false);

  const navigationItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'map', icon: MapPin, label: 'Map' },
    { id: 'add', icon: Plus, label: 'Add Tree' },
    { id: 'stats', icon: BarChart3, label: 'Stats' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* Welcome Card */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-3xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold">Welcome Back!</h2>
                  <p className="text-green-100">Let's make Earth greener</p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Leaf className="w-8 h-8" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="bg-white/20 rounded-2xl p-4">
                  <div className="text-2xl font-bold">247</div>
                  <div className="text-sm text-green-100">Trees Mapped</div>
                </div>
                <div className="bg-white/20 rounded-2xl p-4">
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-sm text-green-100">This Week</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-4">
                <button className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 active:scale-95">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                    <Plus className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">Add Tree</div>
                    <div className="text-sm text-gray-500">Map new tree</div>
                  </div>
                </button>
                <button className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 active:scale-95">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 mx-auto">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-center">
                    <div className="font-semibold text-gray-800">View Map</div>
                    <div className="text-sm text-gray-500">Explore area</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Activity</h3>
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <Leaf className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">Oak Tree Added</div>
                        <div className="text-sm text-gray-500">Central Park • 2 hours ago</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'map':
        return (
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search location..."
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            {/* Map Placeholder */}
            <div className="bg-gradient-to-br from-green-100 to-blue-100 rounded-3xl h-96 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Interactive Map</h3>
                <p className="text-gray-600">Explore trees in your area</p>
              </div>
            </div>
          </div>
        );
      case 'add':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Plus className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Add New Tree</h2>
              <p className="text-gray-600">Help us map the urban forest</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tree Type</label>
                <select className="w-full p-4 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-green-500">
                  <option>Select tree type</option>
                  <option>Oak</option>
                  <option>Maple</option>
                  <option>Pine</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Current location"
                    className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-gray-200 focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <button className="w-full bg-green-600 text-white py-4 rounded-2xl font-semibold hover:bg-green-700 transition-colors">
                Add Tree
              </button>
            </div>
          </div>
        );
      case 'stats':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Your Impact</h2>
              <p className="text-gray-600">Track your contribution</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-green-600 mb-2">247</div>
                <div className="text-sm text-gray-600">Trees Mapped</div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="text-3xl font-bold text-blue-600 mb-2">5.2k</div>
                <div className="text-sm text-gray-600">CO₂ Saved (kg)</div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Monthly Progress</h3>
              <div className="space-y-3">
                {['Jan', 'Feb', 'Mar', 'Apr'].map((month, index) => (
                  <div key={month} className="flex items-center space-x-3">
                    <div className="w-8 text-sm text-gray-600">{month}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{width: `${(index + 1) * 25}%`}}
                      ></div>
                    </div>
                    <div className="text-sm font-medium text-gray-800">{(index + 1) * 12}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'profile':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">John Doe</h2>
              <p className="text-gray-600">Tree Mapper</p>
            </div>
            
            <div className="space-y-3">
              {[
                { icon: User, label: 'Edit Profile', action: () => {} },
                { icon: Bell, label: 'Notifications', action: () => {} },
                { icon: Settings, label: 'Settings', action: () => {} },
                { icon: Download, label: 'Export Data', action: () => {} }
              ].map((item, index) => (
                <button 
                  key={index}
                  onClick={item.action}
                  className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition-all"
                >
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-gray-600" />
                  </div>
                  <span className="font-medium text-gray-800">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Leaf className="w-6 h-6 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800">TreeMapper</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Bell className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => setShowMenu(!showMenu)}
            className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center"
          >
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 py-6 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 px-6 py-3">
        <div className="flex items-center justify-around">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center space-y-1 p-2 rounded-xl transition-all ${
                  isActive 
                    ? 'text-green-600 bg-green-50' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className={`w-6 h-6 ${isActive ? 'text-green-600' : ''}`} />
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Leaf className="w-5 h-5 text-green-400" />
            <span className="font-semibold">TreeMapper</span>
          </div>
          
          <div className="flex justify-center space-x-6 text-sm">
            <button className="text-gray-300 hover:text-white transition-colors">
              Imprint
            </button>
            <button className="text-gray-300 hover:text-white transition-colors">
              Terms & Conditions
            </button>
          </div>
          
          <div className="text-xs text-gray-400 pt-4 border-t border-gray-800">
            © 2025 TreeMapper. Making Earth greener, one tree at a time.
          </div>
        </div>
      </footer>

      {/* Side Menu Overlay */}
      {showMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50"
          onClick={() => setShowMenu(false)}
        >
          <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl transform transition-transform">
            <div className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-semibold">Menu</h3>
                <button 
                  onClick={() => setShowMenu(false)}
                  className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                {[
                  { icon: Settings, label: 'Settings' },
                  { icon: Download, label: 'Download App' },
                  { icon: User, label: 'Account' },
                  { icon: Bell, label: 'Notifications' }
                ].map((item, index) => (
                  <button 
                    key={index}
                    className="w-full flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <item.icon className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-800">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}