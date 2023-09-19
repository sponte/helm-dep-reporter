import { useEffect, useState } from "react";
import { Accordion, Alert, Spinner } from "react-bootstrap";
import { match } from 'semver-match';
import { IHelmChart, IHelmRepositoryResponse } from "@/pages/api/repo";
import SyntaxHighlighter from "react-syntax-highlighter";
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { HelmChartDependencies } from "./HelmChartDependencies";

export interface HelmChartDependencyProps {
  dependency: any
  repositoryUrl: string
  fetchDetails?: boolean
  charts?: any[]
  domainsCallback: (domains: string[]) => void
}

export function HelmChartDependency({ dependency, charts, domainsCallback, repositoryUrl, fetchDetails }: HelmChartDependencyProps) {
  const getInternalChart = (name: string) => {
    return charts
      ?.find((c: any) => c.name === name);
  };

  const [error, setChartRetrievalError] = useState<string>();
  const [chart, setChart] = useState<IHelmChart>();
  const [chartYAML, setChartYAML] = useState('');

  const retrieveChart = (url: string) => {
    return fetch(url)
      .then(r => r.json())
      .then(r => {
        domainsCallback(r.redirectUrls);
        setChart(r.charts[0]);
        setChartYAML(r.chartsYAML[0]);
      });
  };

  useEffect(() => {
    if (!fetchDetails) return;

    if (dependency.repository === "") {
      setChart(getInternalChart(dependency.name));
    }

    if (dependency.repository.startsWith('oci://')) {
      retrieveChart('/api/chart?url=' + dependency.repository + '/' + dependency.name + '&version=' + dependency.version);
    }

    if (dependency.repository.startsWith('https://')) {
      fetch('/api/repo?url=' + dependency.repository)
        .then(r => r.json())
        .then((r: IHelmRepositoryResponse) => {
          domainsCallback(r.redirectUrls);

          let chartVersion;
          return r.data.entries[dependency.name]
            ?.find((helmChart: IHelmChart, index, helmChartVersions) => {
              chartVersion ||= match(dependency.version, helmChartVersions.map((cc: any) => cc.version));
              return helmChart.version === chartVersion;
            });
        })
        .then(c => retrieveChart('/api/chart?url=' + c?.urls[0]))
        .catch(e => setChartRetrievalError('Could not retrieve chart details'));
    }

  }, [fetchDetails, dependency, setChartRetrievalError, setChart, setChartYAML, domainsCallback]);

  if (!charts) {
    return <Alert className="mt-3">No charts</Alert>;
  }

  return <>
    {dependency.name} {dependency.version} ({dependency.repository && 'repository: ' + dependency.repository || 'internal'})

    {fetchDetails && !chart && !error && <Spinner animation="border" />}
    {fetchDetails && chart && <HelmChartDependencies
      charts={charts}
      dependencies={chart?.dependencies}
      domainsCallback={domainsCallback}
      fetchDetails={fetchDetails}
      repoUrl={repositoryUrl} />}

    {/* <Accordion className="mt-3" flush>
          <Accordion.Item eventKey={"0"}>
            <Accordion.Header>Source</Accordion.Header>
            <Accordion.Body>
              <SyntaxHighlighter language="json" style={docco}>
                {JSON.stringify(chart || dependency, null, 2)}
              </SyntaxHighlighter>
            </Accordion.Body>
          </Accordion.Item>
        </Accordion> */}

    {error && <Alert className="mt-3" variant="danger">{error}</Alert>}

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


    {/* <pre>
          {JSON.stringify(chart, null, 2)}
        </pre> */}

    {/* <ListGroup>
          {urls.length > 0 && urls.map(u => <ListGroup.Item key={u}>{u}</ListGroup.Item>
          )}
        </ListGroup> */}

    {/* <pre style={{ whiteSpace: 'pre' }}>Chart: {JSON.stringify(dep)}</pre>
            <pre>URL: {JSON.stringify(dependencyUrls[index])}</pre> */}
    {/* {
          dependency.repository === "" && <HelmChart
            internal
            domainsCallback={domainsCallback}
            repositoryUrl={repositoryUrl}
            chart={getInternalChart(dependency.name)}
            key={dependency.name + 'internal'}
          />
        } */}
  </>;
}
