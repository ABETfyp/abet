export const getActiveContext = () => {
  const programName = (typeof window !== 'undefined' && localStorage.getItem('currentProgramName')) || 'Program';
  const cycleLabel = (typeof window !== 'undefined' && localStorage.getItem('currentCycleLabel')) || 'Cycle';
  return {
    programName,
    cycleLabel,
    subtitle: `${programName} - ${cycleLabel}`,
  };
};

