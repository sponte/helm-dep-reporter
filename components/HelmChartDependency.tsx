import { useEffect, useState } from "react";
import { Accordion, Alert, Spinner } from "react-bootstrap";
import { match } from 'semver-match';
import { IHelmChart, IHelmRepositoryResponse } from "@/pages/api/repo";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { HelmChartDependencies } from "./HelmChartDependencies";
import { Loader } from "../components/Loader";
import util from 'util';

export interface HelmChartDependencyProps extends React.HTMLAttributes<HTMLElement> {
  dependency: any
  repositoryUrl: string
  fetchDetails?: boolean
  charts?: any[]
  domainsCallback?: (domains: string[]) => void

  analysisStartedCallback?: (name: string) => void
  analysisFinishedCallback?: (name: string) => void
}

export function HelmChartDependency({
  dependency,
  charts,
  domainsCallback,
  repositoryUrl,
  fetchDetails,
  analysisStartedCallback,
  analysisFinishedCallback,

  className,
  style,
}: HelmChartDependencyProps) {
  const [error, setChartRetrievalError] = useState<string>();
  const [chart, setChart] = useState<IHelmChart>();
  const [chartYAML, setChartYAML] = useState('');

  useEffect(() => {
    if (!fetchDetails) return;

    const getInternalChart = (name: string) => {
      return charts
        ?.find((c: any) => c.name === name);
    };

    const retrieveChart = async (url: string) => {
      return fetch(url)
        .then(r => r.json())
        .then(r => {
          domainsCallback?.(r.redirectUrls);
          setChart(r.charts[0]);
          setChartYAML(r.chartsYAML[0]);
        });
    };

    analysisStartedCallback?.('Dependency ' + dependency.name);

    if (dependency.repository === "") {
      setChart(getInternalChart(dependency.name));
      analysisFinishedCallback?.('Dependency ' + dependency.name)
    }

    if (dependency.repository.startsWith('oci://')) {
      retrieveChart('/api/chart?url=' + dependency.repository + '/' + dependency.name + '&version=' + dependency.version)
        .finally(() => analysisFinishedCallback?.('Dependency ' + dependency.name))
    }

    if (dependency.repository.startsWith('https://')) {
      const nullCheck = (label?: string) => (c: any) => {
        if (!c) {
          throw new Error(label ?? 'The object is null');
        }
        return c;
      }

      const responseCheck = (label?: string) => (r: void | Response) => {
        if (r && r.status !== 200) {
          throw new Error(label ?? util.format('The response status is not 200: %d', r.status));
        }
        return r;
      }

      let chartVersions: IHelmChart[] = [];

      fetch('/api/repo?url=' + dependency.repository)
        .then(r => responseCheck('Could not retrieve repository details, status is: ' + r.status)(r))
        .then(r => r?.json())
        .then((r: IHelmRepositoryResponse) => {
          if (!r) {
            throw new Error('No repository details');
          }

          r && domainsCallback?.(r.redirectUrls);

          let chartVersion;
          chartVersions = r.data.entries[dependency.name]
          return chartVersions
            .find((helmChart: IHelmChart, index, helmChartVersions) => {
              chartVersion ||= match(dependency.version, helmChartVersions.map((cc: any) => cc.version));
              return helmChart.version === chartVersion;
            })
        })
        .then(v =>
          nullCheck(
            util.format("Could not find chart version in the repository, available versions are: [%s]", chartVersions.map(c => c.version).join(', '))
          )(v)
        )
        .then(c => retrieveChart('/api/chart?url=' + c?.urls[0]))
        .catch(e => { console.error(e); setChartRetrievalError(e.message || 'Could not retrieve chart details') })
        .finally(() => analysisFinishedCallback?.('Dependency ' + dependency.name))
    }

  }, [fetchDetails, dependency, setChartRetrievalError, setChart, setChartYAML, domainsCallback, charts, analysisStartedCallback, analysisFinishedCallback]);

  if (!charts) {
    return <Alert className="mt-3">No charts</Alert>;
  }

  return <div className={className} style={style}>
    {dependency.name} {dependency.version} ({dependency.repository && 'repository: ' + dependency.repository || <span className="text-secondary">internal</span>})

    {error && <Alert className="mt-3" variant="danger">{error}</Alert>}

    {fetchDetails && !chart && !error && <Loader>Loading dependency information</Loader>}
    {chartYAML && <Accordion className="mt-3" flush>
      <Accordion.Item eventKey={"0"}>
        <Accordion.Header>YAML source</Accordion.Header>
        <Accordion.Body>
          <SyntaxHighlighter showLineNumbers language="yaml" style={docco}>
            {chartYAML}
          </SyntaxHighlighter>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>}


    {fetchDetails && chart && <HelmChartDependencies
      analysisStartedCallback={analysisStartedCallback}
      analysisFinishedCallback={analysisFinishedCallback}
      charts={charts}
      dependencies={chart?.dependencies}
      domainsCallback={domainsCallback}
      fetchDetails={fetchDetails}
      repoUrl={repositoryUrl} />}


  </div>;
}
