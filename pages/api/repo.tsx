import type { NextApiRequest, NextApiResponse } from 'next'
import { parse } from 'yaml';
import retrieve from './lib/registry-fetch'
import { Cache } from 'file-system-cache';
import fs from 'fs';

const yamlParsingCache = new Cache({
  basePath: fs.mkdtempSync('/tmp/.fetch-cache'),
  ns: 'yaml',
  ttl: 60 * 60 * 24 * 7 // 1 week
})

const yamlParse = (data: string) => {
  console.debug('yamlParse')
  return parse(data);
}

const parseYamlWithCache = (cacheKey: string, data: string) => {
  return yamlParsingCache
    .get(cacheKey)
    .then(v => {
      if (!v) {
        console.debug('No cache found, parsing yaml')
        return yamlParse(data)
      }

      console.debug('Cache found, returning')
      return v
    })
    .then((dataObject: any) => {
      yamlParsingCache.set(cacheKey, dataObject);
      return dataObject
    });
}

export interface IHelmChartDependency {
  name: string
  version: string
  repository: string
}

export interface IHelmChart {
  annotations: Map<string, string>
  apiVersion: string
  appVersion: string
  created: string
  description: string
  digest: string
  home: string
  icon: string
  keywords: string[]
  maintainers: { name: string, email: string, url: string }[]
  name: string
  sources: string[]
  urls: string[]
  version: string
  dependencies: IHelmChartDependency[]
}

interface IHelmRepositoryEntriesMap {
  [key: string]: IHelmChart[]
}

export interface IHelmRepository {
  apiVersion: string
  entries: IHelmRepositoryEntriesMap
  generated: string
  comments?: string
}

export type IHelmRepositoryResponse = {
  data: IHelmRepository
  status: Number
  redirectUrls: string[]
}

export default async function apiRepoHandler(
  req: NextApiRequest,
  res: NextApiResponse<IHelmRepositoryResponse>
) {
  const originalURL = req.query.url as string;
  const headRequest = Object.keys(req.query).indexOf('head') !== -1

  const { response, redirectUrls, dataPromise }: { response: any; redirectUrls: string[]; dataPromise: Promise<IHelmRepository>; } = await retrieveHelmRepositoryDetails(originalURL, req, headRequest);

  res
    .status(response.status)
    .json({
      status: response.status,
      redirectUrls: redirectUrls,
      data: (await dataPromise)
    })
}

export async function retrieveHelmRepositoryDetails(originalURL: string, req: NextApiRequest, headRequest: boolean) {
  let urlToFetch = originalURL.trim().replace(/\/$/, '');
  if (originalURL.startsWith('https://')) {
    console.log('Need to override the url');
    urlToFetch += '/index.yaml';
  }

  let redirectUrls: string[] = [];
  let response = await retrieve(
    urlToFetch,
    redirectUrls,
    req.query.version as string,
    {
      downloadConfig: true,
      headRequest
    }
  );

  const dataPromise = new Promise<IHelmRepository>(resolve => {
    if (headRequest) {
      return resolve({
        apiVersion: 'v1',
        entries: {},
        generated: new Date().toISOString(),
        comments: 'HEAD request'
      });
    }

    if (!response) {
      return resolve({
        apiVersion: 'v1',
        entries: {},
        generated: new Date().toISOString(),
        comments: 'No response'
      })
    }

    // resolve(response.text().then((data: string) => {
    //   const returnValue = data
    //   return returnValue;
    // }));
    resolve(response.text().then((rt: string) => parseYamlWithCache(response!.url, rt)).then((data: IHelmRepository) => {
      const returnValue = {
        apiVersion: data.apiVersion,
        entries: {
          ...data.entries,
        },
        generated: data.generated,
        comments: data.comments
      }
      return returnValue;
    }));
  });
  return { response, redirectUrls, dataPromise };
}

export const config = {
  api: {
    responseLimit: '6mb',
  },
}