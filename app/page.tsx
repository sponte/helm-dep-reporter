'use client';
import { ChangeEvent, FormEvent, useCallback, useRef, useState } from 'react';
import { Button, Container, Form, InputGroup } from 'react-bootstrap';
import { Log } from './components/Log';
import { useRouter } from 'next/navigation';
import useLocalStorage from '@/lib/UseLocalStorage';
import { onlyUnique } from './onlyUnique';
import { RecentHelmRepositories } from './RecentHelmRepositories';

const logger = Log(Home);

export default function Home() {
  const router = useRouter()
  const [, setRecentHelmRepos] = useLocalStorage('recentHelmRepositories', [])
  const [repo, setRepo] = useState("https://helm.camunda.io/");
  const [validated, setValidated] = useState(false);
  const [error, setError] = useState<string>();

  logger('%s', repo)

  // useEffect(() => {
  //   if (isInitialMount.current) {
  //     isInitialMount.current = false;
  //     return;
  //   }

  //   logger('useEffect %s', repo)

  //   if (repo.match(/(https?|oci):\/\/[^/]+/i)) {
  //     setRepoDetails(repo)
  //   }
  // }, [repo]);

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

    setRecentHelmRepos((prev: string[]) => [repo].concat(prev).filter(onlyUnique).slice(-10))

    logger('form.checkValidity()', form.checkValidity())
    router.push('/repository?url=' + repo)
  };

  return (
    <Container>
      <Form
        className='mt-5'
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
              placeholder='Enter Helm repository or oci:// chart URL'
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

      <RecentHelmRepositories className='mt-3' />

    </Container>
  );
}

