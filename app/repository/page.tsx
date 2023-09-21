'use client';
import { useSearchParams } from "next/navigation";
import { HelmRepository } from "../components/HelmRepository";
import { Alert, Breadcrumb, Container, Row } from "react-bootstrap";


export default function Repository() {
  const searchParams = useSearchParams()
  const repositoryUrl = searchParams?.get('url')

  if (!repositoryUrl) return <Container>
    <Row>
      <Alert variant="danger">
        Please provide a repository url as a query parameter, e.g. <Alert.Link href="/repository?url=https://helm.camunda.io/">https://helm.camunda.io/</Alert.Link>
      </Alert>
    </Row>
  </Container>

  return <Container>
    <Row>
      <Breadcrumb>
        <Breadcrumb.Item href="/">Home</Breadcrumb.Item>
        <Breadcrumb.Item active href={"/repository?url=" + searchParams?.get('url')}>Repository</Breadcrumb.Item>
      </Breadcrumb>
    </Row>
    <Row>
      <HelmRepository
        repositoryUrl={repositoryUrl}
        domainsCallback={() => { }}
      />
    </Row>
  </Container>
}