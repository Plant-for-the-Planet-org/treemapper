"use client";

import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import Spinner from '@/component/Spinner';

export const TestingModeRibbon = ({ onDisableClick,  }: { onDisableClick: () => void }) => {
  const skewAngle = 20;
  const   topText = "", 
  topStrong = "Explore",
  bottomText = "", 
  bottomStrong = "Mode",
  position = "top-[30vh] left-[1vw]"
  const growAnimation = {
    initial: {
      width: 0,
      paddingLeft: 0,
      paddingRight: 0,
      color: 'transparent'
    },
    animate: {
      width: 'auto',
      paddingLeft: '12px',
      paddingRight: '12px',
      color: 'rgba(255, 255, 255, 0.8)',
      transition: {
        duration: 1,
        ease: [0.68, -0.55, 0.265, 1.55] // ease-in-out-back equivalent
      }
    }
  };

  return (
    <div className={`fixed z-10 h-[125px] ${position} cursor-pointer`} onClick={onDisableClick} >
      {/* Top Ribbon */}
      <motion.div
        className="relative w-[75px] py-1.5 px-3 bg-gray-800 text-white/80 text-sm text-center whitespace-nowrap overflow-hidden rounded-tr-md rounded-bl-md shadow-lg"
        style={{
          transform: `skewY(${skewAngle}deg)`,
          borderRadius: '0 5px 0 5px',
          zIndex: 1
        }}
        variants={growAnimation}
        initial="initial"
        animate="animate"
      >
        <span 
          className="block"
          style={{
            transform: `skewY(-${skewAngle}deg) rotateZ(${skewAngle}deg)`
          }}
        >
          <strong className="text-white uppercase">{topStrong}</strong> {topText}
        </span>
      </motion.div>

      {/* Bottom Ribbon */}
      <motion.div
        className="relative w-[75px] py-1.5 px-3 text-white/80 text-sm text-center whitespace-nowrap overflow-hidden rounded-tl-md rounded-br-md shadow-lg"
        style={{
          transform: `skewY(-${skewAngle}deg) translateY(15px)`,
          background: 'linear-gradient(45deg, #333333, #262626)'
        }}
        variants={growAnimation}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <span 
          className="block"
          style={{
            transform: `skewY(${skewAngle}deg) rotateZ(-${skewAngle}deg)`
          }}
        >
          {bottomText} <strong className="text-white uppercase">{bottomStrong}</strong>
        </span>
      </motion.div>
    </div>
  );
};



const RibbonAward = ({ 
  topText = "This", 
  topStrong = "site",
  bottomText = "is", 
  bottomStrong = "okay",
  position = "top-[70px] left-0"
}) => {
  const skewAngle = 20;
  
  const growAnimation = {
    initial: {
      width: 0,
      paddingLeft: 0,
      paddingRight: 0,
      color: 'transparent'
    },
    animate: {
      width: 'auto',
      paddingLeft: '12px',
      paddingRight: '12px',
      color: 'rgba(255, 255, 255, 0.8)',
      transition: {
        duration: 1,
        ease: [0.68, -0.55, 0.265, 1.55] // ease-in-out-back equivalent
      }
    }
  };

  return (
    <div className={`absolute z-10 h-[125px] ${position}`}>
      {/* Top Ribbon */}
      <motion.div
        className="relative w-[75px] py-1.5 px-3 bg-gray-800 text-white/80 text-sm text-center whitespace-nowrap overflow-hidden rounded-tr-md rounded-bl-md shadow-lg"
        style={{
          transform: `skewY(${skewAngle}deg)`,
          borderRadius: '0 5px 0 5px',
          zIndex: 1
        }}
        variants={growAnimation}
        initial="initial"
        animate="animate"
      >
        <span 
          className="block"
          style={{
            transform: `skewY(-${skewAngle}deg) rotateZ(${skewAngle}deg)`
          }}
        >
          <strong className="text-white uppercase">{topStrong}</strong> {topText}
        </span>
      </motion.div>

      {/* Bottom Ribbon */}
      <motion.div
        className="relative w-[75px] py-1.5 px-3 text-white/80 text-sm text-center whitespace-nowrap overflow-hidden rounded-tl-md rounded-br-md shadow-lg"
        style={{
          transform: `skewY(-${skewAngle}deg) translateY(15px)`,
          background: 'linear-gradient(45deg, #333333, #262626)'
        }}
        variants={growAnimation}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
      >
        <span 
          className="block"
          style={{
            transform: `skewY(${skewAngle}deg) rotateZ(-${skewAngle}deg)`
          }}
        >
          {bottomText} <strong className="text-white uppercase">{bottomStrong}</strong>
        </span>
      </motion.div>
    </div>
  );
};

// Disable Testing Mode Modal
export const DisableTestingModeModal = ({ 
  isOpen, 
  onClose, 
  onConfirm 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => Promise<void>;
}) => {
  const [isDisabling, setIsDisabling] = useState(false);

  const handleConfirm = async () => {
    setIsDisabling(true);
    try {
      await onConfirm();
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setIsDisabling(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-4 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-full">
                    <AlertTriangle size={20} />
                  </div>
                  <h2 className="text-lg font-semibold">Disable Explore Mode</h2>
                </div>
                <button
                  onClick={onClose}
                  disabled={isDisabling}
                  className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="mb-6">
                <p className="text-gray-700 mb-4 leading-relaxed">
                  Are you sure you want to disable Explore Mode?
                </p>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-orange-800">
                      <p className="font-medium mb-1">Important:</p>
                      <p>
                        Any data generated while in Explore Mode will remain here and will not be uploaded to production. You can re-enter Explore Mode anytime via Settings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isDisabling}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isDisabling}
                  className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg hover:from-orange-600 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                >
                  {isDisabling ? (
                    <>
                      <Spinner />
                      Disabling...
                    </>
                  ) : (
                    'Yes, Disable'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
