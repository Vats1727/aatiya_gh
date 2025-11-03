// Helper function to apply responsive styles
export const applyResponsiveStyles = (baseStyles) => {
  const responsiveStyles = { ...baseStyles };
  
  // Apply tablet styles (max-width: 1024px)
  if (window.innerWidth <= 1024 && baseStyles['@media (max-width: 1024px)']) {
    Object.assign(responsiveStyles, baseStyles['@media (max-width: 1024px)']);
  }
  
  // Apply large mobile styles (max-width: 768px)
  if (window.innerWidth <= 768 && baseStyles['@media (max-width: 768px)']) {
    Object.assign(responsiveStyles, baseStyles['@media (max-width: 768px)']);
  }
  
  // Apply small mobile styles (max-width: 480px)
  if (window.innerWidth <= 480 && baseStyles['@media (max-width: 480px)']) {
    Object.assign(responsiveStyles, baseStyles['@media (max-width: 480px)']);
  }
  
  // Remove media query keys
  const { 
    '@media (max-width: 1024px)': mq1024, 
    '@media (max-width: 768px)': mq768, 
    '@media (max-width: 480px)': mq480, 
    ...cleanStyles 
  } = responsiveStyles;
  
  return cleanStyles;
};

// Hook to update styles on window resize
export const useResponsiveStyles = (baseStyles) => {
  const [styles, setStyles] = React.useState(() => applyResponsiveStyles(baseStyles));

  React.useEffect(() => {
    const handleResize = () => {
      setStyles(applyResponsiveStyles(baseStyles));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [baseStyles]);

  return styles;
};
