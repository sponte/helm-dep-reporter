import { useEffect, useState } from "react";
import { Alert } from "react-bootstrap";

interface UrlStatus {
  redirectUrls: string[];
}

interface UrlTestProps {
  url: string
  chartRequest?: boolean
  domainsCallback: (domains: string[]) => void
}

export function UrlTest({ url, chartRequest, domainsCallback }: UrlTestProps) {
  const [urlStatus, setUrlStatus] = useState<UrlStatus>();
  useEffect(() => {
    const requestUrl = chartRequest ?
      '/api/chart?head&url=' + url :
      '/api/repo?head&url=' + url

    fetch(requestUrl)
      .then(response => response.json())
      .then(urlStatus => {
        setUrlStatus(urlStatus)
        domainsCallback(urlStatus.redirectUrls)
      });
  }, [url, domainsCallback, chartRequest]);

  if (!urlStatus) return <div>Verifying url...</div>;

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
