import { Alert, ListGroup } from "react-bootstrap";
import { Log } from "./Log";
import { IHelmChartDependency } from "@/pages/api/repo";
import { HelmChartDependency } from "./HelmChartDependency";


interface HelmChartDependenciesProps {
  charts: any[]
  className?: string
  dependencies?: IHelmChartDependency[]
  repoUrl: string
  reportRecursiveDependencies?: boolean
  fetchDetails?: boolean
  domainsCallback?: (domains: string[]) => void
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

  if (!dependencies) return <Alert className="mt-3 text-bg-light text-secondary">This chart has no dependencies</Alert>;

  return <div className={className}>
    <h5 className="mt-3">Dependencies</h5>
    <ListGroup>
      {dependencies?.map((dep: any, index: number) => <ListGroup.Item style={{ background: 'rgba(0,44,255,0.1)' }} key={dep.name}>
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

