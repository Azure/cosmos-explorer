import { useEffect, useState } from "react";

const useZoomLevel = (threshold: number = 2): boolean => {
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  useEffect(() => {
    const checkZoom = () => {
      const zoomLevel = window.devicePixelRatio;
      setIsZoomed(zoomLevel >= threshold);
    };

    checkZoom();
    window.addEventListener("resize", checkZoom);
    return () => window.removeEventListener("resize", checkZoom);
  }, [threshold]);

  return isZoomed;
};

export default useZoomLevel;
