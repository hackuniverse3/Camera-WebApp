import React, { createContext, useContext } from 'react';

const CameraFeaturesContext = createContext({});

export const CameraFeaturesProvider = ({ children, value }) => {
  return (
    <CameraFeaturesContext.Provider value={value}>
      {children}
    </CameraFeaturesContext.Provider>
  );
};

export const useCameraFeatures = () => {
  const context = useContext(CameraFeaturesContext);
  if (!context) {
    throw new Error('useCameraFeatures must be used within a CameraFeaturesProvider');
  }
  return context;
};

export default CameraFeaturesContext; 