import { parsers } from 'www-authenticate'
import { match } from 'semver-match'
import { RequestInit } from 'node-fetch'
import { fetchBuilder, FileSystemCache } from 'node-fetch-cache';

const fetch = fetchBuilder.withCache(new FileSystemCache({
  cacheDirectory: './.fetch-cache',
  ttl: 60 * 60 * 1000 // 1 hour,
}));

function ociToHttps(url: string, path: string) {
  let requestURL = new URL(url);
  requestURL.protocol = 'https:';
  requestURL.pathname = "/v2" + requestURL.pathname + path
  let urlToFetch = requestURL.toString().replace(/^oci:\/\//g, 'https://')
  console.log('urlToFetch', urlToFetch)
  return urlToFetch
}

async function request(url: string, redirectUrls: string[], options?: RequestInit) {
  redirectUrls.push(url)

  let requestOptions: RequestInit | null | undefined = { ...options }; // { ...options }
  requestOptions.redirect = 'manual'

  console.log('request', url, options)
  let response = await fetch(url, requestOptions)

  console.log('status', response.status)
  while (response.status >= 300 && response.status < 400) {
    let redirectUrl = response.headers.get('location')
    if (redirectUrl && !redirectUrl?.startsWith('http')) {
      redirectUrl = new URL(redirectUrl, url).toString();
    }

    console.log('redirect', redirectUrl)

    redirectUrls.push(redirectUrl!)
    response = await fetch(redirectUrl!, requestOptions)
  }

  let retryCount = 1
  while (response.status >= 500 && retryCount <= 3) {
    console.log('Response failure, trying again, current status: %d', response.status)
    response = await fetch(redirectUrls[redirectUrls.length - 1], requestOptions)
    retryCount++
  }

  return response
}
interface IRetrieveOptions {
  downloadConfig?: boolean
  headRequest: boolean
}

enum DownloadType {
  Chart = "application/vnd.cncf.helm.chart.content.v1.tar+gzip",
  Config = "application/vnd.cncf.helm.config.v1+json",
  ImageManifest = 'application/vnd.oci.image.manifest.v1+json'
}

export default async function retrieve(url: string, redirectURLs: string[], version: string = "*", options?: IRetrieveOptions): Promise<any> {
  let urlToFetch = url;

  const requestOptions = {
    method: options?.headRequest ? 'HEAD' : 'GET'
  }


  if (url.startsWith('oci://')) {
    const urlToFetch = ociToHttps(url, '/tags/list')

    const mediaType = options?.downloadConfig ?
      DownloadType.Config :
      DownloadType.Chart

    return request(urlToFetch, redirectURLs, requestOptions)
      .then(r => {
        if (r.status === 401) {
          const auth = r.headers.get('www-authenticate');
          const authParsed = new parsers.WWW_Authenticate(auth);
          console.log('Need to authenticate with', authParsed);

          let fetchOptions: RequestInit = { ...requestOptions, headers: {} }
          return request(authParsed.parms.realm + '?service=' + authParsed.parms.service + '&scope=' + authParsed.parms.scope, redirectURLs, fetchOptions)
            .then(r => r.json())
            .then(r => {
              fetchOptions.headers = { ...fetchOptions.headers, Authorization: authParsed.scheme + " " + r.token };
              return request(urlToFetch, redirectURLs, fetchOptions)
            })
            .then(r => r.json())
            .then(r => { console.log(r); return r })
            .then(r => match(version, r.tags))
            .then(r => {
              fetchOptions.headers = { ...fetchOptions.headers, Accept: DownloadType.ImageManifest }
              return request(ociToHttps(url, '/manifests/' + r), redirectURLs, fetchOptions)
            })
            .then(r => r.json())
            .then(r => options?.downloadConfig ? r.config : r.layers.find((l: any) => l.mediaType === DownloadType.Chart))
            .then(r => request(ociToHttps(url, '/blobs/' + r.digest), redirectURLs, fetchOptions))
        }
        return r
      })
      .catch(e => console.log('error', e))
  }


  return request(urlToFetch, redirectURLs, requestOptions)
}