import { useEffect } from 'react';
import { getHealthStatus } from '../services/api';
import { useAppContext } from '../context/AppContext';

const useHealthCheck = () => {
  const { runHealthCheck } = useAppContext();

  useEffect(() => {
    runHealthCheck();
  }, [runHealthCheck]);
};

export default useHealthCheck;
