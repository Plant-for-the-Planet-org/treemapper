'use client'

import { Trees, Sparkles, ArrowRight } from 'lucide-react';
// import ProjectInviteModal from './ProjectInviteModal';

export default function NoProjectSelected({ handleCreateProject }: { handleCreateProject: () => void }) {


    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[300px] p-8">
            {/* <ProjectInviteModal /> */}
            {/* Icon Container with Animation */}
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-2xl flex items-center justify-center mb-3 animate-pulse">
                    <Trees className="w-12 h-12" color='#007A49' />
                </div>

                {/* Decorative sparkles */}
                <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1 -right-1 animate-bounce" style={{ animationDelay: '0.5s' }} />
                <Sparkles className="w-4 h-4 text-pink-400 absolute -bottom-1 -left-1 animate-bounce" style={{ animationDelay: '1s' }} />
            </div>

            {/* Main Message */}
            <div className="text-center max-w-md">
                <h3 className="text-2xl font-semibold text-gray-800 mb-3">
                    No project found
                </h3>

                <p className="text-gray-600 mb-6 leading-relaxed">
                   Creating new personal project....
                </p>

                {/* Call to Action Button (Optional) */}
                {/* <button
                    onClick={handleCreateProject}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-800 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 font-medium">
                    Create New Project
                    <ArrowRight className="w-4 h-4" />
                </button> */}
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-50 rounded-full blur-3xl opacity-30"></div>
                <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-purple-50 rounded-full blur-3xl opacity-30"></div>
            </div>
        </div>
    );
}