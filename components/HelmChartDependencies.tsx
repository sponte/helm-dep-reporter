import { useState } from "react";
import HelmChart from "./HelmChart";
import { Alert, Collapse, ListGroup } from "react-bootstrap";
import { Log } from "./Log";
import { IHelmChart, IHelmChartDependency, IHelmRepository } from "@/pages/api/repo";
import { HelmChartDependency } from "./HelmChartDependency";


interface HelmChartDependenciesProps {
  charts: any[]
  className?: string
  dependencies?: IHelmChartDependency[]
  repoUrl: string
  reportRecursiveDependencies?: boolean
  fetchDetails?: boolean
  domainsCallback: (domains: string[]) => void
  analysisStartedCallback?: (name: string) => void
  analysisFinishedCallback?: (name: string) => void
}

const logger = Log(HelmChartDependencies)

export function HelmChartDependencies({
  className,
  charts,
  dependencies,
  repoUrl: repositoryUrl,
  domainsCallback,
  reportRecursiveDependencies,
  fetchDetails,
  analysisStartedCallback,
  analysisFinishedCallback,
}: HelmChartDependenciesProps) {
  const [dependencyUrls, setDependencyUrls] = useState<string[]>([]);

  if (!dependencies) return <Alert className="mt-3 text-bg-light text-secondary">This chart has no dependencies</Alert>;

  return <div className={className}>
    <h6 className="mt-3">Dependencies</h6>
    <ListGroup>
      {dependencies?.map((dep: any, index: number) => <ListGroup.Item key={dep.name + index}>
        <HelmChartDependency
          analysisStartedCallback={analysisStartedCallback}
          analysisFinishedCallback={analysisFinishedCallback}
          charts={charts}
          repositoryUrl={repositoryUrl}
          domainsCallback={domainsCallback}
          fetchDetails={fetchDetails}
          dependency={dep}
        />
      </ListGroup.Item>)}
    </ListGroup>
  </div>;
}

