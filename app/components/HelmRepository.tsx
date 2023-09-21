import { useCallback, useEffect, useState } from "react";
import smeverMatch from 'semver-match';
import { Accordion, Alert, Container, Spinner } from "react-bootstrap";
import HelmChart from "./HelmChart";
import { Log } from "./Log";

interface IHelmRepository {
  entries: any[]
}

interface HelmRepositoryProps {
  repositoryUrl: string
  name?: string
  version?: string
  domainsCallback: (domains: string[]) => void
}

const logger = Log(HelmRepository)

export function HelmRepository(props: HelmRepositoryProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [repo, setRepo] = useState<IHelmRepository>();
  const [error, setError] = useState()
  const [redirects, setRedirects] = useState([]);
  const [activeChart, setActiveChart] = useState<string>('');

  logger('HelmRepository', props)

  const getHelmRepositoryDetails = useCallback(async (repo: string, name?: string, version?: string) => {
    let response;
    logger('getHelmRepositoryDetails', repo)
    try {
      let repoUrl = new URL(repo);

      repoUrl.pathname = repoUrl.pathname.replace(/\/\//g, '/');

      response = await fetch("/api/repo?url=" + repoUrl + (repoUrl.protocol === "oci:" ? '/' + name : '') + (version ? '&version=' + version : ''));

      if (response.status !== 200) return;

      const responseData = await response.json();
      setRedirects(responseData.redirectUrls);
      props.domainsCallback?.(responseData.redirectUrls);

      // logger(Object.keys(parsed.entries))
      setRepo(responseData.data);
    } catch (err: any) {
      console.error('Failed to download repository details');
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [props]);

  useEffect(() => {
    if (!props.repositoryUrl) return;
    if (!props.repositoryUrl.match(/(https?|oci):\/\/[^/]+/i)) return;

    getHelmRepositoryDetails(props.repositoryUrl, props.name, props.version);
  }, [props.repositoryUrl, getHelmRepositoryDetails, props.name, props.version]);


  if (loading) return <Container>
    <Spinner animation="grow" />
    Loading charts from {props.repositoryUrl}
  </Container>

  if (error) return <Alert variant="danger">
    <Alert.Heading>Error retrieving chart</Alert.Heading>
    {error}
  </Alert>

  if (!repo) return <></>; // <Spinner animation="border" />

  if (props.name && Object.keys(repo.entries).indexOf(props.name) === -1) return <div className="panel">Chart {props.name} not found in repository {props.repositoryUrl}</div>;

  const chartNames = Object.keys(repo.entries);
  const charts = Object.values(repo.entries);

  logger('chartNames', chartNames)
  logger('charts', charts)

  const chartVersions = charts
    .find((charts: any[]) => (charts[0].name === props.name));

  const requiredVersion = smeverMatch(props.version || '*', chartVersions?.map((cv: any) => cv.version) || []);
  const chartVersion = chartVersions?.find((cv: any) => cv.version === requiredVersion);


  return (<>
    <Accordion defaultActiveKey={props.name && props.repositoryUrl + '0evt'} className="mt-3 mb-3">
      {/* {!props.name && <h2>Helm Repository {props.repositoryUrl}</h2>}
      {props.name && <h2>Chart {props.name}:{props.version} in repository {props.repositoryUrl}</h2>} */}
      {redirects.length > 1 && redirects.splice(1).map(r => <p key={r}>Redirect: {r}</p>)}

      {!props.name && !props.version &&
        <>
          <Accordion >
            {chartNames.map((chartName: string, index: number) =>
              <Accordion.Item key={index} eventKey={index + 'chartName'}>
                <Accordion.Header>{chartName}</Accordion.Header>
                <Accordion.Body style={{ padding: 0 }}>
                  <Accordion flush>
                    {charts[index].map((chartVersion: any, index2: number) =>
                      <Accordion.Item key={index2} eventKey={index + 'chartName' + index2 + 'chartVersion'}>
                        <Accordion.Header >{chartVersion.version}</Accordion.Header>
                        <Accordion.Body onEntered={() => setActiveChart(index + 'chartName' + index2 + 'chartVersion')}>
                          <HelmChart
                            chart={chartVersion}
                            repositoryUrl={props.repositoryUrl}
                            domainsCallback={props.domainsCallback}
                          />
                        </Accordion.Body>
                      </Accordion.Item>
                    )}
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
            )}
          </Accordion>
        </>
      }
    </Accordion >
  </>);
}
