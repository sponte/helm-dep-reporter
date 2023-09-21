
import './Repo.css';
import { Alert, Col, Container, Image, Row, Stack } from "react-bootstrap";
import { HelmRepository } from "./HelmRepository";
import { UrlTest } from "./UrlTest";
import { useCallback, useEffect, useState } from 'react';
import { HelmChartDependencies } from './HelmChartDependencies';
import util from 'util';
import { onlyUnique } from './onlyUnique';
import { Loader } from './Loader';
interface HelmChartDetailedProps {
  chartUrl: string
  repositoryUrl: string
}

interface AnalysisStatus {
  [key: string]: boolean
}

export default function HelmChartDetailed({ repositoryUrl, chartUrl }: HelmChartDetailedProps) {
  const [chart, setChart] = useState<any>();
  const [charts, setCharts] = useState<any>();
  const [loadingDependencies, setLoadingDependencies] = useState<boolean>(true);

  const [analysisState, setAnalysisState] = useState<AnalysisStatus>({})

  const [repository, setRepository] = useState<any>();
  const [domains, setDomains] = useState<string[]>([]);

  const absoluteChartUrl = chartUrl.startsWith('http') ? chartUrl : repositoryUrl + '/' + chartUrl;

  useEffect(() => {
    fetch('/api/chart?url=' + absoluteChartUrl)
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
  }, [absoluteChartUrl, repositoryUrl]);

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

  const analysisCallbacks = {
    analysisStartedCallback: useCallback((name: string) => {
      setAnalysisState(analysisState => ({
        ...analysisState,
        [name]: false
      }))

      setLoadingDependencies(true);
    }, []),

    analysisFinishedCallback: useCallback((name: string) => {
      setAnalysisState(analysisState => ({
        ...analysisState,
        [name]: true
      }))

      setTimeout(() => {
        if (Object.values(analysisState).every(v => v === true)) {
          setLoadingDependencies(false);
        }
      }, 1000)
    }, []),
  }

  if (!chart) return <Loader>Fetching chart details</Loader>

  return <Container>
    <Row className='align-items-start'>
      <Col sm={2}>
        <Image
          src={chart?.icon}
          width={80}
          height={80}
          alt='Chart icon'
          className=''
        />
      </Col>
      <Col>
        <h1>{chart?.name}</h1>
        <p>Repository: {repositoryUrl}</p>
      </Col>
      <p>{chart?.description}</p>
    </Row>


    <Alert>
      {loadingDependencies ?
        <Loader>
          Analysing chart connectivity requirements
          <ul>
            {Object.keys(analysisState).map(k => <li key={k}>{k}: {analysisState[k] ? 'done' : 'pending'}</li>)}
          </ul>
        </Loader>
        : <>
          <h2>Endpoints accessed</h2>
          <ol>
            {domains.map(d => <li key={d}>{d}</li>)}
          </ol>
        </>
      }
    </Alert>

    <HelmChartDependencies
      {...analysisCallbacks}
      repoUrl={repositoryUrl}
      dependencies={chart?.dependencies}
      charts={charts}
      fetchDetails
      domainsCallback={updateDomains}
      reportRecursiveDependencies
    />

    <Stack gap={3} className='mt-3 visually-hidden'>
      <UrlTest {...analysisCallbacks} url={absoluteChartUrl} chartRequest domainsCallback={updateDomains} />
      <UrlTest {...analysisCallbacks} url={repositoryUrl} domainsCallback={updateDomains} />
    </Stack>

  </Container>

};