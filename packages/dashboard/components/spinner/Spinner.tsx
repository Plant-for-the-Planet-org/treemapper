// components/Spinner.tsx
import React from 'react'

const Spinner = () => {
  return (
    <div className="spinner-container">
      <div className="spinner" />
      <style jsx>{`
        .spinner-container {
          width: 100%;
          height: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .spinner {
          width: 25px;
          height: 25px;
          border: 4px solid #262626;
          border-top: 4px solid transparent;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}

export default Spinner