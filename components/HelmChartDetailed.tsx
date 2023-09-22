
import './Repo.css';
import { Alert, Card, Col, Container, Image, Row, Stack, Toast, ToastContainer } from "react-bootstrap";
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
  [key: string]: { done: boolean, showNotification: boolean, comment?: string }
}

export default function HelmChartDetailed({ repositoryUrl, chartUrl }: HelmChartDetailedProps) {
  const [chart, setChart] = useState<any>();
  const [charts, setCharts] = useState<any>();
  const [loadingDependencies, setLoadingDependencies] = useState<boolean>(true);

  const [analysisState, setAnalysisState] = useState<AnalysisStatus>({})

  const [, setRepository] = useState<any>();
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
        [name]: {
          done: false,
          showNotification: true
        }
      }))

      setLoadingDependencies(true);
    }, []),

    analysisFinishedCallback: useCallback((name: string) => {
      setAnalysisState(analysisState => ({
        ...analysisState,
        [name]: {
          done: true,
          showNotification: true
        }
      }))

      setTimeout(() => {
        if (Object.values(analysisState).every(v => v.done === true)) {
          setLoadingDependencies(false);
        }
      }, 1500)
    }, []),
  }

  if (!chart) return <Loader>Fetching chart details</Loader>

  return <Container>
    <ToastContainer className="p-3" position='top-end'>
      {Object.entries(analysisState)
        // .filter(([k, v]) => !v)
        .map(([k, v]) => <Toast key={k} onClose={() => setAnalysisState(as => ({ ...as, [k]: { ...v, showNotification: false } }))} animation autohide show={v.showNotification} delay={2000}>
          <Toast.Body>{v ? 'Done analysing ' + k : 'Analysing ' + k}</Toast.Body>
        </Toast>)}
    </ToastContainer>

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

    {loadingDependencies ? <Loader>Analysing dependencies</Loader> : <>
      <Card>
        <Card.Header>
          Endpoints accessed
        </Card.Header>
        <Card.Body>
          <p>This section describes the list of HTTP(s) endpoints accessed during helm repository and helm chart installation, including any dependencies this chart uses. The dependencies are discovered recursively.</p>
          <ol>
            {domains.map(d => <li key={d}>{d}</li>)}
          </ol>
        </Card.Body>
      </Card>
    </>
    }

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