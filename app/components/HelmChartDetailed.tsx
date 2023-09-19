
import './Repo.css';
import { Alert, Container, Stack } from "react-bootstrap";
import { HelmRepository } from "./HelmRepository";
import { UrlTest } from "./UrlTest";
import { useCallback, useEffect, useState } from 'react';
import { HelmChartDependencies } from './HelmChartDependencies';
import { onlyUnique } from '../onlyUnique';
import util from 'util';

interface HelmChartDetailedProps {
  chartUrl: string
  repositoryUrl: string
}

export default function HelmChartDetailed({ repositoryUrl, chartUrl }: HelmChartDetailedProps) {
  const [chart, setChart] = useState<any>();
  const [charts, setCharts] = useState<any>();
  const [repository, setRepository] = useState<any>();
  const [domains, setDomains] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/chart?url=' + chartUrl)
      .then(r => r.json())
      .then(cd => {
        setChart(cd.charts[0]);
        setCharts(cd.charts);
      });

    fetch('/api/repo?url=' + repositoryUrl)
      .then(r => r.json())
      .then(cd => {
        setRepository(cd);
      }
      );
  }, [chartUrl, repositoryUrl]);

  const updateDomains = useCallback((newDomains: string[]) => {
    setDomains(domains =>
      domains
        .concat(newDomains)
        .map(d => new URL(d))
        .map(d => util.format("%s//%s", d.protocol, d.hostname))
        .sort()
        .filter(onlyUnique)
    );
  }, [])


  return <Container>
    <h1>Helm Chart details</h1>
    <p>Repository: {repositoryUrl}</p>
    <p>Chart: {chartUrl}</p>

    <Alert>
      <h2>Domains</h2>
      <ol>
        {domains.map(d => <li key={d}>{d}</li>)}
      </ol>
    </Alert>

    <Stack gap={3}>
      <UrlTest url={chartUrl} chartRequest domainsCallback={updateDomains} />
      <UrlTest url={repositoryUrl} domainsCallback={updateDomains} />
    </Stack>

    <HelmChartDependencies
      repoUrl={repositoryUrl}
      dependencies={chart?.dependencies}
      charts={charts}
      fetchDetails
      domainsCallback={updateDomains}
      reportRecursiveDependencies
    />
  </Container>

};