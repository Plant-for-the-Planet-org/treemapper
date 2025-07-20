// components/Spinner.tsx
import React from 'react'

const Spinner = () => {
  return (
    <>
      <div className="spinner" />
      <style jsx>{`
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
    </>
  )
}
export default Spinner