'use client';
import { useSearchParams } from "next/navigation";
import { HelmRepository } from "../../components/HelmRepository";
import { Alert, Breadcrumb, Container, Row } from "react-bootstrap";
import HelmChartDetailed from "../../components/HelmChartDetailed";


export default function Repository() {
  const searchParams = useSearchParams()
  const chartUrl = searchParams?.get('url')
  const repositoryUrl = searchParams?.get('repositoryUrl')
  const repositoryHost = repositoryUrl ? new URL(repositoryUrl).hostname : undefined

  if (!chartUrl) return <Container>
    <Row>
      <Alert variant="danger">
        Please provide a chart `url` as a query parameter
      </Alert>
    </Row>
  </Container>

  if (!repositoryUrl) return <Container>
    <Row>
      <Alert variant="danger">
        Please provide a repositoryUrl as a query parameter, e.g. <Alert.Link href="/repository?url=https://helm.camunda.io/">https://helm.camunda.io/</Alert.Link>
      </Alert>
    </Row>
  </Container>

  return <Container>
    <Row className="mt-3">
      <Breadcrumb>
        <Breadcrumb.Item href="/">home</Breadcrumb.Item>
        <Breadcrumb.Item href={"/repository?url=" + searchParams?.get('repositoryUrl')}>{repositoryHost}</Breadcrumb.Item>
        <Breadcrumb.Item active href={"/chart?url=" + searchParams?.get('url')}>{"chart"}</Breadcrumb.Item>
      </Breadcrumb>
    </Row>
    <Row>
      <HelmChartDetailed
        chartUrl={chartUrl}
        repositoryUrl={repositoryUrl}
      />
    </Row>
  </Container>
}