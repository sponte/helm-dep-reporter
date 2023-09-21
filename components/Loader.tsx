'use client';
import { ReactElement } from "react";
import { Container } from "react-bootstrap";
import { MutatingDots } from "react-loader-spinner";


export function Loader({ title, className, children }: { title?: string; className?: string; children?: React.ReactNode }) {
  return <Container className={`flex-column ${className}`}>
    <MutatingDots
      height="100"
      width="100"
      color="#4fa94d"
      secondaryColor='#4fa94d'
      radius='12.5'
      ariaLabel="mutating-dots-loading"
      wrapperClass="mx-auto flex-column align-items-center" />
    <div className="mx-auto flex-column align-items-center text-center">{title || children}</div>
  </Container>;
}
