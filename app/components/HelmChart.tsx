import { useEffect, useState } from "react";
import { Button, Container, Row, Spinner } from "react-bootstrap";
import { HelmChartDependencies } from "./HelmChartDependencies";
import HelmChartDetailed from "./HelmChartDetailed";
import { useRouter } from "next/navigation";

export interface HelmChartProps {
  fetchDetails?: boolean
  internal?: boolean
  chart: any
  repositoryUrl: string
  domainsCallback: (domains: string[]) => void
}

export default function HelmChart({ chart, fetchDetails, domainsCallback, repositoryUrl: repoUrl, internal }: HelmChartProps) {
  const [chartDetails, setChartDetails] = useState<any>();
  const [charts, setCharts] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (internal) return;
    if (!fetchDetails) return;
    fetch('/api/chart?url=' + chart.urls[0])
      .then(r => r.json())
      .then(cd => {
        setChartDetails(cd.charts[0]);
        setCharts(cd.charts);
      });
  }, [chart, fetchDetails, internal]);

  if (!chart) return <></>;


  return <Container className="mt-3">
    <div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {chart.icon && <img style={{ float: 'left', paddingRight: '.5em' }} src={chart.icon} alt="icon" width={30} />}
      <h5>{chart.name}:{chart.version}</h5>
    </div>
    <div className="mt-3">{chart.description}</div>

    {!internal && <Row>
      <Button
        onClick={() => {
          router.push('/chart?url=' + chart.urls[0] + '&repositoryUrl=' + repoUrl)
        }}
        className="mt-4 mx-auto">
        Analyse dependencies
      </Button>
    </Row>
    }

    {/* {!internal && <>
          <p>URLs:</p>
          <ul>
            {chart.urls.map((u: string) => <li key={u}>{u}</li>)}
          </ul>
          {fetchDetails && chart.urls.map((u: string) => <UrlTest domainsCallback={domainsCallback} key={u} url={u} />)}
        </>} */}

    {!internal && fetchDetails && !chartDetails && <Spinner animation="border" />}

    <HelmChartDependencies
      className="mt-4"
      domainsCallback={domainsCallback}
      charts={charts}
      repoUrl={repoUrl}
      dependencies={chartDetails?.dependencies || chart.dependencies} />
  </Container>;
}
