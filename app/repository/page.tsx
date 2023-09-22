'use client';
import { useSearchParams } from "next/navigation";
import { HelmRepository } from "../../components/HelmRepository";
import { Alert, Breadcrumb, Container, Row } from "react-bootstrap";


export default function Repository() {
  const searchParams = useSearchParams()
  const repositoryUrl = searchParams?.get('url')

  const repositoryHost = repositoryUrl ? new URL(repositoryUrl).hostname : undefined

  if (!repositoryUrl) return <Container>
    <Row>
      <Alert variant="danger">
        Please provide a repository url as a query parameter, e.g. <Alert.Link href="/repository?url=https://helm.camunda.io/">https://helm.camunda.io/</Alert.Link>
      </Alert>
    </Row>
  </Container>

  return <Container>
    <Row className="mt-3">
      <Breadcrumb>
        <Breadcrumb.Item href="/">home</Breadcrumb.Item>
        <Breadcrumb.Item active href={"/repository?url=" + searchParams?.get('url')}>{repositoryHost}</Breadcrumb.Item>
      </Breadcrumb>
    </Row>
    <Row>
      <HelmRepository
        repositoryUrl={repositoryUrl}
      />
    </Row>
  </Container>
}