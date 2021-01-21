/* eslint-disable react/prop-types */
import React, { useEffect, useRef } from "react";

export const KOCommentIfStart: React.FunctionComponent<{ if: string }> = props => {
  const el = useRef();
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el.current as any).outerHTML = `<!-- ko if: ${props.if} -->`;
  }, []);
  return <div ref={el} />;
};

export const KOCommentEnd: React.FunctionComponent = () => {
  const el = useRef();
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (el.current as any).outerHTML = `<!-- /ko -->`;
  }, []);
  return <div ref={el} />;
};
