import { CommitResult } from '../types/azureDevops';
import { formatCsvDate } from './dateUtils';

export function escapeCsv(value: string): string {
  const sanitized = String(value ?? '').replace(/\r?\n/g, ' ');
  return sanitized.includes(';') || sanitized.includes('"')
    ? `"${sanitized.replace(/"/g, '""')}"`
    : sanitized;
}

export function buildCommitCsv(commits: CommitResult[]): string {
  const lines = [
    'Autor;Repositorio;Branch;Data;Mensagem;CommitID',
    ...commits.map((commit) =>
      [
        escapeCsv(commit.author),
        escapeCsv(commit.repository),
        escapeCsv(commit.branch),
        escapeCsv(commit.date ? formatCsvDate(new Date(commit.date)) : ''),
        escapeCsv(commit.message),
        escapeCsv(commit.commitId)
      ].join(';')
    )
  ];

  return `\uFEFF${lines.join('\n')}`;
}
