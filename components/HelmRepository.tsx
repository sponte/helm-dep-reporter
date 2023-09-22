import { useCallback, useEffect, useState } from "react";
import { Accordion, Alert, Image } from "react-bootstrap";
import HelmChart from "./HelmChart";
import { Log } from "./Log";
import { Loader } from "./Loader";
import { IHelmChart } from "@/pages/api/repo";

interface IHelmRepository {
  apiVersion: string
  generated: string
  entries: { [key: string]: IHelmChart[] }
}

interface HelmRepositoryProps {
  repositoryUrl: string
}

const logger = Log(HelmRepository)

export function HelmRepository(props: HelmRepositoryProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [repo, setRepo] = useState<IHelmRepository>();
  const [error, setError] = useState()
  const [, setRedirects] = useState([]);
  const [, setActiveChart] = useState<string>('');

  logger('HelmRepository', props)

  const getHelmRepositoryDetails = useCallback(async (repo: string, version?: string) => {
    let response;
    logger('getHelmRepositoryDetails', repo)
    try {
      let repoUrl = new URL(repo);

      repoUrl.pathname = repoUrl.pathname.replace(/\/\//g, '/');

      response = await fetch("/api/repo?url=" + repoUrl + (repoUrl.protocol === "oci:" ? '/' + name : '') + (version ? '&version=' + version : ''));

      if (response.status !== 200) return;

      const responseData = await response.json();
      setRedirects(responseData.redirectUrls);

      // logger(Object.keys(parsed.entries))
      setRepo(responseData.data);
    } catch (err: any) {
      console.error('Failed to download repository details');
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!props.repositoryUrl) return;
    if (!props.repositoryUrl.match(/(https?|oci):\/\/[^/]+/i)) return;

    getHelmRepositoryDetails(props.repositoryUrl);
  }, [props.repositoryUrl, getHelmRepositoryDetails]);


  if (loading) return <Loader title={`Loading charts from ${props.repositoryUrl}`} />

  if (error) return <Alert variant="danger">
    <Alert.Heading>Error retrieving chart</Alert.Heading>
    {(error as Error).message}
  </Alert>

  if (!repo) return <></>; // <Spinner animation="border" />

  const charts = Object.entries(repo.entries);
  console.log(repo.entries['common-library'])

  return (<>
    <Accordion defaultActiveKey={props.repositoryUrl + '0evt'} className="mt-3 mb-3">
      <Accordion >
        {charts.map(([chartName, chartVersions], index: number) =>
          <Accordion.Item key={chartName} eventKey={index + 'chartName'}>
            <Accordion.Header>
              <Image
                src={chartVersions[0].icon}
                alt='chart logo'
                className="me-2"
                style={{ width: '1.5rem', height: '1.5rem' }}
              />
              {chartName}
            </Accordion.Header>
            <Accordion.Body style={{ padding: 0 }}>
              <Accordion flush>
                {chartVersions.map((chartVersion: IHelmChart, cvIndex: number) =>
                  <Accordion.Item key={chartVersion.version} eventKey={index + 'chartName' + cvIndex + 'chartVersion'}>
                    <Accordion.Header >{chartVersion.version}</Accordion.Header>
                    <Accordion.Body onEntered={() => setActiveChart(index + 'chartName' + cvIndex + 'chartVersion')}>
                      <HelmChart
                        chart={chartVersion}
                        repositoryUrl={props.repositoryUrl}
                      />
                    </Accordion.Body>
                  </Accordion.Item>
                )}
              </Accordion>
            </Accordion.Body>
          </Accordion.Item>
        )}
      </Accordion>
    </Accordion >
  </>);
}
