'use client';

import useLocalStorage from "@/lib/UseLocalStorage";
import { useEffect, useState } from "react";
import { Col, ListGroup, Row, Spinner } from "react-bootstrap";
import { Loader } from "./Loader";
import { useRouter } from "next/navigation";

export function RecentHelmRepositories(props: React.HTMLAttributes<HTMLElement>) {
  const [recentHelmReposLS] = useLocalStorage('recentHelmRepositories', [])
  const [recentHelmRepos, setRecentHelmRepos] = useState<string[]>()
  const router = useRouter()

  useEffect(() => {
    setRecentHelmRepos(recentHelmReposLS)
  }, [recentHelmReposLS])

  if (!recentHelmRepos) return <Loader className="mt-5" title="Loading recent Helm repositories..." />

  if (recentHelmRepos.length === 0) return <>No recent helm repositories</>

  return <Row {...props}>
    <Col>
      <h3>Recent Helm Repositories</h3>
      <ListGroup numbered>
        {recentHelmRepos.map((repo: string) => <ListGroup.Item key={repo} action onClick={() => router.push('/repository?url=' + repo)}><a href={'/repository?url=' + repo}>{repo}</a></ListGroup.Item>)}
      </ListGroup>
    </Col>
  </Row>;
}

