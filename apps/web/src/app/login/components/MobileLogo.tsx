import { TreePine } from "lucide-react";

export const MobileLogo: React.FC = () => {
  return (
    <div className="lg:hidden text-center mb-12">
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-[#007A49] to-emerald-600 rounded-2xl mr-4 shadow-lg">
          <TreePine className="w-8 h-8 text-white" />
        </div>
        <div className="text-left">
          <h1 className="text-3xl font-bold text-gray-900" style={{margin:0, padding:0}}>TreeMapper</h1>
          <p className="text-gray-600 mt-1">Forest restoration monitoring</p>
        </div>
      </div>
    </div>
  );
};
