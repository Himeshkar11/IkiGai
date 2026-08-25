import { useEffect } from 'react';
import { getHealthStatus } from '../services/api';
import { useAppContext } from '../context/AppContext';

const useHealthCheck = () => {
  const { setHealthStatus } = useAppContext();

  useEffect(() => {
    let isMounted = true;

    const checkHealth = async () => {
      try {
        const result = await getHealthStatus();
        if (isMounted) {
          setHealthStatus(result);
        }
      } catch (error) {
        if (isMounted) {
          setHealthStatus({ status: 'error', message: error.message });
        }
      }
    };

    checkHealth();

    return () => {
      isMounted = false;
    };
  }, [setHealthStatus]);
};

export default useHealthCheck;
