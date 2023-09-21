'use client';

import { ChangeEvent, FormEvent, useCallback, useRef, useState } from 'react';
import { Button, Container, Form, InputGroup } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/lib/UseLocalStorage';
import { onlyUnique } from '@/components/onlyUnique';
import { RecentHelmRepositories } from '@/components/RecentHelmRepositories';
import { Log } from '@/components/Log';

const logger = Log(Home);

const someHelmRepos = [
  "https://charts.bitnami.com/bitnami",
  "https://charts.gitlab.io",
  "https://charts.jetstack.io",
  "https://grafana.github.io/helm-charts",
  "https://helm-charts.newrelic.com",
  "https://helm.camunda.io",
  "https://helm.cilium.io",
  "https://helm.gitops.weave.works",
  "https://helm.goharbor.io",
  "https://helm.releases.hashicorp.com",
  "https://helm.traefik.io/traefik",
  "https://istio-release.storage.googleapis.com/charts",
  "https://kubernetes-sigs.github.io/nfs-subdir-external-provisioner/",
  "https://kubernetes.github.io/kube-state-metrics",
  "https://mongodb.github.io/helm-charts",
  "https://open-policy-agent.github.io/gatekeeper/charts",
  "https://prometheus-community.github.io/helm-charts",
]

export default function Home() {
  const router = useRouter()
  const [, setRecentHelmRepos] = useLocalStorage('recentHelmRepositories', someHelmRepos)
  const [repo, setRepo] = useState("");
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState<string>();

  const checkRepoUrl = async (e: ChangeEvent<any>) => {
    const url = e.target?.value

    setValidated(true)
    setRepo(url)
    setError(undefined)
    e.target.setCustomValidity('')

    const browserValidation = e.target.checkValidity()
    logger('e.target.checkValidity()', browserValidation)

    if (!browserValidation) {
      logger('invalid url')
      setError('Please enter a valid URL')
      e.target.setCustomValidity('Please enter a valid URL')
      return
    }

    if (!url.match(/^(https?:\/\/|oci:\/\/)/)) {
      setError('The url must start with either https:// or oci://')
      e.target.setCustomValidity('The url must start with either https:// or oci://')
      return
    }

    logger('Checking URL', url)
    const response = await fetch('/api/repo?head&url=' + url)
    if (response.status !== 200) {
      setError('Could not find index.yaml at ' + url)
      e.target.setCustomValidity('Could not find index.yaml at ' + url)
    }
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    const form = event.currentTarget;
    setValidated(true);
    event.preventDefault();
    event.stopPropagation();

    if (!form.checkValidity()) {
      return
    }

    setRecentHelmRepos((prev: string[]) => [repo].concat(prev).filter(onlyUnique).slice(-25))

    logger('form.checkValidity()', form.checkValidity())
    router.push('/repository?url=' + repo)
  };

  return (
    <Container className='mt-5'>
      <Form
        noValidate
        validated={validated}
        action='/repository'
        method='get'
        onSubmit={handleSubmit}>
        <Form.Group>
          <InputGroup>
            <Form.Control
              required
              type='URL'
              name='url'
              value={repo}
              onChange={e => checkRepoUrl(e)}
              placeholder='Enter Helm Chart repository URL'
              isInvalid={error !== undefined}
            />
            <Button
              type='submit'
            >Inspect</Button>
            <Form.Control.Feedback type="invalid" hidden={error === undefined}>
              {error}
            </Form.Control.Feedback>
          </InputGroup>
        </Form.Group>
      </Form>

      <RecentHelmRepositories className='mt-5' />

    </Container>
  );
}

