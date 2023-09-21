import { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";
import { Loader } from "./Loader";

interface UrlStatus {
  redirectUrls: string[];
}

interface UrlTestProps {
  url: string
  chartRequest?: boolean
  domainsCallback: (domains: string[]) => void
  analysisStartedCallback: (name: string) => void
  analysisFinishedCallback: (name: string) => void
}

export function UrlTest({ url, chartRequest, domainsCallback, analysisFinishedCallback, analysisStartedCallback }: UrlTestProps) {
  const [urlStatus, setUrlStatus] = useState<UrlStatus>();
  useEffect(() => {
    analysisStartedCallback('URL Test for ' + url)
    const requestUrl = chartRequest ?
      '/api/chart?head&url=' + url :
      '/api/repo?head&url=' + url

    fetch(requestUrl)
      .then(response => response.json())
      .then(urlStatus => {
        setUrlStatus(urlStatus)
        domainsCallback(urlStatus.redirectUrls)
      })
      .finally(() => {
        analysisFinishedCallback('URL Test for ' + url)
      });
  }, [url, domainsCallback, chartRequest, analysisStartedCallback, analysisFinishedCallback]);

  if (!urlStatus) return <Loader>
    Verifying endpoint &apos;<span className="text-grey">${url}</span>&apos; for redirects...
  </Loader>;

  return <Alert variant={urlStatus.redirectUrls.length > 1 ? 'warning' : 'info'}>
    <p>URL test: {url}</p>
    {urlStatus.redirectUrls.length > 1 && <>
      <p>Number of redirects: {urlStatus.redirectUrls.length - 1}</p>
      <ol>
        {urlStatus.redirectUrls.slice(1).map(u => <li key={u}>{u}</li>)}
      </ol>
    </>
      || <p>Direct access, no redirects</p>}
  </Alert>;
}
