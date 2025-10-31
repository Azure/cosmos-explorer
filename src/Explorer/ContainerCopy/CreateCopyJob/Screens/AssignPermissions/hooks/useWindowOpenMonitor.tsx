import { useEffect, useRef } from "react";

const useWindowOpenMonitor = (url: string, onClose?: () => void, intervalMs = 500) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const openWindowAndMonitor = () => {
    const newWindow = window.open(url, "_blank");
    intervalRef.current = setInterval(() => {
      if (newWindow?.closed) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        if (onClose) {
          onClose();
        }
      }
    }, intervalMs);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  return openWindowAndMonitor;
};

export default useWindowOpenMonitor;
