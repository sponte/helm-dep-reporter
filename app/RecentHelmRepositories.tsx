'use client';

import useLocalStorage from "@/lib/UseLocalStorage";
import { useEffect, useState } from "react";
import { Row, Spinner } from "react-bootstrap";

export function RecentHelmRepositories(props: React.HTMLAttributes<HTMLElement>) {
  const [recentHelmReposLS, setRecentHelmReposLS] = useLocalStorage('recentHelmRepositories', [])
  const [recentHelmRepos, setRecentHelmRepos] = useState([])

  useEffect(() => {
    setRecentHelmRepos(recentHelmReposLS)
  }, [])

  if (!recentHelmRepos.length) return <Row {...props}>
    <Spinner animation="border" variant="primary" />
    <span className="ml-3">Loading recent Helm repositories...</span>
  </Row>

  return <Row {...props}>
    <h2>Recent Helm Repositories</h2>
    <ul>
      {recentHelmRepos.map((repo: string) => <li key={repo}><a href={'/repository?url=' + repo}>{repo}</a></li>)}
    </ul>
  </Row>;
}
