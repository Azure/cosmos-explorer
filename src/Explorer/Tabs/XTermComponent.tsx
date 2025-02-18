import React, { useEffect, useRef } from "react";
import { XTerm } from "xterm-for-react";

const XTermComponent: React.FC = () => {
  const xtermRef = useRef(null);

  useEffect(() => {
    if (xtermRef.current) {
      xtermRef.current.terminal.writeln("Hello, World!");
    }
  }, []);

  return <XTerm ref={xtermRef} />;
};

export default XTermComponent;
