import type { NextApiRequest, NextApiResponse } from 'next'
import tar from 'tar';
import { parse } from 'yaml';
import retrieve from './lib/registry-fetch'

type ResponseData = {
  contentType: string | null
  dataSize: number,
  numberOfCharts: number,
  redirectUrls: string[]
  charts: any[]
  chartsYAML: string[]
}


export default async function apiChartHandler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  let originalURL = req.query.url as string;

  if (!originalURL.match('(https?|oci)://')) {
    originalURL = req.query.repositoryUrl + '/' + originalURL
  }

  const redirectUrls: string[] = [];

  const retrieveOptions = { headRequest: Object.keys(req.query).indexOf('head') > -1 };
  let response = await retrieve(originalURL, redirectUrls, req.query.version as string, retrieveOptions)
  let charts: any[] = [];
  let chartsYAML: string[] = [];

  const writeStream = new tar.Parse({
    filter: (path, entry) => path.toLowerCase().endsWith('chart.yaml'),
    onentry: async (entry: tar.ReadEntry) => {
      let data: Buffer = Buffer.alloc(0);
      // Consume the file.
      // Note that the onentry callback **must** consume the file. Otherwise,
      // `tar.Parse` will not proceed to the next file and execution will stop.
      // If you don’t want to consume the file, skip it by returning `false`
      // in the `filter` callback.
      for await (const d of entry) {
        data = Buffer.concat([data, d]);
      }

      const chart = await parse(data.toString('utf-8'));
      chart.path = entry.path
      charts.push(chart)
      chartsYAML.push(data.toString('utf-8'))
    },
  })

  if (!response) {
    return res
      .status(404)
      .json({
        contentType: null,
        dataSize: -1,
        numberOfCharts: -1,
        redirectUrls,
        charts,
        chartsYAML
      })
  }

  response!.body.pipe(writeStream)
    .on('close', () => {
      res
        .status(response!.status)
        .json({
          contentType: response!.headers.get('content-type'),
          dataSize: charts.length || -1,
          numberOfCharts: charts.length,
          redirectUrls,
          charts,
          chartsYAML
        })
    });
}

export const config = {
  api: {
    externalResolver: true,
  },
}